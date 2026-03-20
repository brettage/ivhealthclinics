// Care setting options
export type CareSetting = 'in_clinic' | 'mobile_only' | 'both'

// Supervision level options
export type SupervisionLevel = 'md_onsite' | 'md_oversight' | 'np_supervised' | 'rn_administered'

// Service type options
export type ServiceType =
  | 'hydration'
  | 'vitamin_drips'
  | 'nad_plus'
  | 'athletic_recovery'
  | 'hangover_relief'
  | 'immune_support'
  | 'beauty_anti_aging'
  | 'weight_loss'
  | 'migraine_relief'
  | 'detox'
  | 'custom_blends'
  | 'b12_shots'
  | 'glutathione'

// Lead status options
export type LeadStatus = 'new' | 'contacted' | 'converted' | 'closed'

// Main clinic type
export interface Clinic {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  website: string | null
  logo_url: string | null
  verified: boolean
  mobile_service_available: boolean
  created_at: string
  updated_at: string

  // Care Setting
  care_setting: CareSetting | null
  mobile_service_radius: string | null
  mobile_service_areas: string[] | null

  // Service Menu
  service_types: string[] | null
  drip_menu_available: boolean

  // Pricing (stored in cents)
  price_range_min: number | null
  price_range_max: number | null
  membership_available: boolean
  membership_price_monthly: number | null
  pricing_disclosed: boolean
  group_discounts: boolean
  event_services: boolean

  // Medical Supervision
  supervision_level: SupervisionLevel | null
  medical_director_name: string | null
  administering_credentials: string[] | null
  license_states: string[] | null
  clinician_npi_numbers: string[] | null

  // Safety
  sterile_compounding: boolean | null
  ingredient_sourcing: string | null
  adverse_event_policy: boolean | null
  consent_form_required: boolean | null
  allergy_screening: boolean | null
  safety_disclosures: string | null

  // Booking
  walk_ins_accepted: boolean | null
  appointment_required: boolean | null
  online_booking_url: string | null
  hours_of_operation: Record<string, unknown> | null
  after_hours_available: boolean

  // Data Quality
  is_iv_clinic: boolean
  featured: boolean
  email: string | null
  last_crawled_at: string | null
  crawl_skipped: boolean
  last_verified_date: string | null
  data_sources: string[] | null

  // SEO
  latitude: number | null
  longitude: number | null
  rating_value: number | null
  rating_count: number | null
}

// Lead type
export interface Lead {
  id: string
  clinic_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  message: string | null
  source: string
  status: LeadStatus
  created_at: string
  updated_at: string
}

// Clinic service (drip menu item)
export interface ClinicService {
  id: string
  clinic_id: string
  service_type: string
  available: boolean
  price_cents: number | null
  duration_minutes: number | null
  description: string | null
  notes: string | null
  created_at: string
}

// Helper: format price from cents
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

// Helper: format price range
export function formatPriceRange(min: number | null, max: number | null): string {
  if (min && max) return `${formatPrice(min)}–${formatPrice(max)}`
  if (min) return `From ${formatPrice(min)}`
  if (max) return `Up to ${formatPrice(max)}`
  return 'Contact for pricing'
}

// Helper: display label for care setting
export function careSettingLabel(setting: CareSetting | null): string {
  switch (setting) {
    case 'in_clinic': return 'In-Clinic'
    case 'mobile_only': return 'Mobile Only'
    case 'both': return 'In-Clinic + Mobile'
    default: return 'Not specified'
  }
}

// Helper: display label for supervision level
export function supervisionLabel(level: SupervisionLevel | null): string {
  switch (level) {
    case 'md_onsite': return 'MD On-Site'
    case 'md_oversight': return 'MD Oversight'
    case 'np_supervised': return 'NP Supervised'
    case 'rn_administered': return 'RN Administered'
    default: return 'Not specified'
  }
}

// Helper: display label for service type
export function serviceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    hydration: 'IV Hydration',
    vitamin_drips: 'Vitamin Drips',
    nad_plus: 'NAD+ Therapy',
    athletic_recovery: 'Athletic Recovery',
    hangover_relief: 'Hangover Relief',
    immune_support: 'Immune Support',
    beauty_anti_aging: 'Beauty & Anti-Aging',
    weight_loss: 'Weight Loss',
    migraine_relief: 'Migraine Relief',
    detox: 'Detox',
    custom_blends: 'Custom Blends',
    b12_shots: 'B12 Injections',
    glutathione: 'Glutathione',
  }
  return labels[type] || type
}

// Service type slug mapping (for URL routing)
export function serviceTypeSlug(type: string): string {
  return type.replace(/_/g, '-')
}

export function slugToServiceType(slug: string): string {
  return slug.replace(/-/g, '_')
}

// US States for location pages
export const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}
