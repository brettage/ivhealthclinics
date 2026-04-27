/**
 * State slug resolution and canonical URL generation.
 *
 * Source of truth for converting between three forms of US state identifiers:
 *   - URL slug (lowercase full name, e.g. "florida")
 *   - Full name (e.g. "Florida")
 *   - 2-letter abbreviation (e.g. "FL")
 *
 * Used by both /locations/[state] and /locations/[state]/[city] routes.
 *
 * URL pattern decision (2026-04-27): canonical URLs use full state names
 * (/locations/florida) for SEO. The page handlers also accept abbreviations
 * (/locations/fl) and 301-redirect them to the canonical form via next.config.js.
 */

type StateInfo = { name: string; abbr: string }

export const STATE_BY_SLUG: Record<string, StateInfo> = {
  alabama: { name: 'Alabama', abbr: 'AL' },
  alaska: { name: 'Alaska', abbr: 'AK' },
  arizona: { name: 'Arizona', abbr: 'AZ' },
  arkansas: { name: 'Arkansas', abbr: 'AR' },
  california: { name: 'California', abbr: 'CA' },
  colorado: { name: 'Colorado', abbr: 'CO' },
  connecticut: { name: 'Connecticut', abbr: 'CT' },
  delaware: { name: 'Delaware', abbr: 'DE' },
  florida: { name: 'Florida', abbr: 'FL' },
  georgia: { name: 'Georgia', abbr: 'GA' },
  hawaii: { name: 'Hawaii', abbr: 'HI' },
  idaho: { name: 'Idaho', abbr: 'ID' },
  illinois: { name: 'Illinois', abbr: 'IL' },
  indiana: { name: 'Indiana', abbr: 'IN' },
  iowa: { name: 'Iowa', abbr: 'IA' },
  kansas: { name: 'Kansas', abbr: 'KS' },
  kentucky: { name: 'Kentucky', abbr: 'KY' },
  louisiana: { name: 'Louisiana', abbr: 'LA' },
  maine: { name: 'Maine', abbr: 'ME' },
  maryland: { name: 'Maryland', abbr: 'MD' },
  massachusetts: { name: 'Massachusetts', abbr: 'MA' },
  michigan: { name: 'Michigan', abbr: 'MI' },
  minnesota: { name: 'Minnesota', abbr: 'MN' },
  mississippi: { name: 'Mississippi', abbr: 'MS' },
  missouri: { name: 'Missouri', abbr: 'MO' },
  montana: { name: 'Montana', abbr: 'MT' },
  nebraska: { name: 'Nebraska', abbr: 'NE' },
  nevada: { name: 'Nevada', abbr: 'NV' },
  'new-hampshire': { name: 'New Hampshire', abbr: 'NH' },
  'new-jersey': { name: 'New Jersey', abbr: 'NJ' },
  'new-mexico': { name: 'New Mexico', abbr: 'NM' },
  'new-york': { name: 'New York', abbr: 'NY' },
  'north-carolina': { name: 'North Carolina', abbr: 'NC' },
  'north-dakota': { name: 'North Dakota', abbr: 'ND' },
  ohio: { name: 'Ohio', abbr: 'OH' },
  oklahoma: { name: 'Oklahoma', abbr: 'OK' },
  oregon: { name: 'Oregon', abbr: 'OR' },
  pennsylvania: { name: 'Pennsylvania', abbr: 'PA' },
  'rhode-island': { name: 'Rhode Island', abbr: 'RI' },
  'south-carolina': { name: 'South Carolina', abbr: 'SC' },
  'south-dakota': { name: 'South Dakota', abbr: 'SD' },
  tennessee: { name: 'Tennessee', abbr: 'TN' },
  texas: { name: 'Texas', abbr: 'TX' },
  utah: { name: 'Utah', abbr: 'UT' },
  vermont: { name: 'Vermont', abbr: 'VT' },
  virginia: { name: 'Virginia', abbr: 'VA' },
  washington: { name: 'Washington', abbr: 'WA' },
  'west-virginia': { name: 'West Virginia', abbr: 'WV' },
  wisconsin: { name: 'Wisconsin', abbr: 'WI' },
  wyoming: { name: 'Wyoming', abbr: 'WY' },
  'district-of-columbia': { name: 'District of Columbia', abbr: 'DC' },
}

// Reverse lookup: abbr → slug (built once at module load)
export const SLUG_BY_ABBR: Record<string, string> = Object.entries(STATE_BY_SLUG).reduce(
  (acc, [slug, info]) => {
    acc[info.abbr] = slug
    return acc
  },
  {} as Record<string, string>,
)

/**
 * Resolves a state URL parameter into its canonical form.
 *
 * Accepts: 'fl', 'FL', 'florida', 'Florida', 'new-york', 'NY', etc.
 * Returns: { slug, name, abbr } or null if not a valid state.
 *
 * The slug field is always the canonical full-name slug ('florida'),
 * regardless of how the input was provided. Use this for canonical URLs.
 */
export function resolveState(input: string): { slug: string; name: string; abbr: string } | null {
  if (!input) return null

  const lower = input.toLowerCase().trim()

  // Try as full-name slug first (e.g. 'florida', 'new-york')
  if (STATE_BY_SLUG[lower]) {
    const { name, abbr } = STATE_BY_SLUG[lower]
    return { slug: lower, name, abbr }
  }

  // Try as abbreviation (e.g. 'fl', 'ny')
  const upper = input.toUpperCase().trim()
  if (SLUG_BY_ABBR[upper]) {
    const slug = SLUG_BY_ABBR[upper]
    return { slug, name: STATE_BY_SLUG[slug].name, abbr: upper }
  }

  return null
}

/**
 * Whether the input is using the canonical (full-name) slug form.
 * Used to decide whether to issue a 301 redirect to the canonical URL.
 */
export function isCanonicalStateSlug(input: string): boolean {
  return input === input.toLowerCase().trim() && input in STATE_BY_SLUG
}

/**
 * Builds a canonical state URL from anything that looks like a state.
 * Returns null if the input isn't a valid state.
 */
export function stateUrl(input: string): string | null {
  const resolved = resolveState(input)
  return resolved ? `/locations/${resolved.slug}` : null
}

/**
 * Builds a canonical state+city URL from anything that looks like a state
 * and a city name (or city slug).
 */
export function stateCityUrl(stateInput: string, cityInput: string): string | null {
  const resolved = resolveState(stateInput)
  if (!resolved) return null
  const citySlug = cityInput.toLowerCase().trim().replace(/\s+/g, '-')
  return `/locations/${resolved.slug}/${citySlug}`
}
