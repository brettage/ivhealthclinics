# CLAUDE.md — IVHealthClinics

Instructions for Claude Code when working on the IVHealthClinics project.

## Project Overview

IVHealthClinics (ivhealthclinics.com) is a directory for IV hydration, vitamin drips, and infusion wellness clinics. Built with Next.js 16, TypeScript, Tailwind CSS 4, and Supabase. Sister site to hormonemap.com.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (run before deploying)
npm run lint         # ESLint
git push             # Auto-deploys to Vercel
```

## Architecture

- **Framework**: Next.js 16 App Router with React Server Components
- **Database**: Supabase (PostgreSQL + RLS)
- **Styling**: Tailwind CSS 4
- **Email**: Resend (transactional) + ImprovMX (forwarding)
- **Hosting**: Vercel (auto-deploy on push to main)
- **Analytics**: Google Analytics GA4

## File Structure

```
src/app/          → Pages and routes (App Router)
src/components/   → Reusable UI components
src/lib/          → Utilities and configs
src/types/        → TypeScript types
scripts/          → Python + TypeScript data pipeline scripts (EXCLUDED from tsconfig)
supabase/         → Database schema and seeds
```

## Database Schema

### Tables

#### `clinics`
Main clinic information table with IV-therapy-specific fields.

**Basic Information:**
```sql
id (uuid), name (text), slug (text, unique), description (text),
address (text), city (text), state (text), zip (text),
phone (text), website (text), verified (boolean),
mobile_service_available (boolean), created_at, updated_at
```

**IV-Specific Fields:**
```sql
care_setting              -- 'in_clinic' | 'mobile_only' | 'both'
mobile_service_radius     -- text
mobile_service_areas      -- text[]
service_types             -- text[] (hydration, vitamin_drips, nad_plus, etc.)
drip_menu_available       -- boolean
price_range_min/max       -- integer (cents)
membership_available      -- boolean
membership_price_monthly  -- integer (cents)
supervision_level         -- 'md_onsite' | 'md_oversight' | 'np_supervised' | 'rn_administered'
medical_director_name     -- text
administering_credentials -- text[] (RN, NP, PA, MD, DO, paramedic)
sterile_compounding       -- boolean
ingredient_sourcing       -- text
is_iv_clinic              -- boolean
```

**SEO Fields:**
```sql
latitude, longitude, hours_of_operation (jsonb), rating_value, rating_count
```

**Google Places Enrichment Fields (added 2026-04-24):**
```sql
google_place_id        TEXT UNIQUE       -- idempotent enrichment key
google_photo_refs      JSONB             -- array of Places photo resource names
business_status        TEXT              -- OPERATIONAL / CLOSED_TEMPORARILY / CLOSED_PERMANENTLY
duplicate_of           UUID REFERENCES clinics(id)  -- canonical row when this is an NPI duplicate
enrichment_status      TEXT              -- enriched | duplicate_of_canonical | rejected_wrong_business | no_google_match | NULL
match_confidence       TEXT              -- high | medium | low | address_only | NULL
```

Indexes for enrichment columns:
```sql
idx_clinics_google_place_id (partial WHERE NOT NULL)
idx_clinics_google_place_id_unique (partial UNIQUE WHERE NOT NULL)
idx_clinics_duplicate_of (partial WHERE NOT NULL)
idx_clinics_enrichment_status (partial WHERE NOT NULL)
idx_clinics_match_confidence (partial WHERE NOT NULL)
```

**Frontend filtering rule for directory display:**
```sql
WHERE enrichment_status = 'enriched'
  AND match_confidence IN ('high', 'medium', 'low')
  AND duplicate_of IS NULL
-- 'address_only' rows are hidden until Phase 3.2 crawl verifies clinic type
```

#### `clinic_services`
Detailed drip menu: clinic_id, service_type, price_cents, duration_minutes, description

#### `leads`
Lead capture: clinic_id, first_name, last_name, email, phone, message, source, status

#### `places_discovery` (added 2026-04-24)

Google Places-sourced clinic discovery staging table. Separate from `clinics` during pilot phase. Will merge into `clinics` after validation.

Columns: `google_place_id` (unique), `name`, `formatted_address`, `latitude`, `longitude`, `street_address`, `city`, `state`, `zip`, `phone`, `website`, `business_status`, `rating_value`, `rating_count`, `primary_type`, `types` (jsonb), `discovered_via_keyword`, `discovered_via_city`, `discovered_at`, `merge_status` (default 'pending'), `merged_into_clinic_id`, `reviewed_at`, `notes`.

RLS enabled, no public policies = service role access only.

#### `discovery_runs` (added 2026-04-24)

Audit table for Places discovery searches. One row per (keyword, city) pair attempted. Used for resumability and cost tracking.

Columns: `run_id`, `keyword`, `city_name`, `city_lat`, `city_lng`, `radius_m`, `results_count`, `inserted_count`, `skipped_count`, `api_status`, `error_message`, `completed_at`.

### Important Notes
- `hours_of_operation` is `jsonb` → access with `as any` cast
- Use `createServiceClient()` for ALL write operations (bypasses RLS)
- Prices stored in cents (multiply display values by 100)
- `is_iv_clinic` may not be in generated Supabase types yet → use `as any` cast
- New 2026-04-24 columns may need types regenerated → use `as any` cast in TypeScript

## Supabase Clients

```typescript
// Read operations (client-side or server)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()  // MUST await

