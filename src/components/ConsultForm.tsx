'use client'

import { useState } from 'react'
import { createLead } from '@/app/actions/leads'

type ConsultFormProps = {
  clinicId: string
  clinicName: string
}

export default function ConsultForm({ clinicId, clinicName }: ConsultFormProps) {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormState('submitting')
    setErrorMessage('')

    const formData = new FormData(e.currentTarget)
    const lead = {
      clinic_id: clinicId,
      clinic_name: clinicName,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || null,
      message: (formData.get('message') as string) || null,
      honeypot: (formData.get('website') as string) || '',
    }

    const result = await createLead(lead)

    if (!result.success) {
      setFormState('error')
      setErrorMessage(result.error || 'An error occurred. Please try again.')
    } else {
      setFormState('success')
      ;(e.target as HTMLFormElement).reset()
    }
  }

  if (formState === 'success') {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">Request Sent</h4>
          <p className="text-emerald-100 text-sm mb-4">
            Your request has been recorded. {clinicName} can follow up using the contact details you provided.
          </p>
          <button
            onClick={() => setFormState('idle')}
            className="text-sm text-white hover:text-emerald-100 underline"
          >
            Send another request
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="hidden" aria-hidden="true">
        <label htmlFor="consult_website">Website</label>
        <input id="consult_website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {formState === 'error' && (
        <div className="bg-red-500/20 border border-red-300/30 rounded-lg p-3">
          <p className="text-sm text-white">
            {errorMessage || 'An error occurred. Please try again.'}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-emerald-100 mb-1">
            First Name *
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            required
            className="block w-full rounded-lg border-0 bg-white/20 backdrop-blur-sm px-4 py-2.5 text-white placeholder-emerald-100 focus:ring-2 focus:ring-white/50 focus:outline-none"
            placeholder="Jane"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-emerald-100 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            required
            className="block w-full rounded-lg border-0 bg-white/20 backdrop-blur-sm px-4 py-2.5 text-white placeholder-emerald-100 focus:ring-2 focus:ring-white/50 focus:outline-none"
            placeholder="Smith"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-emerald-100 mb-1">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="block w-full rounded-lg border-0 bg-white/20 backdrop-blur-sm px-4 py-2.5 text-white placeholder-emerald-100 focus:ring-2 focus:ring-white/50 focus:outline-none"
          placeholder="jane@example.com"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-emerald-100 mb-1">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="block w-full rounded-lg border-0 bg-white/20 backdrop-blur-sm px-4 py-2.5 text-white placeholder-emerald-100 focus:ring-2 focus:ring-white/50 focus:outline-none"
          placeholder="(555) 123-4567"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-emerald-100 mb-1">
          Message (Optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="block w-full rounded-lg border-0 bg-white/20 backdrop-blur-sm px-4 py-2.5 text-white placeholder-emerald-100 focus:ring-2 focus:ring-white/50 focus:outline-none resize-none"
          placeholder="Tell the clinic what you are looking for..."
        />
      </div>

      <button
        type="submit"
        disabled={formState === 'submitting'}
        className="w-full rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {formState === 'submitting' ? 'Sending...' : 'Request Consultation'}
      </button>

      <p className="text-xs text-emerald-100 text-center">
        By submitting, you agree to be contacted about your request.
      </p>
    </form>
  )
}
