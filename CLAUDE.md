# CLAUDE.md — IVHealthClinics

Instructions for Claude Code when working on the IVHealthClinics project.

**Last updated:** April 27, 2026 (end of day — Priorities 1–3 shipped)

## Project Overview

IVHealthClinics (ivhealthclinics.com) is a directory for IV hydration, vitamin drips, and infusion wellness clinics. Built with Next.js 16, TypeScript, Tailwind CSS 4, and Supabase. Sister site to hormonemap.com.

## Current State (as of 2026-04-27 EOD)

**Priorities 1–3 from the 4/27 TODO are SHIPPED.** Site is fully data-visible, SEO-foundationed, and has its first three guide articles live. Next phase is wait-and-watch (Search Console takes weeks to process changes).

- **8,191 total clinics** in DB (4,651 NPI seed + 3,540 Google Places discovered)
- **~2,950 directory-visible IV clinics** after enrichment + quality filtering
- **~2,945 websites crawled** (Crawl4AI + Claude Haiku) for IV-specific field extraction
- Avg rating 4.9 / ~140 reviews
- Data quality: 64%+ have services, 63%+ have care setting, ~19% mobile, ~13% pricing

## Recently Shipped (today, 2026-04-27)

- **`<ClinicBadges />`** (commit `9eef214`). Services/Mobile/Pricing differentiator pills on ClinicCard + clinic detail page.
- **`<ClinicFilters />`** (commit `5a4c082`). Three filter chips on `/clinics` with URL-param state. `getAllClinics()` accepts optional filters that compose with the visibility filter triple.
- **Quality ranking score** (`sortByQualityScore` + `dedupeClinicsById` in `src/lib/clinic-ranking.ts`). Replaces `rating_count` default sort with completeness-weighted score. Used on city pages and likely others.
- **State URL migration** — `/locations/<abbr>` → `/locations/<full-name>` (canonical). New `src/lib/state-slugs.ts` helper. `next.config.ts` 301-redirects all 50 state abbr URLs (and `/<city>` variants). Sitemap, breadcrumbs, locations index, homepage `topCities` array all emit canonical URLs.
- **State SEO intros** for top 25 states (`src/lib/seo-content/states.ts`). Each ~200 words across lead + 2–3 H2 sections (cost / mobile / popular services). Rendered above city grid via `<StateIntroSection />`. Grounded in real DB stats.
- **Three guide articles** — `/guides/iv-therapy-cost`, `/guides/types-of-iv-drips`, `/guides/mobile-vs-clinic-iv`. Architecture: typed `Guide` content modules in `src/lib/seo-content/guides/`, reusable `<GuideArticle />` renderer in `src/components/`, thin per-guide page wrappers under `src/app/guides/<slug>/`. JSON-LD `Article` schema for rich results.
- **`/guides` index page** with card grid linking to all three articles. Top-of-page CTA links to `/clinics`, `/services`, `/mobile-iv`.
- **Manual indexing requested** in Search Console for high-value URLs (top state pages + all guides).

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
src/app/                              → Pages and routes (App Router)
src/components/
  ├── ClinicCard.tsx                  → Listing card
  ├── ClinicBadges.tsx                → Services/Mobile/Pricing pills
  ├── ClinicFilters.tsx               → URL-param filter chips (client component)
  ├── StateIntroSection.tsx           → State page SEO intro renderer
  └── GuideArticle.tsx                → Reusable guide renderer
src/lib/
  ├── clinic-ranking.ts               → sortByQualityScore + dedupeClinicsById
  ├── state-slugs.ts                  → resolveState/stateUrl/stateCityUrl helpers
  ├── format-clinic-name.ts
  ├── schema-org.ts
  ├── seo-content/
  │   ├── states.ts                   → 25 state intros (typed map)
  │   └── guides/
  │       ├── index.ts                → Guide registry
  │       ├── iv-therapy-cost.ts
  │       ├── types-of-iv-drips.ts
  │       └── mobile-vs-clinic-iv.ts
  └── supabase/server.ts