// Write operations (server actions only)
import { createServiceClient } from '@/lib/supabase/server'
const supabase = createServiceClient()  // No await needed
```

⚠️ Using anon key for writes will silently fail. Always use service role.

## TypeScript Patterns

```typescript
// hours_of_operation access
(clinic.hours_of_operation as any).openNow
(clinic.hours_of_operation as any).weekdayDescriptions

// is_iv_clinic (until types are regenerated)
(clinic as any).is_iv_clinic

// Sitemap client
const supabase = await createClient()  // ✅ Must await
```

## tsconfig.json

```json
"include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"]
```

Do NOT add `scripts/` to include — it will break the Vercel build.

## Data Formatting

### Title Case (`src/lib/format-clinic-name.ts`)
- Medical abbreviations stay uppercase: MD, DO, NP, LLC, IV, RN
- Roman numerals preserved: II, III, V
- Small words lowercase: of, the, and, in, at, to, for

### Phone: `(XXX) XXX-XXXX`

## Service Type Slugs (for URL routing)

```
hydration → /services/hydration
vitamin-drips → /services/vitamin-drips
nad-plus → /services/nad-plus
athletic-recovery → /services/athletic-recovery
hangover-relief → /services/hangover-relief
immune-support → /services/immune-support
beauty-anti-aging → /services/beauty-anti-aging
weight-loss → /services/weight-loss
migraine-relief → /services/migraine-relief
b12-shots → /services/b12-shots
glutathione → /services/glutathione
```

## SEO

### Implemented ✅
- `metadataBase` set in layout.tsx (`https://ivhealthclinics.com`)
- Default OG + Twitter Card tags with `images: ['/og-default.png']` in layout.tsx
- Clinic detail pages: `generateMetadata()` with OG tags + `alternates.canonical`
- Schema.org: `HealthAndBeautyBusiness` + `LocalBusiness` JSON-LD on clinic pages
  - Helper: `src/lib/schema-org.ts` → `generateClinicSchema(clinic)`
  - Injected via `<script type="application/ld+json">` in `src/app/clinics/[slug]/page.tsx`
- Sitemap: `src/app/sitemap.ts` → `/sitemap.xml` (paginated, all 4,651 clinics)
  - Uses direct `@supabase/supabase-js` client (NOT cookie-based `@/lib/supabase/server`)
  - Paginates in batches of 1,000 via `.range()` to bypass Supabase default limit
- Robots: `src/app/robots.ts` → `/robots.txt`
- Google Analytics: `G-4ZW806CWHT` via `src/components/GoogleAnalytics.tsx`
- Google Search Console: configured, sitemap submitted

### Sitemap Note
The sitemap **cannot** use `createClient` from `@/lib/supabase/server` because that calls `cookies()` which fails at Vercel build time. Instead it imports `createClient` directly from `@supabase/supabase-js`.

## Email Flow

Form submit → `createLead()` → Supabase (service role) → Resend notification → ImprovMX → info@tenafterten.com

## Python Scripts

All scripts in `/scripts/` load env from `.env.local`:
```python
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent.parent / '.env.local')
```

