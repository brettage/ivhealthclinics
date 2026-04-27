import Link from 'next/link'
import { getAllClinics } from '@/app/actions/clinics'
import ClinicCard from '@/components/ClinicCard'
import ClinicFilters from '@/components/ClinicFilters'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IV Therapy Clinics Directory | IV Health Clinics',
  description: 'Browse all IV hydration and vitamin drip clinics in our directory. Find verified IV wellness clinics near you across the US.',
  alternates: { canonical: '/clinics' },
}

export default async function ClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{
    services?: string
    mobile?: string
    pricing?: string
  }>
}) {
  const params = await searchParams
  const filters = {
    servicesOnly: params.services === '1',
    mobileOnly: params.mobile === '1',
    pricingOnly: params.pricing === '1',
  }

  const hasAnyFilter = filters.servicesOnly || filters.mobileOnly || filters.pricingOnly
  const clinics = await getAllClinics(hasAnyFilter ? filters : undefined)

  // Total count for context — only fetched once, no filters
  // (You can replace this with getClinicCount() if you want a live total)
  const totalCount = 2953

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 mb-2 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">IV Therapy Clinics</h1>
        <p className="mt-2 text-gray-500">
          {hasAnyFilter
            ? `${clinics.length.toLocaleString()} of ${totalCount.toLocaleString()} clinics match your filters`
            : `${clinics.length.toLocaleString()} verified IV hydration and vitamin drip clinic${clinics.length !== 1 ? 's' : ''} across the US.`}
        </p>
      </div>

      <ClinicFilters />

      {clinics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic: any) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">
            {hasAnyFilter
              ? 'No clinics match your current filters. Try removing one or more.'
              : 'No clinics found.'}
          </p>
          {hasAnyFilter ? (
            <Link href="/clinics" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Clear all filters
            </Link>
          ) : (
            <Link href="/locations" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Browse by Location
            </Link>
          )}
        </div>
      )}
    </div>
  )
}