src/types/                            → TypeScript types
scripts/                              → Python + TypeScript data pipeline scripts (EXCLUDED from tsconfig)
supabase/                             → Database schema and seeds
```

## Database Schema

### Tables

#### `clinics`
Main clinic information table with IV-therapy-specific fields.

**Basic Information:**
```sql
id (uuid, PRIMARY KEY), name (text), slug (text, UNIQUE, NOT NULL), description (text),
address (text), city (text), state (text), zip (text),
phone (text), website (text), verified (boolean),
mobile_service_available (boolean), created_at, updated_at
```

⚠️ **`slug` is NOT NULL and UNIQUE** — every INSERT must include a slug. Migrations that forget this fail silently.
⚠️ **`id` is PRIMARY KEY** (UUID). Confirmed unique in production; do NOT spend time chasing duplicate-id warnings — they're presentation-layer artifacts, not data issues.

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

⚠️ Phase 3 columns may need `as any` cast in TS until Supabase types regenerate.

#### `places_discovery`
Staging table for Google Places API results. All ~3,888 rows merged/rejected/skipped.

#### `clinic_services`
Detailed drip menu: clinic_id, service_type, price_cents, duration_minutes, description

#### `leads`
Lead capture: clinic_id, first_name, last_name, email, phone, message, source, status

### Important Notes
- `hours_of_operation` is `jsonb` → access with `as any` cast
- Use `createServiceClient()` for ALL write operations (bypasses RLS)
- Prices stored in cents

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

**Supabase silently caps every `.select()` at 1,000 rows.** Pagination is mandatory for any aggregation query.

### Standard pagination pattern

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
    .range(offset, offset + PAGE_SIZE - 1)

  if (error || !data || data.length === 0) break
  allRows.push(...(data as any))
  if (data.length < PAGE_SIZE) break
  offset += PAGE_SIZE
}
```

### Standard "directory-visible" filter triple

```typescript
.eq('is_iv_clinic', true)
.eq('enrichment_status', 'enriched')
.is('duplicate_of', null)
```

The `applyVisibilityFilters()` helper in `src/app/actions/clinics.ts` codifies this — use it everywhere.

## State URL Resolution Pattern

URLs use full-name slugs only: `/locations/florida` (not `/locations/fl`). Old abbr URLs 301-redirect via `next.config.ts`.

```typescript
import { resolveState, stateUrl, stateCityUrl, SLUG_BY_ABBR } from '@/lib/state-slugs'

// Inside a page handler that receives `state` param:
const resolved = resolveState(state)  // accepts 'fl', 'FL', 'florida', 'Florida'
if (!resolved) notFound()
// resolved.slug = 'florida' (canonical)
// resolved.name = 'Florida'
// resolved.abbr = 'FL'
```

When linking to a state page from clinic data (`clinic.state = 'FL'`):
```typescript
href={stateUrl(clinic.state) || '#'}        // → /locations/florida
href={stateCityUrl(clinic.state, clinic.city) || '#'}  // → /locations/florida/miami
```

## Quality Ranking Score

```
score = (price_range_min not null ? 3 : 0)
      + (service_types.length >= 3 ? 2 : 0)
      + (care_setting not null ? 2 : 0)
      + (mobile_service_available ? 2 : 0)
      + (rating_value * log10(rating_count + 1))
```

Sort `desc` after fetching. Implementation in `src/lib/clinic-ranking.ts`. Tune weights there if needed; document weight changes in this file.

## SEO Content Authoring

### State intros
- Source: `src/lib/seo-content/states.ts`
- Type: `Record<slug, StateIntro>` where `StateIntro = { lead, sections: [{heading, body}] }`
- Renderer: `<StateIntroSection intro={intro} />` returns null if no intro for that state
- States covered (top 25 by clinic count): CA, TX, FL, NY, NC, OH, PA, TN, IL, GA, SC, WA, CO, VA, AZ, UT, MA, LA, NV, CT, MI, MD, WI, AR, OK
- Refresh stats quarterly using SQL queries from session 4/27

### Guide articles
- Source: `src/lib/seo-content/guides/<slug>.ts` exports a typed `Guide`
- Registry: `src/lib/seo-content/guides/index.ts` maps slug → guide
- Renderer: `<GuideArticle guide={guide} />` handles paragraphs, lists, callouts, internal links, TOC
- Page wrapper: thin file at `src/app/guides/<slug>/page.tsx` looks up the guide + injects JSON-LD Article schema
- To add a new guide: create the content file, register it in `index.ts`, copy a page.tsx and change the SLUG constant

## SEO

