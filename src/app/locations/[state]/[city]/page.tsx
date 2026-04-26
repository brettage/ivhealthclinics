import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { US_STATES } from '@/types/clinic'
import ClinicCard from '@/components/ClinicCard'
import type { Metadata } from 'next'

function unslugify(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string }>
}): Promise<Metadata> {
  const { state, city } = await params
  const stateAbbr = state.toUpperCase()
  const stateName = US_STATES[stateAbbr]
  const cityName = unslugify(city)
  if (!stateName) return { title: 'Not Found' }

  return {
    title: `IV Therapy Clinics in ${cityName}, ${stateName}`,
    description: `Compare IV hydration, vitamin drip, and NAD+ therapy clinics in ${cityName}, ${stateAbbr}. View pricing, services, credentials, and more.`,
    alternates: { canonical: `/locations/${state}/${city}` },
  }
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ state: string; city: string }>
}) {
  const { state, city } = await params
  const stateAbbr = state.toUpperCase()
  const stateName = US_STATES[stateAbbr]
  if (!stateName) notFound()

  const cityName = unslugify(city)

  const supabase = await createClient()

  const PAGE_SIZE = 1000
  const allClinics: any[] = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .ilike('state', stateAbbr)
      .ilike('city', cityName)
      .eq('is_iv_clinic', true)
      .eq('enrichment_status', 'enriched')
      .is('duplicate_of', null)
      .order('rating_value', { ascending: false, nullsFirst: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error('Error fetching city clinics:', error)
      break
    }
    if (!data || data.length === 0) break
    allClinics.push(...data)
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        <span>/</span>
        <Link href="/locations" className="hover:text-emerald-600">Locations</Link>
        <span>/</span>
        <Link href={`/locations/${state}`} className="hover:text-emerald-600">{stateName}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{cityName}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900">
        IV Therapy Clinics in {cityName}, {stateAbbr}
      </h1>
      <p className="mt-2 text-gray-500">
        {allClinics.length} clinic{allClinics.length !== 1 ? 's' : ''} found
      </p>

      {/* SEO intro */}
      <div className="mt-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-600 leading-relaxed">
          Browse IV therapy clinics in {cityName}, {stateName}. Compare services, pricing, medical credentials,
          and safety information to find the right IV hydration or vitamin drip provider for your needs.
          {allClinics.some(c => c.mobile_service_available) &&
            ` Mobile IV services are also available in the ${cityName} area.`
          }
        </p>
      </div>

      {allClinics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allClinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">No IV therapy clinics found in {cityName}, {stateAbbr}.</p>
          <Link
            href={`/locations/${state}`}
            className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            ← Browse other cities in {stateName}
          </Link>
        </div>
      )}
    </div>
  )
}
