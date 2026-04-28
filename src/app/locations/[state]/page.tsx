import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClinicsByState } from '@/app/actions/clinics'
import { resolveState } from '@/lib/state-slugs'
import type { Metadata } from 'next'
import { getStateIntro } from '@/lib/seo-content/states'
import StateIntroSection from '@/components/StateIntroSection'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>
}): Promise<Metadata> {
  const { state } = await params
  const resolved = resolveState(state)
  if (!resolved) return { title: 'State Not Found' }

  return {
    title: `IV Therapy Clinics in ${resolved.name}`,
    description: `Find and compare IV hydration, vitamin drip, and NAD+ therapy clinics in ${resolved.name}. Browse by city.`,
    alternates: { canonical: `/locations/${resolved.slug}` },
  }
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ state: string }>
}) {
  const { state } = await params
  const resolved = resolveState(state)
  if (!resolved) notFound()

  const intro = getStateIntro(resolved.slug)

  // getClinicsByState expects abbreviation. Resolved.abbr is the canonical form.
  const cities = await getClinicsByState(resolved.abbr)
  const totalClinics = cities.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        <span>/</span>
        <Link href="/locations" className="hover:text-emerald-600">Locations</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{resolved.name}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900">
  IV Therapy Clinics in {resolved.name}
</h1>
<p className="mt-2 text-gray-500">
  {totalClinics} clinic{totalClinics !== 1 ? 's' : ''} across {cities.length} cit{cities.length !== 1 ? 'ies' : 'y'}
</p>

<StateIntroSection intro={intro} />

{cities.length > 0 ? (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-8">
    {cities.map(({ city, count }) => (
      <Link
        key={city}
        href={`/locations/${resolved.slug}/${city.toLowerCase().replace(/\s+/g, '-')}`}
        className="group p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
      >
        <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
          {city}
        </p>
        <p className="text-sm text-gray-400 mt-0.5">
          {count} clinic{count !== 1 ? 's' : ''}
        </p>
      </Link>
    ))}
  </div>
) : (
  <div className="text-center py-16">
    <p className="text-gray-500">No IV therapy clinics found in {resolved.name} yet.</p>
    <Link href="/locations" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700">
      ← Browse other states
    </Link>
  </div>
)}
    </div>
  )
}
