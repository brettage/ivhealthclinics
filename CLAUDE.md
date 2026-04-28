# CLAUDE.md — IVHealthClinics

Instructions for Claude Code when working on the IVHealthClinics project.

**Last updated:** April 27, 2026 (post-Phase-3 — data enrichment complete)

## Project Overview

IVHealthClinics (ivhealthclinics.com) is a directory for IV hydration, vitamin drips, and infusion wellness clinics. Built with Next.js 16, TypeScript, Tailwind CSS 4, and Supabase. Sister site to hormonemap.com.

## Current State (as of 2026-04-27)

**Phase 3 (Data + Infrastructure) is COMPLETE.** Next phase is Product, SEO, and Traffic.

- **8,191 total clinics** in DB (4,651 NPI seed + 3,540 Google Places discovered)
- **~2,950 directory-visible IV clinics** after enrichment + quality filtering
- **~2,945 websites crawled** (Crawl4AI + Claude Haiku) for IV-specific field extraction
- **645 non-IV businesses demoted** during quality cleanup
- Avg rating 4.9 / ~140 reviews
- Data quality: 64%+ have services, 63%+ have care setting, ~19% mobile, ~13% pricing

## Recently Shipped

- **2026-04-27** — `<ClinicBadges />` component (commit `9eef214`). Renders 💧 Services / 🚐 Mobile IV / 💲 Pricing pills on `ClinicCard` (size `sm`) and clinic detail page (size `md`) when the corresponding fields are populated. Removed duplicate Mobile pill from card. First user-visible win from Phase 3 enriched data.
- **2026-04-27** — State URL migration + SEO intro copy (commits `<hash1>` + `<hash2>`). Migrated `/locations/[abbr]` → `/locations/[full-name]` for all 50 states; added structured intros (lead + 2-3 H2s) on top 25 states. Foundation for organic traffic.
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
- **Analytics**: Google Analytics GA4 — `G-4ZW806CWHT`

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
id (uuid), name (text), slug (text, unique, NOT NULL), description (text),
address (text), city (text), state (text), zip (text),
phone (text), website (text), verified (boolean),
mobile_service_available (boolean), created_at, updated_at
```

⚠️ **`slug` is NOT NULL** — every INSERT into `clinics` MUST include a slug. Migrations that forget this fail silently.

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

**Phase 3 columns (added during Google Places merge):**
```sql
source                -- 'npi' | 'google_places'
enrichment_status     -- 'enriched' | 'unenriched' | 'rejected_quality' | etc.
match_confidence      -- 'high' | 'medium' | 'low' | 'address_only'
google_place_id       -- text
google_photo_refs     -- text[]
business_status       -- text
duplicate_of          -- uuid (FK to clinics.id, null if not a duplicate)
```

⚠️ These new columns may not be in generated Supabase types yet — use `as any` cast or `data as unknown as T[]` until types are regenerated.

#### `places_discovery`
Staging table for Google Places API results before merge to `clinics`. All ~3,888 rows now marked `merged` / `rejected_quality` / `skipped_duplicate` (no pending).

#### `clinic_services`
Detailed drip menu: clinic_id, service_type, price_cents, duration_minutes, description

#### `leads`
Lead capture: clinic_id, first_name, last_name, email, phone, message, source, status

### Important Notes
- `hours_of_operation` is `jsonb` → access with `as any` cast
- Use `createServiceClient()` for ALL write operations (bypasses RLS)
- Prices stored in cents (multiply display values by 100)

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

## ⚠️ CRITICAL: Supabase 1,000-Row Default Limit

**Supabase silently caps every `.select()` at 1,000 rows.** This bug bit `/locations`, `/services`, `/mobile-iv`, `/compare`, and `/search` after the Phase 3 merge made the dataset large enough to hit the limit. All have been fixed — but **any new aggregation query must paginate via `.range()`**.

### Standard pagination pattern (use everywhere)

```typescript
const PAGE_SIZE = 1000
const allRows: Array<{ /* relevant cols */ }> = []
let offset = 0

