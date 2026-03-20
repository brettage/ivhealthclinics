# IV Therapy Fields Guide

Reference for all IV-therapy-specific fields in the `clinics` table. Use this when building UI components, writing crawl extraction prompts, or debugging data issues.

---

## 1. Care Setting Fields

### `care_setting` (TEXT)
**Purpose**: Whether the clinic offers in-person, mobile, or both

**Allowed values**:
| Value | Display Label | Description |
|-------|--------------|-------------|
| `in_clinic` | In-Clinic | Brick-and-mortar location only |
| `mobile_only` | Mobile Only | Comes to you (home, hotel, office, events) |
| `both` | In-Clinic + Mobile | Offers both options |

**UI**: Show as badge on clinic card. Mobile services get a special "🚐 Mobile Available" indicator.

### `mobile_service_radius` (TEXT)
**Purpose**: How far the mobile service travels

**Format**: Free text (e.g., "25 miles", "Greater Miami area", "South Florida")
**Example**: `"30-mile radius from downtown Austin"`

### `mobile_service_areas` (TEXT[])
**Purpose**: Specific areas/neighborhoods served by mobile service

**Format**: Array of area names
**Example**: `['Downtown Miami', 'Miami Beach', 'Brickell', 'Coral Gables', 'Wynwood']`

---

## 2. Service Type Fields

### `service_types` (TEXT[])
**Purpose**: Categories of IV services offered

**Allowed values**:
| Value | Display Label | Description |
|-------|--------------|-------------|
| `hydration` | IV Hydration | Basic saline/electrolyte hydration |
| `vitamin_drips` | Vitamin Drips | Myers' cocktail, vitamin C, B-complex |
| `nad_plus` | NAD+ IV Therapy | Nicotinamide adenine dinucleotide infusions |
| `athletic_recovery` | Athletic Recovery | Post-workout, sports performance |
| `hangover_relief` | Hangover Relief | Hangover IV treatments |
| `immune_support` | Immune Support | Immune-boosting IV blends |
| `beauty_anti_aging` | Beauty & Anti-Aging | Glutathione, biotin, collagen support |
| `weight_loss` | Weight Loss IV | Metabolism/weight management drips |
| `migraine_relief` | Migraine Relief | Migraine/headache IV treatments |
| `detox` | Detox IV | Detoxification infusions |
| `custom_blends` | Custom Blends | Personalized/custom IV formulations |
| `b12_shots` | B12 Injections | Intramuscular B12 shots (not IV) |
| `glutathione` | Glutathione IV | Standalone glutathione pushes |

**Usage in filters**:
```typescript
// Check if clinic offers NAD+
const offersNAD = clinic.service_types?.includes('nad_plus')

// Filter clinics by service
const nadClinics = clinics.filter(c => c.service_types?.includes('nad_plus'))
```

### `drip_menu_available` (BOOLEAN)
**Purpose**: Whether the clinic publishes a detailed menu of drip options with descriptions

---

## 3. Pricing Fields

### `price_range_min` / `price_range_max` (INTEGER)
**Purpose**: Typical per-infusion price range

**Format**: Stored in cents (multiply by 100)
**Example**: $150–$250 → `price_range_min: 15000, price_range_max: 25000`

