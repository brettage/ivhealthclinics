import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { US_STATES } from '@/types/clinic'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse IV Therapy Clinics by State',
  description: 'Find IV hydration, vitamin drip, and NAD+ therapy clinics in all 50 US states. Browse our comprehensive directory by location.',
  alternates: { canonical: '/locations' },
}

export default async function LocationsPage() {
  const supabase = await createClient()

  // Paginate to bypass Supabase's default 1,000-row limit (same pattern as sitemap)
  // We only need the `state` column, and we filter to visible-in-directory clinics:
  //   - is_iv_clinic = true (semantic IV clinic flag)
  //   - enrichment_status = 'enriched' (excludes rejected/duplicate/no_match rows)
  //   - duplicate_of IS NULL (excludes consolidated NPI duplicates)
  // We don't filter on match_confidence here because address_only rows are still
  // counted toward state coverage even though they're hidden on individual pages.
  const PAGE_SIZE = 1000
  const allRows: Array<{ state: string | null }> = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('clinics')
      .select('state')
      .eq('is_iv_clinic', true)
      .eq('enrichment_status', 'enriched')
      .is('duplicate_of', null)
      .range(offset, offset + PAGE_SIZE - 1)

    if (error || !data || data.length === 0) break

    allRows.push(...(data as Array<{ state: string | null }>))
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  const stateCounts = new Map<string, number>()
  allRows.forEach((row) => {
    if (row.state) {
      const key = row.state.toUpperCase()
      stateCounts.set(key, (stateCounts.get(key) || 0) + 1)
    }
  })

  // Build state list with counts
  const states = Object.entries(US_STATES)
    .map(([abbr, name]) => ({
      abbr,
      name,
      count: stateCounts.get(abbr) || 0,
    }))
    .sort((a, b) => b.count - a.count)

  const totalClinics = Array.from(stateCounts.values()).reduce((a, b) => a + b, 0)
  const statesWithClinics = states.filter(s => s.count > 0).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 mb-2 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">IV Therapy Clinics by State</h1>
        <p className="mt-2 text-gray-500">
          {totalClinics.toLocaleString()} clinics across {statesWithClinics} states
        </p>
      </div>

      {/* States Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {states.map((state) => (
          <Link
            key={state.abbr}
            href={`/locations/${state.abbr.toLowerCase()}`}
            className={`group p-4 rounded-xl border transition-all ${
              state.count > 0
                ? 'border-gray-100 hover:border-emerald-200 hover:shadow-md'
                : 'border-gray-50 opacity-50'
            }`}
          >
            <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
              {state.name}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              {state.count > 0 ? `${state.count} clinic${state.count !== 1 ? 's' : ''}` : 'Coming soon'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
