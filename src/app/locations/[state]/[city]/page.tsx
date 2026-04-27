import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveState } from '@/lib/state-slugs'
import ClinicCard from '@/components/ClinicCard'
import { sortByQualityScore, dedupeClinicsById } from '@/lib/clinic-ranking'
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
  const resolved = resolveState(state)
  const cityName = unslugify(city)
  if (!resolved) return { title: 'Not Found' }

  return {
    title: `IV Therapy Clinics in ${cityName}, ${resolved.name}`,
    description: `Compare IV hydration, vitamin drip, and NAD+ therapy clinics in ${cityName}, ${resolved.abbr}. View pricing, services, credentials, and more.`,
    alternates: { canonical: `/locations/${resolved.slug}/${city}` },
  }
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ state: string; city: string }>
}) {
  const { state, city } = await params
  const resolved = resolveState(state)
  if (!resolved) notFound()

  const cityName = unslugify(city)

  const supabase = await createClient()

  const PAGE_SIZE = 1000
  const rawClinics: any[] = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .ilike('state', resolved.abbr)
      .ilike('city', cityName)
      .eq('is_iv_clinic', true)
      .eq('enrichment_status', 'enriched')
      .is('duplicate_of', null)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error('Error fetching city clinics:', error)
      break
    }
    if (!data || data.length === 0) break
    rawClinics.push(...data)
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  const allClinics = sortByQualityScore(dedupeClinicsById(rawClinics))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        <span>/</span>
        <Link href="/locations" className="hover:text-emerald-600">Locations</Link>
        <span>/</span>
        <Link href={`/locations/${resolved.slug}`} className="hover:text-emerald-600">{resolved.name}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{cityName}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900">
        IV Therapy Clinics in {cityName}, {resolved.abbr}
      </h1>
      <p className="mt-2 text-gray-500">
        {allClinics.length} clinic{allClinics.length !== 1 ? 's' : ''} found
      </p>

      {/* SEO intro */}
      <div className="mt-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-600 leading-relaxed">
          Browse IV therapy clinics in {cityName}, {resolved.name}. Compare services, pricing, medical credentials,
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
          <p className="text-gray-500">No IV therapy clinics found in {cityName}, {resolved.abbr}.</p>
          <Link
            href={`/locations/${resolved.slug}`}
            className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            ← Browse other cities in {resolved.name}
          </Link>
        </div>
      )}
    </div>
  )
}
