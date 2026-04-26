import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClinicBySlug } from '@/app/actions/clinics'
import {
  careSettingLabel,
  supervisionLabel,
  serviceTypeLabel,
  formatPriceRange,
} from '@/types/clinic'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare IV Therapy Clinics | IV Health Clinics',
  description: 'Compare IV therapy clinics side by side. Evaluate services, pricing, medical credentials, and safety standards.',
  alternates: { canonical: '/compare' },
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>
}) {
  const { a, b } = await searchParams

  if (!a || !b) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Compare Clinics</h1>
          <p className="mt-2 text-gray-500">
            Compare two IV therapy clinics side by side.
          </p>
        </div>
        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 text-center">
          <p className="text-gray-600">
            To compare clinics, open two clinic detail pages and use the Compare button,
            or add <code className="bg-gray-200 px-1 rounded text-sm">?a=clinic-slug&amp;b=other-clinic-slug</code> to the URL.
          </p>
          <Link
            href="/locations"
            className="mt-4 inline-block px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-cyan-600"
          >
            Browse Clinics
          </Link>
        </div>
      </div>
    )
  }

  const [clinicA, clinicB] = await Promise.all([
    getClinicBySlug(a),
    getClinicBySlug(b),
  ])

  if (!clinicA || !clinicB) notFound()

  const rows: Array<{ label: string; a: React.ReactNode; b: React.ReactNode }> = [
    {
      label: 'Location',
      a: clinicA.city && clinicA.state ? `${clinicA.city}, ${clinicA.state}` : '—',
      b: clinicB.city && clinicB.state ? `${clinicB.city}, ${clinicB.state}` : '—',
    },
    {
      label: 'Rating',
      a: clinicA.rating_value
        ? `${Number(clinicA.rating_value).toFixed(1)} ★ (${clinicA.rating_count ?? 0} reviews)`
        : '—',
      b: clinicB.rating_value
        ? `${Number(clinicB.rating_value).toFixed(1)} ★ (${clinicB.rating_count ?? 0} reviews)`
        : '—',
    },
    {
      label: 'Care Setting',
      a: careSettingLabel(clinicA.care_setting),
      b: careSettingLabel(clinicB.care_setting),
    },
    {
      label: 'Mobile Service',
      a: clinicA.mobile_service_available ? 'Yes' : 'No',
      b: clinicB.mobile_service_available ? 'Yes' : 'No',
    },
    {
      label: 'Supervision',
      a: supervisionLabel(clinicA.supervision_level),
      b: supervisionLabel(clinicB.supervision_level),
    },
    {
      label: 'Price Range',
      a: clinicA.pricing_disclosed
        ? formatPriceRange(clinicA.price_range_min, clinicA.price_range_max)
        : 'Not disclosed',
      b: clinicB.pricing_disclosed
        ? formatPriceRange(clinicB.price_range_min, clinicB.price_range_max)
        : 'Not disclosed',
    },
    {
      label: 'Membership',
      a: clinicA.membership_available ? 'Available' : 'No',
      b: clinicB.membership_available ? 'Available' : 'No',
    },
    {
      label: 'Sterile Compounding',
      a: clinicA.sterile_compounding == null ? '—' : clinicA.sterile_compounding ? 'Yes' : 'No',
      b: clinicB.sterile_compounding == null ? '—' : clinicB.sterile_compounding ? 'Yes' : 'No',
    },
    {
      label: 'Walk-ins',
      a: clinicA.walk_ins_accepted == null ? '—' : clinicA.walk_ins_accepted ? 'Yes' : 'No',
      b: clinicB.walk_ins_accepted == null ? '—' : clinicB.walk_ins_accepted ? 'Yes' : 'No',
    },
    {
      label: 'Services',
      a: clinicA.service_types?.map(serviceTypeLabel).join(', ') || '—',
      b: clinicB.service_types?.map(serviceTypeLabel).join(', ') || '—',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 mb-2 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Compare Clinics</h1>
      </div>

      {/* Clinic headers */}
      <div className="grid grid-cols-3 gap-4 mb-2">
        <div />
        {[clinicA, clinicB].map((clinic) => (
          <div key={clinic.id} className="text-center p-4 bg-white rounded-xl border border-gray-100">
            <h2 className="font-semibold text-gray-900 line-clamp-2">{clinic.name}</h2>
            {clinic.city && clinic.state && (
              <p className="text-sm text-gray-500 mt-1">{clinic.city}, {clinic.state}</p>
            )}
            <Link
              href={`/clinics/${clinic.slug}`}
              className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View Full Profile →
            </Link>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-3 gap-4 px-4 py-3 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
          >
            <div className="text-sm font-medium text-gray-600">{row.label}</div>
            <div className="text-sm text-gray-900">{row.a}</div>
            <div className="text-sm text-gray-900">{row.b}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        Want to compare different clinics?{' '}
        <Link href="/locations" className="text-emerald-600 hover:text-emerald-700">
          Browse the directory
        </Link>
      </p>
    </div>
  )
}