**Display**:
```typescript
const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`
// formatPrice(15000) => "$150"
```

### `membership_available` (BOOLEAN)
**Purpose**: Whether the clinic offers a subscription/membership plan

### `membership_price_monthly` (INTEGER)
**Purpose**: Monthly membership cost in cents
**Example**: $199/month → `19900`

### `pricing_disclosed` (BOOLEAN)
**Purpose**: Whether the clinic publicly shares any pricing information

### `group_discounts` (BOOLEAN)
**Purpose**: Whether discounts are available for group bookings

### `event_services` (BOOLEAN)
**Purpose**: Whether the clinic provides IV services at events (parties, corporate wellness, weddings, etc.)

---

## 4. Medical Supervision & Credential Fields

### `supervision_level` (TEXT)
**Purpose**: Level of medical oversight during IV administration

**Allowed values**:
| Value | Display Label | Description |
|-------|--------------|-------------|
| `md_onsite` | MD On-Site | Physician physically present |
| `md_oversight` | MD Oversight | Physician available but not always on-site |
| `np_supervised` | NP Supervised | Nurse practitioner supervises |
| `rn_administered` | RN Administered | Registered nurse administers under standing orders |

**UI**: Display as a credential badge with appropriate trust signal.

### `medical_director_name` (TEXT)
**Purpose**: Name of the clinic's medical director
**Format**: Free text, typically "Dr. FirstName LastName"

### `administering_credentials` (TEXT[])
**Purpose**: Credential types of staff who administer IVs

**Allowed values**: `RN`, `LPN`, `NP`, `PA`, `MD`, `DO`, `paramedic`
**Example**: `['RN', 'NP']`

### `license_states` (TEXT[])
**Purpose**: US states where the clinic/provider is licensed
**Format**: Array of uppercase 2-letter state codes
**Example**: `['FL', 'TX', 'CA']`

### `clinician_npi_numbers` (TEXT[])
**Purpose**: NPI numbers for providers associated with the clinic
**Format**: Array of 10-digit NPI numbers

---

## 5. Safety & Compliance Fields

### `sterile_compounding` (BOOLEAN)
**Purpose**: Whether the clinic sources IV solutions from 503A/503B compounding pharmacies (FDA-regulated)

**Why it matters**: This is a key safety differentiator. 503B pharmacies are FDA-inspected outsourcing facilities. Some clinics mix their own solutions, which carries higher risk.

### `ingredient_sourcing` (TEXT)
**Purpose**: Where IV ingredients are sourced from
**Example**: `"FDA-registered 503B outsourcing facility"`, `"USP-grade ingredients from licensed pharmacy"`

### `adverse_event_policy` (BOOLEAN)
**Purpose**: Whether the clinic has a disclosed policy for handling adverse reactions

### `consent_form_required` (BOOLEAN)
**Purpose**: Whether patients must sign informed consent before treatment

### `allergy_screening` (BOOLEAN)
**Purpose**: Whether the clinic screens for allergies before IV administration

### `safety_disclosures` (TEXT)
**Purpose**: Any additional safety-related information the clinic discloses
**Format**: Free text

---

## 6. Booking & Access Fields

### `walk_ins_accepted` (BOOLEAN)
**Purpose**: Whether the clinic accepts walk-in patients

### `appointment_required` (BOOLEAN)
**Purpose**: Whether an appointment is required

### `online_booking_url` (TEXT)
**Purpose**: Direct URL to the clinic's online booking system

### `after_hours_available` (BOOLEAN)
**Purpose**: Whether the clinic offers after-hours or weekend service (particularly relevant for mobile IV services)

---

## 7. Data Quality Fields

### `is_iv_clinic` (BOOLEAN)
**Purpose**: Confirmed as an IV therapy provider (vs. a general practice that showed up in search)

### `last_crawled_at` (TIMESTAMPTZ)
**Purpose**: When the clinic's website was last crawled for data extraction

### `crawl_skipped` (BOOLEAN)
**Purpose**: Whether the crawl was intentionally skipped (no website, unreachable, etc.)

### `data_sources` (TEXT[])
**Purpose**: Where the listing data came from
**Example**: `['google_places', 'website_crawl', 'manual_entry']`

---

## Crawl Extraction Prompt Template

When using Claude Haiku to extract IV-specific fields from crawled website content, use this structure:

```
You are extracting structured data about an IV therapy clinic from their website content.

Return a JSON object with these fields (use null if not found):

{
  "is_iv_clinic": boolean,
  "care_setting": "in_clinic" | "mobile_only" | "both" | null,
  "service_types": ["hydration", "vitamin_drips", "nad_plus", ...] | [],
  "drip_menu_available": boolean,
  "price_range_min": number (in dollars) | null,
  "price_range_max": number (in dollars) | null,
  "membership_available": boolean,
  "membership_price_monthly": number (in dollars) | null,
  "supervision_level": "md_onsite" | "md_oversight" | "np_supervised" | "rn_administered" | null,
  "medical_director_name": string | null,
  "administering_credentials": ["RN", "NP", ...] | [],
  "sterile_compounding": boolean | null,
  "ingredient_sourcing": string | null,
  "mobile_service_radius": string | null,
  "mobile_service_areas": string[] | [],
  "walk_ins_accepted": boolean | null,
  "appointment_required": boolean | null,
  "online_booking_url": string | null,
  "after_hours_available": boolean | null,
  "group_discounts": boolean | null,
  "event_services": boolean | null,
  "email": string | null,
  "confidence": "high" | "medium" | "low"
}

Only extract what is explicitly stated. Do not infer or guess.
```