while (true) {
  const { data, error } = await supabase
    .from('clinics')
    .select('your_columns')
    .eq('is_iv_clinic', true)
    .eq('enrichment_status', 'enriched')
    .is('duplicate_of', null)
    // ... other filters
    .range(offset, offset + PAGE_SIZE - 1)

  if (error || !data || data.length === 0) break
  allRows.push(...(data as any))
  if (data.length < PAGE_SIZE) break
  offset += PAGE_SIZE
}
```

### Standard "directory-visible" filter triple

Use these three filters together on every public-facing aggregation query:

```typescript
.eq('is_iv_clinic', true)
.eq('enrichment_status', 'enriched')
.is('duplicate_of', null)
```

Optionally add `.in('match_confidence', ['high', 'medium', 'low'])` to exclude `address_only` confidence rows.

### Files using this pattern (verified working)
- `src/app/sitemap.ts`
- `src/app/locations/page.tsx`
- `src/app/locations/[state]/page.tsx`
- `src/app/locations/[state]/[city]/page.tsx`
- `src/app/services/page.tsx`
- `src/app/services/[type]/page.tsx`
- `src/app/mobile-iv/page.tsx`
- `src/app/compare/page.tsx`
- `src/app/search/page.tsx`
- `src/app/actions/clinics.ts` (`getClinicsByState`, etc.)

## TypeScript Patterns

```typescript
// hours_of_operation access
(clinic.hours_of_operation as any).openNow
(clinic.hours_of_operation as any).weekdayDescriptions

// is_iv_clinic and other Phase 3 columns (until types are regenerated)
(clinic as any).is_iv_clinic
(clinic as any).enrichment_status
(clinic as any).duplicate_of

// Sitemap client
const supabase = await createClient()  // ✅ Must await

// Bulk casting Supabase response
const rows = data as unknown as Clinic[]
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

## Ranking / Sort Score (Priority 1 — to implement)

Default sort on every listing page should use a quality score that surfaces complete listings first:

```
score = (price_range_min not null ? 3 : 0)
      + (service_types.length >= 3 ? 2 : 0)
      + (care_setting not null ? 2 : 0)
      + (mobile_service_available ? 2 : 0)
      + (rating_value * log10(rating_count + 1))
```

Sort desc by score on `/clinics`, `/locations/[state]`, `/locations/[state]/[city]`, `/services/[type]`, etc.

## SEO

### Implemented ✅
- `metadataBase` set in layout.tsx (`https://ivhealthclinics.com`)
- Default OG + Twitter Card tags with `images: ['/og-default.png']` in layout.tsx
- Clinic detail pages: `generateMetadata()` with OG tags + `alternates.canonical`
- Schema.org: `HealthAndBeautyBusiness` + `LocalBusiness` JSON-LD on clinic pages
  - Helper: `src/lib/schema-org.ts` → `generateClinicSchema(clinic)`
  - Injected via `<script type="application/ld+json">` in `src/app/clinics/[slug]/page.tsx`
- Sitemap: `src/app/sitemap.ts` → `/sitemap.xml` (paginated, all directory-visible clinics)
  - Uses direct `@supabase/supabase-js` client (NOT cookie-based `@/lib/supabase/server`)
  - Paginates in batches of 1,000 via `.range()` to bypass Supabase default limit
- Robots: `src/app/robots.ts` → `/robots.txt`
- Google Analytics: `G-4ZW806CWHT` via `src/components/GoogleAnalytics.tsx`
- Google Search Console: configured, sitemap submitted

### Outstanding ⬜
- Verify `alternates.canonical` on all dynamic page types (state, city, service)
- Custom favicon + apple-touch-icon (180×180) + 192/512 PWA icons
- Confirm Search Console sees ~3,000 updated URLs after Phase 3 merge
- Unique 150–200 word intros for top 25 city pages
- Unique intros for top 10 service pages
- Hybrid SEO routes need depth: `/services/nad-plus/florida`, `/mobile-iv/florida`, `/services/hydration/miami`

