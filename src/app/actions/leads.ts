'use server'

import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'

type LeadResult = {
  success: boolean
  error?: string
}

type ClinicLeadInput = {
  clinic_id: string
  clinic_name?: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  message?: string | null
  honeypot?: string
}

type ContactLeadInput = {
  name: string
  email: string
  phone?: string
  message: string
  honeypot?: string
}

type LeadInsertInput = {
  clinic_id: string | null
  clinic_name?: string | null
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  message?: string | null
  source: 'clinic_profile' | 'contact'
  status: 'new'
  honeypot?: string
}

export async function createLead(input: ClinicLeadInput): Promise<LeadResult> {
  return createLeadRecord({
    clinic_id: input.clinic_id,
    clinic_name: input.clinic_name,
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone,
    message: input.message,
    source: 'clinic_profile',
    status: 'new',
    honeypot: input.honeypot,
  })
}

export async function submitContactLead(input: ContactLeadInput): Promise<LeadResult> {
  const { firstName, lastName } = splitName(input.name || '')

  return createLeadRecord({
    clinic_id: null,
    clinic_name: null,
    first_name: firstName,
    last_name: lastName,
    email: input.email,
    phone: input.phone,
    message: input.message,
    source: 'contact',
    status: 'new',
    honeypot: input.honeypot,
  })
}

async function createLeadRecord(input: LeadInsertInput): Promise<LeadResult> {
  const firstName = input.first_name?.trim()
  const lastName = input.last_name?.trim()
  const email = input.email?.trim()
  const phone = input.phone?.trim() || null
  const message = input.message?.trim() || null

  if (input.honeypot) {
    console.warn('Honeypot triggered — spam submission blocked')
    return { success: true }
  }

  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim()
  if (looksLikeSpam(fullName) || (message && looksLikeSpam(message))) {
    console.warn('Spam content detected — submission blocked:', { fullName, message })
    return { success: true }
  }

  if (!firstName || !email) {
    return { success: false, error: 'Missing required fields' }
  }
  if (input.source === 'clinic_profile' && !input.clinic_id) {
    return { success: false, error: 'Missing clinic ID' }
  }
  if (input.source === 'contact' && !message) {
    return { success: false, error: 'Missing required fields' }
  }
  if (!email.includes('@')) {
    return { success: false, error: 'Invalid email' }
  }

  const supabase = createServiceClient()
  const { data: lead, error: dbError } = await supabase
    .from('leads')
    .insert({
      clinic_id: input.clinic_id,
      first_name: firstName,
      last_name: lastName || '',
      email,
      phone,
      message,
      source: input.source,
      status: input.status,
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('Lead DB write failed:', dbError)
    return { success: false, error: 'Failed to record request' }
  }

  await sendLeadNotification({
    leadId: lead.id,
    clinicId: input.clinic_id,
    clinicName: input.clinic_name?.trim() || null,
    firstName,
    lastName,
    email,
    phone,
    message,
    source: input.source,
  })

  return { success: true }
}

async function sendLeadNotification({
  leadId,
  clinicId,
  clinicName,
  firstName,
  lastName,
  email,
  phone,
  message,
  source,
}: {
  leadId: string
  clinicId: string | null
  clinicName: string | null
  firstName: string
  lastName: string
  email: string
  phone: string | null
  message: string | null
  source: LeadInsertInput['source']
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — lead recorded but no email sent')
    return
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'IVHealthClinics <notifications@ivhealthclinics.com>',
      to: 'info@ivhealthclinics.com',
      subject:
        source === 'clinic_profile'
          ? 'IVHealthClinics Clinic Page Lead'
          : 'IVHealthClinics Contact Request',
      html: `
        <h2>${source === 'clinic_profile' ? 'New Clinic Page Lead' : 'New Contact Request'}</h2>
        <p><strong>Lead ID:</strong> ${escapeHtml(leadId)}</p>
        <p><strong>Name:</strong> ${escapeHtml(`${firstName} ${lastName}`.trim())}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || 'N/A')}</p>
        ${source === 'clinic_profile' ? `<p><strong>Clinic:</strong> ${escapeHtml(clinicName || 'N/A')}</p>` : ''}
        <p><strong>Clinic ID:</strong> ${escapeHtml(clinicId || 'N/A')}</p>
        <p><strong>Source:</strong> ${escapeHtml(source)}</p>
        <h3>Message</h3>
        <p>${escapeHtml(message || 'N/A').replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Review at: <a href="https://supabase.com/dashboard/project/wahzjxidlcfcglmvwqje/editor">Supabase leads table</a></small></p>
      `,
    })
  } catch (emailError) {
    console.error('Lead notification email failed (lead still persisted):', emailError)
  }
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

function looksLikeSpam(value: string): boolean {
  const stripped = value.replace(/\s/g, '')
  return stripped.length > 15 && /^[A-Za-z0-9+/]{15,}$/.test(stripped)
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