### Implemented ✅
- `metadataBase` set in layout.tsx (`https://ivhealthclinics.com`)
- Default OG + Twitter Card tags with `images: ['/og-default.png']`
- Clinic detail pages: `generateMetadata()` with OG tags + `alternates.canonical`
- Schema.org: `HealthAndBeautyBusiness` + `LocalBusiness` JSON-LD on clinic pages; `Article` JSON-LD on guides
- Sitemap: `src/app/sitemap.ts` → paginated, all directory-visible clinics, canonical state URLs
- Sitemap uses direct `@supabase/supabase-js` (NOT cookie-based client) because `cookies()` fails at Vercel build time
- Robots: `src/app/robots.ts` → `/robots.txt`
- Google Analytics: `G-4ZW806CWHT`
- Google Search Console: configured, sitemap submitted, manual indexing requested for top URLs (4/27)
- State URL migration to canonical full-name slugs
- Top 25 state intros with H2 structure
- 3 long-form guide articles + index page

### Outstanding ⬜
- Verify `alternates.canonical` on all dynamic page types (state, city, service)
- Custom favicon + apple-touch-icon (180×180) + 192/512 PWA icons
- `alternates.canonical` set on guide pages (currently in `generateMetadata` for cost guide; verify others)
- Service intro copy for `/services/[type]` pages (top 10)
- Hybrid SEO routes: `/services/nad-plus/florida`, `/mobile-iv/florida`
- Form field accessibility warning (form needs id or name attr)
- "Request Info" lead form on clinic detail pages
- Resend domain DKIM/SPF setup
- States 26–50 SEO intros
- Audit `/mobile-iv/[state]` and `/services/[service]/[state]` route handlers (sitemap emits them; unclear if pages exist)

## Email Flow

Form submit → `createLead()` → Supabase (service role) → Resend notification → ImprovMX → info@tenafterten.com.

⬜ Lead form not yet implemented on clinic pages (Priority 4 outstanding).

## Python Scripts

All scripts in `/scripts/` load env from `.env.local`:
```python
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent.parent / '.env.local')
```

Env var names for Python: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`

## Critical Session Learnings (cumulative)

1. **Supabase 1,000-row limit** — silent truncation, must `.range()`-paginate every aggregation.
2. **`clinics.slug` is NOT NULL** — every INSERT must include slug; generate inline during migrations.
3. **Google Places has ~3% noise** — filter by name patterns post-merge.
4. **NPI is consumer-mismatched for wellness directories** — Places yields 30× better directory relevance.
5. **Brave Search free plan caps at 2,000/month** — new key under paid plan required.
6. **Run SQL directly in Supabase Dashboard** for migrations rather than through Claude Code.
7. **Always commit `package.json` + `package-lock.json` together** — Vercel won't see new deps otherwise.
8. **Sitemap must use direct `@supabase/supabase-js`** — `cookies()` is unavailable at Vercel build time.
9. **Cache clear** — `rm -rf .next` if dev server gives phantom syntax errors after adding new components.
10. **Phase 3 columns may need `as any` cast** until Supabase types regenerate.
11. **`'use client'` is required** at top of components using `useRouter`/`useSearchParams`/`usePathname`.
12. **Next.js 16 made `searchParams` and `params` async** — both are Promises, must `await` them.
13. **`next.config.ts` redirects use `permanent: true`** for 301; dev server shows them as 308 (Next dev quirk), production shows 301.
14. **Internal links should emit canonical URLs directly** rather than relying on redirects — `next.config.ts` redirects are insurance, not architecture.
15. **State page handlers expect full-name slugs** — abbr inputs are intercepted by redirect rules in `next.config.ts`, never reach the handler.
16. **Search Console: don't keep resubmitting the sitemap.** It's polled automatically. For high-value pages, use URL Inspection → Request Indexing instead (faster, capped ~10/day).
17. **Duplicate-key React warnings ≠ database duplicates.** When seen, run the diagnostic SQL first; the DB might be clean and the warning is presentation-layer noise. `dedupeClinicsById()` is acceptable mitigation.

## Documentation Files

- **CLAUDE.md** — this file, IVHealthClinics technical reference (was CLAUDE2.md in earlier sessions)
- **IVHEALTHCLINICS_TODO_2026-04-27.md** — 4/27 TODO (mostly complete, mark items as done)
- **IVHEALTHCLINICS_TODO_2026-04-28+.md** — next-up TODO (see below for what to make of it)
- **IVHEALTHCLINICS_ROADMAP.md** — phase-by-phase forward roadmap
- **IV_FIELDS_GUIDE.md** — IV-specific field extraction reference
- **IVHEALTHCLINICS.md** — project-level overview
