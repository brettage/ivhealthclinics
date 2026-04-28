import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'


type ClaimPayload = {
  name: string
  email: string
  clinic_name: string
  phone?: string
  clinic_id?: string | null  // present when user came from a specific clinic page
}

export async function POST(req: Request) {
  let payload: ClaimPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Basic validation — required fields present and look reasonable
  if (!payload.name || !payload.email || !payload.clinic_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!payload.email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  // Persist first, email second. If the email send fails, we still have the lead.
  // If the DB write fails, we don't send the email either — better to bail than
  // create a phantom claim the user thinks went through.
  const supabase = createServiceClient()
  const { data: claim, error: dbError } = await supabase
    .from('claims')
    .insert({
      clinic_id: payload.clinic_id || null,
      clinic_name_input: payload.clinic_name,
      claimer_name: payload.name,
      claimer_email: payload.email,
      claimer_phone: payload.phone || null,
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('Claim DB write failed:', dbError)
    return NextResponse.json({ error: 'Failed to record claim' }, { status: 500 })
  }

  // Email is best-effort. If the API key isn't configured or the send fails,
  // log it but still return success — the claim is already persisted in DB.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'IVHealthClinics <notifications@ivhealthclinics.com>',
        to: 'info@tenafterten.com',
        subject: `Claim Request — ${payload.clinic_name}`,
        html: `
          <h2>New Listing Claim Request</h2>
          <p><strong>Claim ID:</strong> ${claim.id}</p>
          <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
          <p><strong>Clinic:</strong> ${escapeHtml(payload.clinic_name)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(payload.phone || 'N/A')}</p>
          ${payload.clinic_id
            ? `<p><strong>Linked clinic ID:</strong> ${payload.clinic_id}</p>`
            : `<p><em>No clinic link \u2014 claim came from generic /claim page</em></p>`}
          <hr>
          <p><small>Review at: <a href="https://supabase.com/dashboard/project/wahzjxidlcfcglmvwqje/editor">Supabase claims table</a></small></p>
        `,
      })
    } catch (emailError) {
      console.error('Claim email send failed (claim still persisted):', emailError)
    }
  } else {
    console.warn('RESEND_API_KEY not configured — claim recorded but no email sent')
  }

  return NextResponse.json({ success: true, claimId: claim.id })
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
