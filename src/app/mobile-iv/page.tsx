import Link from 'next/link'
import { getMobileIVClinics } from '@/app/actions/clinics'
import ClinicCard from '@/components/ClinicCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile IV Therapy Near You | IV Health Clinics',
  description: 'Find mobile IV therapy providers that come to your home, hotel, or office. Browse concierge IV hydration and vitamin drip services across the US.',
  alternates: { canonical: '/mobile-iv' },
}

export default async function MobileIVPage() {
  const clinics = await getMobileIVClinics()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 mb-2 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Mobile IV Therapy</h1>
        <p className="mt-2 text-gray-500">
          {clinics.length.toLocaleString()} provider{clinics.length !== 1 ? 's' : ''} that come to you — at home, your hotel, or office.
        </p>
      </div>

      <div className="mb-8 p-4 bg-cyan-50 rounded-xl border border-cyan-100">
        <p className="text-sm text-cyan-800 leading-relaxed">
          Mobile IV providers bring licensed nurses or paramedics directly to your location.
          Services typically arrive within 30–60 minutes. Ideal for hangover relief, event wellness,
          post-travel recovery, or anyone who prefers treatment at home.
        </p>
      </div>

      {clinics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic: any) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">No mobile IV providers found yet.</p>
          <Link href="/locations" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700">
            Browse by Location
          </Link>
        </div>
      )}
    </div>
  )
}
