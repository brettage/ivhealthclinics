'use server'

import { createClient } from '@/lib/supabase/server'

export async function getFeaturedClinics(limit = 6) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('is_iv_clinic', true)
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
  let q = supabase
    .from('clinics')
    .select('*')
    .eq('is_iv_clinic', true)

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

export async function getClinicsByState(state: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinics')
    .select('city')
    .eq('is_iv_clinic', true)
    .ilike('state', state)

  if (error) {
    console.error('Error fetching state clinics:', error)
    return []
  }

  // Group by city and count
  const cityMap = new Map<string, number>()
  data?.forEach((row) => {
    if (row.city) {
      const city = row.city
      cityMap.set(city, (cityMap.get(city) || 0) + 1)
    }
  })

  return Array.from(cityMap.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
}

export async function getClinicCount() {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('clinics')
    .select('*', { count: 'exact', head: true })
    .eq('is_iv_clinic', true)

  if (error) {
    console.error('Error getting clinic count:', error)
    return 0
  }
  return count || 0
}
