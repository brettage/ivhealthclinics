import Link from 'next/link'
import { searchClinics } from '@/app/actions/clinics'
import ClinicCard from '@/components/ClinicCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search IV Therapy Clinics',
  description: 'Search and filter IV hydration, vitamin drip, and NAD+ therapy clinics by location, service type, and more.',
  alternates: { canonical: '/search' },
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const serviceType = params.service || ''
  const careSetting = params.care || ''
  const mobileOnly = params.mobile === 'true'

  const clinics = await searchClinics({
    query: query || undefined,
    serviceType: serviceType || undefined,
    careSetting: careSetting || undefined,
    mobileOnly: mobileOnly || undefined,
    limit: 50,
  })

  const hasFilters = query || serviceType || careSetting || mobileOnly

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 mb-2 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {query ? `Results for "${query}"` : 'Browse IV Therapy Clinics'}
        </h1>
        {hasFilters && (
          <p className="mt-1 text-gray-500">
            Found {clinics.length} clinic{clinics.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Search & Filters */}
      <div className="mb-8">
        <form action="/search" method="GET" className="flex gap-2 max-w-2xl">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by city, state, or clinic name..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-cyan-600"
          >
            Search
          </button>
        </form>

        {/* Active Filters */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {query && (
              <FilterChip label={`"${query}"`} href={buildSearchUrl({ ...params, q: undefined })} />
            )}
            {serviceType && (
              <FilterChip label={serviceType.replace(/_/g, ' ')} href={buildSearchUrl({ ...params, service: undefined })} />
            )}
            {careSetting && (
              <FilterChip label={careSetting.replace(/_/g, ' ')} href={buildSearchUrl({ ...params, care: undefined })} />
            )}
            {mobileOnly && (
              <FilterChip label="Mobile Only" href={buildSearchUrl({ ...params, mobile: undefined })} />
            )}
            <Link
              href="/search"
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Link>
          </div>
        )}
      </div>

      {/* Results */}
      {clinics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">No clinics found</h2>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            {query
              ? `We couldn't find any IV therapy clinics matching "${query}". Try a different search or browse by location.`
              : 'Try searching for a city or clinic name, or browse by location.'}
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/locations" className="px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50">
              Browse by Location
            </Link>
            <Link href="/services" className="px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50">
              Browse by Service
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 hover:bg-emerald-100 capitalize"
    >
      {label}
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </Link>
  )
}

function buildSearchUrl(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value)
  }
  const qs = searchParams.toString()
  return qs ? `/search?${qs}` : '/search'
}
