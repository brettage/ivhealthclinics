import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

type ContactPayload = {
  name: string
  email: string
  phone?: string
  message: string
}

export async function POST(req: Request) {
  let payload: ContactPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.name || !payload.email || !payload.message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!payload.email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const { firstName, lastName } = splitName(payload.name)
  const supabase = createServiceClient()
  const { data: lead, error: dbError } = await supabase
    .from('leads')
    .insert({
      clinic_id: null,
      first_name: firstName,
      last_name: lastName,
      email: payload.email,
      phone: payload.phone || null,
      message: payload.message,
      source: 'contact',
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('Contact lead DB write failed:', dbError)
    return NextResponse.json({ error: 'Failed to record contact request' }, { status: 500 })
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'IVHealthClinics <notifications@ivhealthclinics.com>',
        to: 'info@tenafterten.com',
        subject: 'IVHealthClinics Contact Request',
        html: `
          <h2>New IVHealthClinics Contact Request</h2>
          <p><strong>Lead ID:</strong> ${lead.id}</p>
          <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(payload.phone || 'N/A')}</p>
          <p><strong>Source:</strong> contact</p>
          <h3>Message</h3>
          <p>${escapeHtml(payload.message).replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Review at: <a href="https://supabase.com/dashboard/project/wahzjxidlcfcglmvwqje/editor">Supabase leads table</a></small></p>
        `,
      })
    } catch (emailError) {
      console.error('Contact email send failed (lead still persisted):', emailError)
    }
  } else {
    console.warn('RESEND_API_KEY not configured — contact lead recorded but no email sent')
  }

  return NextResponse.json({ success: true, leadId: lead.id })
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
