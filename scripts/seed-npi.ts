#!/usr/bin/env node

/**
 * seed-npi.ts — Query NPPES NPI Registry for IV/infusion therapy providers
 *
 * NPPES API notes:
 * - taxonomy_description takes TEXT descriptions (e.g. "Infusion Therapy"), not codes
 * - organization_name matches from the START of the name. Use "*" for wildcard.
 * - Results max 200 per page, paginate with skip
 * - No API key required
 *
 * Usage:
 *   npx tsx scripts/seed-npi.ts
 *   npx tsx scripts/seed-npi.ts --states TX,FL
 *
 * Output: scripts/data/npi-raw.json
 */

import fs from 'fs'
import path from 'path'

const API_BASE = 'https://npiregistry.cms.hhs.gov/api/'
const RESULTS_PER_PAGE = 200
const DELAY_MS = 1200

// Strategy 1: Taxonomy text searches (nationwide, very targeted)
const TAXONOMY_SEARCHES = [
  'Infusion Therapy',
  'Naturopath',
]

// Strategy 2: Organization name wildcard searches (nationwide, NPI-2 orgs only)
const ORG_NAME_SEARCHES = [
  'IV THERAPY*',
  'IV HYDRATION*',
  'IV HEALTH*',
  'IV DRIP*',
  'IV WELLNESS*',
  'IV LOUNGE*',
  'IV BAR*',
  'IV VITAMIN*',
  'IV NUTRITION*',
  'IV INFUSION*',
  'IV REVIVAL*',
  'IV LEAGUE*',
  'IV ME*',
  'DRIP BAR*',
  'DRIP HYDRATION*',
  'DRIP IV*',
  'DRIP DOCTOR*',
  'HYDRATION ROOM*',
  'HYDRATION STATION*',
  'MOBILE IV*',
  'NAD IV*',
  'VITAMIN DRIP*',
  'REVIVE IV*',
  'RESTORE IV*',
  'OASIS IV*',
  'INFUSION*',
  'REJUV*',
]

// Strategy 3: Broader taxonomy + state combos
const STATE_TAXONOMY_SEARCHES = [
  'Naturopath',
  'Integrative Medicine',
]

const ALL_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL',
  'GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
  'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI',
  'SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const args = process.argv.slice(2)
let selectedStates = ALL_STATES
const statesFlag = args.find(a => a.startsWith('--states'))
if (statesFlag) {
  const idx = args.indexOf(statesFlag)
  const val = statesFlag.includes('=') ? statesFlag.split('=')[1] : args[idx + 1]
  if (val) selectedStates = val.split(',').map(s => s.trim().toUpperCase())
}

interface NPPESResult {
  number: string
  enumeration_type: string
  basic: {
    organization_name?: string
    first_name?: string
    last_name?: string
    credential?: string
    name?: string
    status?: string
  }
  addresses: Array<{
    address_1: string
    address_2?: string
    city: string
    state: string
    postal_code: string
    telephone_number?: string
    fax_number?: string
    address_purpose: string
  }>
  taxonomies: Array<{
    code: string
    desc: string
    primary: boolean
    state?: string
    license?: string
  }>
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function queryNPPES(params: Record<string, string>): Promise<{ result_count: number; results: NPPESResult[] | null }> {
  const url = new URL(API_BASE)
  url.searchParams.set('version', '2.1')
  url.searchParams.set('limit', String(RESULTS_PER_PAGE))
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  try {
    const response = await fetch(url.toString())
    if (!response.ok) {
      console.error(`  API error: ${response.status} ${response.statusText}`)
      return { result_count: 0, results: null }
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`  Fetch error:`, error)
    return { result_count: 0, results: null }
  }
}

async function paginatedSearch(params: Record<string, string>, label: string): Promise<NPPESResult[]> {
  const allResults: NPPESResult[] = []
  let skip = 0

  while (true) {
    const data = await queryNPPES({ ...params, skip: String(skip) })

    if (!data.results || data.results.length === 0) {
      if (skip === 0) console.log(`  [${label}] No results`)
      break
    }

    allResults.push(...data.results)
    console.log(`  [${label}] +${data.results.length} (total: ${allResults.length}/${data.result_count})`)

    if (allResults.length >= data.result_count) break
    skip += RESULTS_PER_PAGE
    await sleep(DELAY_MS)
  }

  return allResults
}

async function main() {
  console.log('=== NPPES NPI Registry Seeder for IV Therapy Clinics ===')
  console.log(`States for taxonomy+state search: ${selectedStates.length}`)
  console.log('')

  const startTime = Date.now()
  const allProviders: NPPESResult[] = []

  // Strategy 1: Taxonomy description searches (nationwide)
  console.log('--- Strategy 1: Taxonomy searches (nationwide) ---')
  for (const taxonomy of TAXONOMY_SEARCHES) {
    const results = await paginatedSearch(
      { taxonomy_description: taxonomy },
      `taxonomy: ${taxonomy}`
    )
    allProviders.push(...results)
    await sleep(DELAY_MS)
  }

  // Strategy 2: Organization name wildcard searches (nationwide)
  console.log('\n--- Strategy 2: Organization name searches (nationwide) ---')
  for (const orgName of ORG_NAME_SEARCHES) {
    const results = await paginatedSearch(
      { organization_name: orgName, enumeration_type: 'NPI-2' },
      `org: ${orgName}`
    )
    allProviders.push(...results)
    await sleep(DELAY_MS)
  }

  // Strategy 3: Taxonomy + state combos
  console.log('\n--- Strategy 3: Taxonomy + state searches ---')
  for (const state of selectedStates) {
    for (const taxonomy of STATE_TAXONOMY_SEARCHES) {
      const results = await paginatedSearch(
        { taxonomy_description: taxonomy, state },
        `${state}/${taxonomy}`
      )
      allProviders.push(...results)
      await sleep(DELAY_MS)
    }
  }

  // Deduplicate by NPI number
  const npiSet = new Set<string>()
  const uniqueProviders = allProviders.filter(p => {
    if (npiSet.has(p.number)) return false
    npiSet.add(p.number)
    return true
  })

  const duration = Math.round((Date.now() - startTime) / 1000)

  console.log('\n=== Results ===')
  console.log(`Total raw results: ${allProviders.length}`)
  console.log(`Unique NPIs: ${uniqueProviders.length}`)
  console.log(`Duration: ${duration} seconds`)

  // Save to file
  const outputPath = path.join(__dirname, 'data', 'npi-raw.json')
  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalProviders: allProviders.length,
      uniqueNPIs: uniqueProviders.length,
      durationSeconds: duration,
      states: selectedStates,
    },
    providers: uniqueProviders,
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`\nSaved to: ${outputPath}`)
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)} MB`)
}

main().catch(console.error)
