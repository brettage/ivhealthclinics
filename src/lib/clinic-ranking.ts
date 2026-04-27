/**
 * Quality ranking score for IV clinics.
 *
 * Combines data-completeness bonuses with a review-weighted rating term to
 * surface the most informative + highest-quality clinics first, regardless
 * of whether the user has filters applied.
 *
 * Formula:
 *   score = +3 if price_range_min not null
 *         + +2 if service_types.length >= 3
 *         + +2 if care_setting not null
 *         + +2 if mobile_service_available
 *         + (rating_value * log10(rating_count + 1))
 *
 * Bonuses cap at 9 points. Rating term typically lands 5–20 for clinics with
 * meaningful review counts. So data completeness boosts ranking but a heavily
 * reviewed 5.0 clinic still beats a thinly reviewed clinic with all 4 bonuses.
 *
 * Adjust weights here when tuning. Keep all weight changes documented in
 * CLAUDE.md so the next session sees what changed and why.
 */

type ScoreableClinic = {
  price_range_min?: number | null
  service_types?: string[] | null
  care_setting?: string | null
  mobile_service_available?: boolean | null
  rating_value?: number | null
  rating_count?: number | null
}

export function computeClinicScore(clinic: ScoreableClinic): number {
  const hasPricing = clinic.price_range_min !== null && clinic.price_range_min !== undefined
  const hasManyServices = Array.isArray(clinic.service_types) && clinic.service_types.length >= 3
  const hasCareSetting = clinic.care_setting !== null && clinic.care_setting !== undefined && clinic.care_setting !== ''
  const hasMobile = clinic.mobile_service_available === true

  const pricingBonus = hasPricing ? 3 : 0
  const servicesBonus = hasManyServices ? 2 : 0
  const settingBonus = hasCareSetting ? 2 : 0
  const mobileBonus = hasMobile ? 2 : 0

  const rating = Number(clinic.rating_value) || 0
  const reviewCount = Number(clinic.rating_count) || 0
  const ratingTerm = rating * Math.log10(reviewCount + 1)

  return pricingBonus + servicesBonus + settingBonus + mobileBonus + ratingTerm
}

/**
 * Sorts an array of clinics in place by descending quality score.
 * Returns the same array reference for convenience in chained calls.
 */
export function sortByQualityScore<T extends ScoreableClinic>(clinics: T[]): T[] {
  return clinics.sort((a, b) => computeClinicScore(b) - computeClinicScore(a))
}

/**
 * Removes duplicate rows by id. Guards against Supabase pagination instability:
 * without a stable unique sort tiebreaker, the same row can appear on multiple
 * pages when the primary sort column has many ties (nulls in rating_count, etc.).
 */
export function dedupeClinicsById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  return rows.filter(r => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })
}
