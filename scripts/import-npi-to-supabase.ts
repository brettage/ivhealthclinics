#!/usr/bin/env node

/**
 * import-npi-to-supabase.ts — Import NPI data to Supabase
 *
 * Reads npi-raw.json, deduplicates by address, formats names/phones,
 * generates slugs, and upserts to Supabase clinics table.
 *
 * Usage:
 *   npx tsx scripts/import-npi-to-supabase.ts
 *   npx tsx scripts/import-npi-to-supabase.ts --dry-run   # Preview without writing
 *
 * Requires: .env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   (Next.js names: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY also checked)
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const DRY_RUN = process.argv.includes('--dry-run')

// ============================================
// Formatting utilities
// ============================================

const UPPERCASE_WORDS = new Set([
  'MD', 'DO', 'PA', 'NP', 'RN', 'LPN', 'BSN', 'MSN', 'DNP', 'PHD',
  'LLC', 'PC', 'PLLC', 'INC', 'CORP', 'LTD', 'LP', 'DBA',
  'IV', 'IM', 'NAD', 'USA', 'US',
  'II', 'III', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
])

const LOWERCASE_WORDS = new Set([
  'of', 'the', 'and', 'in', 'at', 'to', 'for', 'by', 'on', 'with', 'a', 'an',
])

function titleCase(str: string): string {
  if (!str) return ''
  return str
    .split(' ')
    .map((word, index, arr) => {
      const upper = word.toUpperCase()
      if (UPPERCASE_WORDS.has(upper)) return upper
      if (LOWERCASE_WORDS.has(word.toLowerCase()) && index !== 0 && index !== arr.length - 1) {
        return word.toLowerCase()
      }
      if (/^mc/i.test(word) && word.length > 2) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

function formatPhone(phone: string | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return phone // Return as-is if can't format
}

function generateSlug(name: string, city?: string, state?: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // If slug is too short, append city/state
  if (slug.length < 4 && city && state) {
    slug = `${slug}-${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`
  }

  return slug || 'clinic'
}

// ============================================
// Data processing
// ============================================

interface RawProvider {
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
    address_purpose: string
  }>
  taxonomies: Array<{
    code: string
    desc: string
    primary: boolean
  }>
}

interface ProcessedClinic {
  name: string
  slug: string
  address: string
  city: string
  state: string
  zip: string
  phone: string | null
  clinician_npi_numbers: string[]
  data_sources: string[]
  is_iv_clinic: boolean
  verified: boolean
  mobile_service_available: boolean
}

function getProviderName(provider: RawProvider): string {
  if (provider.basic.organization_name) {
    return titleCase(provider.basic.organization_name)
  }
  const parts = [
    provider.basic.first_name,
    provider.basic.last_name,
  ].filter(Boolean)

  let name = titleCase(parts.join(' '))
  if (provider.basic.credential) {
    name += `, ${provider.basic.credential.replace(/\./g, '')}`
  }
  return name
}

function getLocationAddress(provider: RawProvider) {
  // Prefer LOCATION address over MAILING
  const locationAddr = provider.addresses.find(a => a.address_purpose === 'LOCATION')
  return locationAddr || provider.addresses[0]
}

function isLikelyIVClinic(provider: RawProvider): boolean {
  const name = (provider.basic.organization_name || provider.basic.name || '').toLowerCase()
  const ivKeywords = [
    'iv ', 'iv-', 'i.v.', 'infusion', 'hydration', 'drip', 'vitamin drip',
    'nad+', 'nad ', 'wellness drip', 'iv lounge', 'iv bar', 'drip bar',
    'mobile iv', 'iv therapy', 'iv health', 'vitamin infusion',
  ]
  return ivKeywords.some(kw => name.includes(kw))
}

function isMobileService(provider: RawProvider): boolean {
  const name = (provider.basic.organization_name || provider.basic.name || '').toLowerCase()
  return name.includes('mobile') || name.includes('concierge') || name.includes('on-demand')
}

function processProviders(providers: RawProvider[]): ProcessedClinic[] {
  // Group by address to deduplicate
  const addressMap = new Map<string, { providers: RawProvider[]; address: ReturnType<typeof getLocationAddress> }>()

  for (const provider of providers) {
    const addr = getLocationAddress(provider)
    if (!addr || !addr.address_1 || !addr.city || !addr.state) continue

    const key = `${addr.address_1.toUpperCase().trim()}|${addr.city.toUpperCase().trim()}|${addr.state.toUpperCase().trim()}`

    if (!addressMap.has(key)) {
      addressMap.set(key, { providers: [], address: addr })
    }
    addressMap.get(key)!.providers.push(provider)
  }

  console.log(`Unique addresses: ${addressMap.size}`)

  // Convert to clinics
  const slugSet = new Set<string>()
  const clinics: ProcessedClinic[] = []

  for (const [, { providers: groupProviders, address }] of addressMap) {
    // Use organization name if available, otherwise first provider name
    const orgProvider = groupProviders.find(p => p.enumeration_type === 'NPI-2')
    const name = orgProvider
      ? getProviderName(orgProvider)
      : getProviderName(groupProviders[0])

    // Collect all NPI numbers
    const npiNumbers = [...new Set(groupProviders.map(p => p.number))]

    // Generate unique slug
    let slug = generateSlug(name, address.city, address.state)
    let counter = 1
    while (slugSet.has(slug)) {
      slug = `${generateSlug(name, address.city, address.state)}-${++counter}`
    }
    slugSet.add(slug)

    // Check if likely IV clinic based on name
    const likelyIV = groupProviders.some(p => isLikelyIVClinic(p))
    const mobile = groupProviders.some(p => isMobileService(p))

    clinics.push({
      name,
      slug,
      address: titleCase(address.address_1),
      city: titleCase(address.city),
      state: address.state.toUpperCase(),
      zip: address.postal_code?.slice(0, 5) || '',
      phone: formatPhone(address.telephone_number),
      clinician_npi_numbers: npiNumbers,
      data_sources: ['NPPES NPI Registry'],
      is_iv_clinic: likelyIV, // Conservative — will refine via enrichment
      verified: false,
      mobile_service_available: mobile,
    })
  }

  return clinics
}

// ============================================
// Supabase import
// ============================================

async function upsertToSupabase(clinics: ProcessedClinic[], batchSize = 100) {
  console.log(`\nUpserting ${clinics.length} clinics to Supabase (batch size: ${batchSize})...`)

  let imported = 0
  let errors = 0

  for (let i = 0; i < clinics.length; i += batchSize) {
    const batch = clinics.slice(i, i + batchSize)

    const { error } = await supabase
      .from('clinics')
      .upsert(batch, { onConflict: 'slug' })

    if (error) {
      console.error(`  Batch ${Math.floor(i / batchSize) + 1} error:`, error.message)
      errors += batch.length
    } else {
      imported += batch.length
      process.stdout.write(`  Imported: ${imported}/${clinics.length}\r`)
    }
  }

  console.log(`\nDone! Imported: ${imported}, Errors: ${errors}`)
  return { imported, errors }
}

// ============================================
// Main
// ============================================

async function main() {
  const inputPath = path.join(__dirname, 'data', 'npi-raw.json')

  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`)
    console.error('Run "npx tsx scripts/seed-npi.ts" first to fetch data from NPPES.')
    process.exit(1)
  }

  console.log('=== NPI Data Import for IV Therapy Clinics ===')
  console.log(`Reading: ${inputPath}`)

  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))
  console.log(`Raw providers: ${raw.providers.length}`)
  console.log(`Metadata:`, raw.metadata)

  // Process and deduplicate
  const clinics = processProviders(raw.providers)
  const ivClinics = clinics.filter(c => c.is_iv_clinic)

  console.log(`\nProcessed clinics: ${clinics.length}`)
  console.log(`Likely IV clinics (by name): ${ivClinics.length}`)
  console.log(`Mobile services (by name): ${clinics.filter(c => c.mobile_service_available).length}`)

  // Save deduplicated data
  const dedupPath = path.join(__dirname, 'data', 'npi-deduplicated.json')
  fs.writeFileSync(dedupPath, JSON.stringify({ metadata: raw.metadata, clinics }, null, 2))
  console.log(`\nSaved deduplicated data to: ${dedupPath}`)

  // Sample output
  console.log('\nSample clinics:')
  clinics.slice(0, 5).forEach(c => {
    console.log(`  ${c.name} — ${c.city}, ${c.state} — NPIs: ${c.clinician_npi_numbers.length} — IV: ${c.is_iv_clinic}`)
  })

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Skipping Supabase upsert. Remove --dry-run to import.')
    return
  }

  // Import to Supabase
  await upsertToSupabase(clinics)

  // Post-import stats
  const { count } = await supabase
    .from('clinics')
    .select('*', { count: 'exact', head: true })

  console.log(`\nTotal clinics in database: ${count}`)

  const { count: ivCount } = await supabase
    .from('clinics')
    .select('*', { count: 'exact', head: true })
    .eq('is_iv_clinic', true)

  console.log(`IV clinics flagged: ${ivCount}`)
}

main().catch(console.error)