### Sitemap Note
The sitemap **cannot** use `createClient` from `@/lib/supabase/server` because that calls `cookies()` which fails at Vercel build time. Instead it imports `createClient` directly from `@supabase/supabase-js`.

## Email Flow

Form submit → `createLead()` → Supabase (service role) → Resend notification → ImprovMX → info@tenafterten.com

⬜ "Request Info" button on clinic detail pages — not yet implemented (Priority 4)

## Python Scripts

All scripts in `/scripts/` load env from `.env.local`:
```python
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent.parent / '.env.local')
```

Env var names for Python: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`

## Phase 3 Pipeline (completed — for reference)

The data pipeline that built the current dataset, in order:

1. **NPI seed** → `scripts/seed-npi.ts` → 4,651 raw clinic candidates from NPPES
2. **Brave Search URL enrichment** → ~5,400 clinics searched, ~1,236 verified URLs kept (Brave paid plan, ~$23 total). Aggressive aggregator/NPI-lookup domain filtering required.
3. **Google Places discovery** → 34 metros × 5 keywords gap-fill run (~$5.44) → 3,888 rows in `places_discovery` after dedup
4. **Schema migration** → added `source`, `enrichment_status`, `match_confidence`, `google_place_id`, `google_photo_refs`, `business_status`, `duplicate_of`. Backfilled NPI rows with `source='npi'`. Inline slug generation needed during merge INSERTs.
5. **Merge places_discovery → clinics** → 3,540 high/medium-confidence rows merged, 330 quality-dropped, 19 overlap-skipped
6. **Noise filter** → demoted 96 false positives (urgent cares, hospitals, ERs, Whole Foods, vet hospital, Canadian clinic) by name pattern matching
7. **Crawl4AI + Claude Haiku extraction** → ~2,945 websites crawled for service_types, care_setting, supervision_level, pricing, credentials
8. **Quality cleanup** → 645 non-IV businesses demoted based on crawled content
9. **Final state** → ~2,950 verified, directory-visible IV clinics

## Key Differences from HormoneMap
- Primary data source: Google Places (not NPI). NPI was tried first but yielded only ~3.3% directory-relevant results vs Places' ~99%.
- Key filter: `service_types` (not modalities)
- Care model: `care_setting` (in_clinic/mobile_only/both) instead of telehealth
- Safety fields: `sterile_compounding`, `ingredient_sourcing`, `adverse_event_policy`
- Schema.org: `HealthAndBeautyBusiness` (not `MedicalBusiness`) — wellness, not medical

## Critical Session Learnings (Phase 3)

1. **Supabase 1,000-row limit** — silent truncation, must `.range()`-paginate every aggregation. See pattern above.
2. **`clinics.slug` is NOT NULL** — any INSERT must include slug; generate inline during migrations.
3. **Google Places has ~3% noise** — even with location bias and "IV therapy" keyword. Filter by name patterns post-merge.
4. **NPI is consumer-mismatched for wellness directories** — Places yields 30× better directory relevance.
5. **Brave Search free plan caps at 2,000/month** — 429 errors continue even after waiting; new key under paid plan required (free key doesn't inherit paid quota).
6. **Run SQL directly in Supabase Dashboard** for migrations rather than through Claude Code — fewer surprises.
7. **Always commit `package.json` + `package-lock.json` together** — Vercel won't see new deps otherwise.
8. **Sitemap must use direct `@supabase/supabase-js`** — `cookies()` is unavailable at Vercel build time.

## Documentation Files

- **CLAUDE.md** — HormoneMap reference (sister site, mostly complete)
- **CLAUDE2.md** — this file, IVHealthClinics technical reference
- **IVHEALTHCLINICS_ROADMAP.md** — phase-by-phase forward roadmap
- **IVHEALTHCLINICS_TODO_2026-04-27.md** — current priorities (latest TODO)
- **IV_FIELDS_GUIDE.md** — IV-specific field extraction reference
- **IVHEALTHCLINICS.md** — project-level overview