Env var names for Python: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_PLACES_API_KEY`

## Key Differences from HormoneMap
- Primary data source: Google Places (not NPI) — pivoted 2026-04-24 after NPI ceiling discovered
- Key filter: service_types (not modalities)
- Care model: care_setting (in_clinic/mobile_only/both) instead of telehealth
- Safety fields: sterile_compounding, ingredient_sourcing, adverse_event_policy
- Schema.org: HealthAndBeautyBusiness (not MedicalBusiness)

---

## Phase 3.1 — Google Places Enrichment (Complete, 2026-04-24)

Enriched `is_iv_clinic=true` rows with Google Places data: ratings, reviews, hours, photos, lat/lng, business_status.

**Final scorecard (216 IV-flagged clinics):**

| Status | Count | % | Visible in directory? |
|---|---|---|---|
| Enriched (high confidence) | 5 | 2% | ✅ |
| Enriched (medium) | 117 | 54% | ✅ |
| Enriched (low — zip tiebreaker) | 10 | 5% | ✅ |
| Enriched (address_only) | 22 | 10% | ❌ Hidden until crawl verifies |
| Rejected (wrong business) | 46 | 21% | ❌ |
| Duplicate of canonical | 9 | 4% | ❌ |
| No Google match | 7 | 3% | ❌ |

Total cost: ~$3 across v1-v5 iterations of the script.

**Key script:** `scripts/enrich_google_places.py` (v5 final).

### v5 enrichment logic — match decision matrix

```
name_score >= 0.60  +  zip match       → ACCEPT (high confidence)
name_score >= 0.60  +  city match      → ACCEPT (medium confidence)
name_score 0.40-0.60 + zip match       → ACCEPT (low confidence)
street_address_match (digit + name)    → ACCEPT (address_only — hidden tier)
collision + name_sim ≥ 0.60 to owner   → MARK duplicate_of_canonical
collision + name_sim < 0.60 to owner   → MARK no_google_match
everything else                        → REJECT
```

### Critical learnings (enrichment)

1. **Google Places Text Search returns "best guess in area" when queried entity doesn't exist**, not null. Produces plausible-looking false matches on chain names. Defense: name + address scoring with multiple thresholds.

2. **Name fuzzy matching alone fails ~60% of NPI-seeded clinics** due to corporate suffix (LLC/PC/PLLC) noise, DBA names, and chain variations. Solution: `normalize_name()` strips suffixes + token overlap scoring (60% sequence + 40% token overlap).

3. **Street address tiebreaker** for borderline scores: extract first comma-separated portion of `formattedAddress`, normalize both sides (strip suite/unit, expand abbreviations), require ≥0.80 similarity AND matching street number. Catches "NPI-registered service inside larger medical practice" cases.

4. **Collision on unique `google_place_id` constraint has TWO meanings**:
   - Real NPI duplicate: same business under different legal entity registrations
   - Unfindable clinic: query keeps hitting same popular chain that's already claimed
   - Disambiguate via name similarity between failing and owner rows (threshold 0.60)

5. **NPI ≠ consumer brand.** ~30-40% of NPI-registered IV clinics don't have Google Business Profiles under their legal name. Wellness IV clinics often operate under marketing DBAs (Prime IV, Restore, Drip Hydration) while NPI records the legal LLC. **This is the key insight that triggered the strategy pivot.**

6. **NPI keyword expansion has a hard ceiling.** Tested expanding `is_iv_clinic` flag via keywords (rejuven, NAD, vitality, etc.) on the 4,435 non-flagged pool. Result: 107 candidates, **zero confirmed IV clinics** in random samples. NPI data does not contain consumer wellness IV brands under findable names. Don't waste time on NPI keyword expansion in future projects.

### Confidence tier semantics

- **high** — confident name match (≥0.60) AND zip match. Trust fully.
- **medium** — confident name match (≥0.60) AND city match (no zip match). Trust mostly. (Note: 116 rows backfilled to medium from v1/v2 runs that didn't record reason.)
- **low** — weak name match (0.40-0.60) saved by zip tiebreaker. Spot-check before trusting.
- **address_only** — addresses match but business names differ. Hide from directory until Phase 3.2 crawl verifies clinic type. Often "infusion service inside larger medical practice" — could be wellness IV (rebrand) or medical infusion (not directory-fit).

---

## Phase 3 — Google Places Discovery (Strategic Pivot, Complete 2026-04-24)

After NPI seeding hit its ceiling at 154 directory-ready clinics, pivoted to bottom-up discovery via Google Places Text Search across 100 US metros + 5 keywords.

**Result: 3,296 unique IV businesses discovered for $15.84.**

### Run parameters (final)

- **100 US metropolitan statistical areas** by population, principal city as anchor
- **5 keywords**: `IV therapy`, `IV hydration`, `mobile IV`, `NAD infusion`, `vitamin drip`
- **25km location bias radius** per metro
- **MaxResultCount: 20** per search (Places API max)
- **Search-only** (no Details API) — pilot proved search response has all signals needed: phone, website, ratings, reviews, business_status, address components, lat/lng
- **Resumability** via `discovery_runs` audit table — skips completed (keyword, city) pairs on re-runs
- **Hard cost cap: 600 searches** (~$19) — abort safety net

### Quality metrics (3,296 discovered clinics)

- **100% operational** (zero closed businesses)
- **97% have website** (3,195 / 3,296)
- **92% have 5+ reviews** (3,023 / 3,296)
- **87% have 10+ reviews** (2,870 / 3,296)
- **60% have 50+ reviews** (1,971 / 3,296)
- **Average rating: 4.88**
- **Only 3% have zero reviews** (93 / 3,296)
- **Only 16 / 3,296 (0.5%) overlap** with existing NPI-enriched `clinics.google_place_id` — Places and NPI find fundamentally different universes

### Key scripts

- `scripts/discover_google_places_full.py` — full-scale discovery runner with resumability
- `scripts/discover_google_places.py` — pilot (5 cities × 3 keywords) for cheap validation

### Critical learnings (discovery)

1. **Places search-only returns enough data for directory display.** No need for Place Details API calls. Search response includes: id, displayName, formattedAddress, addressComponents, location, nationalPhoneNumber, websiteUri, rating, userRatingCount, businessStatus, primaryType, types. Saves ~50% of API cost.

2. **20-result cap fires on most metro+keyword pairs.** Means we're getting top-ranked results, leaving long-tail clinics undiscovered. Geographic gap-fill (smaller metros, suburb-anchored searches) recovers more.

3. **Keyword diversity is crucial.** `IV therapy` alone returned ~60% of unique clinics. The other 4 keywords each contribute distinct subcategories:
   - `NAD infusion` → 13% (premium NAD+ clinics)
   - `IV hydration` → 13% (alternative phrasing, partial overlap)
   - `vitamin drip` → 9% (drip-bar branding)
   - `mobile IV` → 5% (mobile/concierge service type)
   
   Each keyword pulled its weight.

4. **Resumability via audit table is essential** for runs of this scale. The `discovery_runs` table logs each completed (keyword, city) pair with `api_status='success'`. On any re-run, completed pairs are skipped automatically.

5. **Geographic distribution surprises**: TN (122), SC (105), UT (75), AR (62) all over-indexed. CA/FL/TX dominate by raw count due to multiple metros searched. NY (164) and IL (56) under-indexed because only 1-5 metros each — suggests gap-fill for suburb coverage would help.

6. **Quality auto-filters via Google's ranking.** Since Places returns top-ranked results within the location bias, ghost listings and closed businesses are naturally suppressed. The 100% operational rate isn't filtering on our end — Places already deprioritizes those.

### Cost economics

- **Total Phase 3 session cost**: ~$19 (enrichment $3 + discovery $15.84)
- **Per-clinic cost**: ~$0.005 for Places discovery
- **NPI seeding produced**: 154 directory-ready clinics from 4,651 rows (3.3% yield)
- **Places discovery produced**: 3,296 directory-quality clinics from 500 searches (~99% yield)

---

## Scripts Inventory

In `/scripts/`:
- `enrich_google_places.py` — v5 final, enriches `clinics` rows with Google Places data
- `discover_google_places.py` — pilot discovery (5 cities × 3 keywords)
- `discover_google_places_full.py` — full discovery (100 cities × 5 keywords, resumable)

Migrations (run via Supabase Dashboard → SQL Editor, all idempotent with `IF NOT EXISTS`):
- `add_google_places_columns.sql`
- `add_duplicate_tracking.sql`
- `add_match_confidence.sql`
- `create_places_discovery_table.sql`
- `create_discovery_runs_table.sql`

Log files (gitignored, generated per script run):
- `scripts/google_places_misses.log`
- `scripts/google_places_errors.log`
- `scripts/google_places_duplicates.log`
- `scripts/google_places_address_only.log`

---

## Current Directory State (as of 2026-04-24)

- 154 NPI-enriched IV clinics (visible) — `enrichment_status='enriched'`, `match_confidence IN ('high', 'medium', 'low')`
- 22 NPI address_only matches (hidden) — pending Phase 3.2 verification
- 3,296 Places-discovered clinics (in `places_discovery`, not yet merged)
- **Projected post-merge directory: ~3,300-3,400 clinics**

## Open Questions / Next Session Pickup

1. **Quality filter for `places_discovery`** before merge — recommend 5+ reviews threshold (drops 273 rows → 3,023 final)
2. **Merge strategy** — schema-extend `clinics` table with `source` column ('npi' | 'google_places' | 'manual'), make `npi` nullable, migrate `places_discovery` rows in
3. **Geographic gap-fill** — optional ~$5 second-pass on 30 underrepresented suburban metros (defer until after merge)
4. **Phase 3.2 — Website Crawling** — Crawl4AI + Claude Haiku extraction of service types, pricing, supervision level, etc. Estimated cost: $150-300 for ~3,000 clinics.
