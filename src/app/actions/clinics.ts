'use server'

import { createClient } from '@/lib/supabase/server'
import { sortByQualityScore, dedupeClinicsById } from '@/lib/clinic-ranking'

/**
 * Standard "directory-visible" filter applied to all consumer-facing queries.
 * Excludes:
 *   - non-IV NPI rows (is_iv_clinic = false)
 *   - rejected/no_match/duplicate enrichment statuses
 *   - NPI rows consolidated into another canonical row
 */
function applyVisibilityFilters<Q extends { eq: any; is: any }>(q: Q): Q {
  return q
    .eq('is_iv_clinic', true)
    .eq('enrichment_status', 'enriched')
    .is('duplicate_of', null)
}


export async function getFeaturedClinics(limit = 6) {
  const supabase = await createClient()
  const q = applyVisibilityFilters(supabase.from('clinics').select('*'))
  const { data, error } = await q
    .order('rating_count', { ascending: false, nullsFirst: false })
    .order('rating_value', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured clinics:', error)
    return []
  }
  return data || []
}

export async function getClinicBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching clinic:', error)
    return null
  }
  return data
}

export async function searchClinics({
  query,
  city,
  state,
  serviceType,
  careSetting,
  mobileOnly,
  limit = 20,
}: {
  query?: string
  city?: string
  state?: string
  serviceType?: string
  careSetting?: string
  mobileOnly?: boolean
  limit?: number
}) {
  const supabase = await createClient()
  let q = applyVisibilityFilters(supabase.from('clinics').select('*'))

  if (query) {
    q = q.or(`name.ilike.%${query}%,city.ilike.%${query}%`)
  }
  if (city) {
    q = q.ilike('city', city)
  }
  if (state) {
    q = q.ilike('state', state)
  }
  if (serviceType) {
    q = q.contains('service_types', [serviceType])
  }
  if (careSetting) {
    q = q.eq('care_setting', careSetting)
  }
  if (mobileOnly) {
    q = q.eq('mobile_service_available', true)
  }

  const { data, error } = await q
    .order('rating_value', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('Error searching clinics:', error)
    return []
  }
  return data || []
}

/**
 * Returns city-level clinic counts for a state, paginating to bypass
 * Supabase's 1,000-row default limit. Visible-clinics only.
 */
export async function getClinicsByState(state: string) {
  const supabase = await createClient()

  const PAGE_SIZE = 1000
  const allRows: Array<{ city: string | null }> = []
  let offset = 0

  while (true) {
    const q = applyVisibilityFilters(
      supabase.from('clinics').select('city').ilike('state', state)
    )
    const { data, error } = await q.range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error('Error fetching state clinics:', error)
      return []
    }
    if (!data || data.length === 0) break

    allRows.push(...(data as Array<{ city: string | null }>))
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  // Group by city and count
  const cityMap = new Map<string, number>()
  allRows.forEach((row) => {
    if (row.city) {
      const city = row.city
      cityMap.set(city, (cityMap.get(city) || 0) + 1)
    }
  })

  return Array.from(cityMap.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
}

export async function getClinicsByServiceType(serviceType: string) {
  const supabase = await createClient()
  const PAGE_SIZE = 1000
  const allRows: any[] = []
  let offset = 0
  while (true) {
    const q = applyVisibilityFilters(
      supabase.from('clinics').select('*').contains('service_types', [serviceType])
    )
    const { data, error } = await q
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) { console.error('Error fetching clinics by service type:', error); break }
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return sortByQualityScore(dedupeClinicsById(allRows))
}

export async function getMobileIVClinics() {
  const supabase = await createClient()
  const PAGE_SIZE = 1000
  const allRows: any[] = []
  let offset = 0
  while (true) {
    const q = applyVisibilityFilters(
      supabase.from('clinics').select('*').eq('mobile_service_available', true)
    )
    const { data, error } = await q
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) { console.error('Error fetching mobile IV clinics:', error); break }
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return sortByQualityScore(dedupeClinicsById(allRows))
}

export async function getAllClinics(filters?: {
  servicesOnly?: boolean
  mobileOnly?: boolean
  pricingOnly?: boolean
}) {
  const supabase = await createClient()
  const PAGE_SIZE = 1000
  const allRows: any[] = []
  let offset = 0
  while (true) {
    let q = applyVisibilityFilters(supabase.from('clinics').select('*'))

    // Apply optional filters from /clinics page chips
    if (filters?.mobileOnly) {
      q = q.eq('mobile_service_available', true)
    }
    if (filters?.pricingOnly) {
      q = q.not('price_range_min', 'is', null)
    }
    if (filters?.servicesOnly) {
      // Postgres distinguishes NULL from empty array {}.
      // Filter out both — only keep rows with at least one service listed.
      q = q.not('service_types', 'is', null)
    }

    const { data, error } = await q
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) { console.error('Error fetching all clinics:', error); break }
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  // Strip empty-array rows for the services filter (Postgres NULL vs {} nuance).
  const deduped = dedupeClinicsById(allRows)
  const filtered = filters?.servicesOnly
    ? deduped.filter(r => Array.isArray(r.service_types) && r.service_types.length > 0)
    : deduped

  // Sort by quality score: data completeness bonuses + review-weighted rating.
  // Surfaces the most informative listings first, regardless of filter state.
  return sortByQualityScore(filtered)
}

/**
 * Counts directory-visible clinics only (not all rows in clinics table).
 * Used for homepage stat. Previously returned total table size including
 * non-IV NPI rows, rejected rows, and duplicates.
 */
export async function getClinicCount() {
  const supabase = await createClient()
  const { count, error } = await applyVisibilityFilters(
    supabase.from('clinics').select('*', { count: 'exact', head: true })
  )

  if (error) {
    console.error('Error getting clinic count:', error)
    return 0
  }
  return count || 0
}
