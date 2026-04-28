'use client'

import { useState } from 'react'

type ClaimFormProps = {
  /**
   * If the user landed on /claim from a specific clinic page, we pre-fill the
   * clinic name and pass through the clinic_id so the resulting claim row is
   * linked to the actual clinic in the DB.
   */
  prefilledClinicName?: string
  clinicId?: string
}

export default function ClaimForm({ prefilledClinicName, clinicId }: ClaimFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      clinic_name: (form.elements.namedItem('clinic_name') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      clinic_id: clinicId ?? null,
    }

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Request received!</h3>
        <p className="text-gray-600">
          We'll review your submission and follow up at your email within 2 business days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name *
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="jane@yourclinic.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="clinic_name" className="block text-sm font-medium text-gray-700 mb-1">
          Clinic Name *
        </label>
        <input
          id="clinic_name"
          name="clinic_name"
          required
          defaultValue={prefilledClinicName}
          readOnly={!!prefilledClinicName}
          className={`w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            prefilledClinicName ? 'bg-gray-50 cursor-not-allowed' : ''
          }`}
          placeholder="AZ IV Medics"
        />
        {prefilledClinicName && (
          <p className="text-xs text-gray-500 mt-1">
            Claiming this listing. Wrong clinic?{' '}
            <a href="/claim" className="text-emerald-600 hover:text-emerald-700 underline">
              Start over
            </a>
            .
          </p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="(623) 555-0100"
        />
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-sm">
          Something went wrong. Please try again or email us at info@tenafterten.com.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-emerald-700 hover:to-cyan-700 transition-all disabled:opacity-60"
      >
        {status === 'submitting' ? 'Submitting...' : 'Submit Claim Request'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        We verify all claims before granting access. Free to claim.
      </p>
    </form>
  )
}
