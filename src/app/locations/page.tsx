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

  // Get clinic counts per state
  const { data } = await supabase
    .from('clinics')
    .select('state')
    .eq('is_iv_clinic', true)

  const stateCounts = new Map<string, number>()
  data?.forEach((row) => {
    if (row.state) {
      stateCounts.set(row.state.toUpperCase(), (stateCounts.get(row.state.toUpperCase()) || 0) + 1)
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
