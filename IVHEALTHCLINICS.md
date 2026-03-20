# IVHealthClinics - IV Infusion & Hydration Clinic Directory

A professional directory for IV hydration, vitamin drips, and infusion-adjacent wellness clinics built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Project Overview

IVHealthClinics is a medical wellness directory platform that helps users find and compare IV infusion clinics. Users can browse by location, filter by service type (hydration, vitamin drips, NAD+, athletic recovery, hangover relief, immune support), care setting (in-clinic vs mobile), provider credentials, and safety disclosures. Designed to be the most transparent and decision-useful IV therapy directory online.

**Key Features** (Planned):
- 🏥 **Comprehensive Clinic Listings** — Seeded from Google Places, NPI, and niche sources
- 📍 **Nationwide Coverage** — All 50 US states + DC
- 🔍 **Smart Search & Filters** — Filter by drip type, mobile vs in-clinic, credentials, pricing range
- 📊 **Side-by-Side Comparison** — Compare up to 3 clinics on pricing, services, credentials
- ✅ **Provider Verification** — Credential transparency (RN/NP/MD supervision, state licensing)
- 💧 **IV-Specific Data** — Drip menus, pricing per infusion, mobile availability, safety disclosures
- ⭐ **Google Ratings** — Enriched via Google Places API
- 🗺️ **XML Sitemap** — Auto-generated covering all clinic, city, state, service pages
- 📝 **Guide Articles** — SEO-optimized IV therapy education guides
- 📧 **Lead Email Routing** — Form submissions delivered via Resend
- 📊 **Google Analytics** — GA4 tracking
- 🌐 **Live at ivhealthclinics.com** — Deployed on Vercel

---

## Business Context

**Domain**: ivhealthclinics.com
**Niche**: IV hydration, vitamin drips, and infusion-adjacent wellness clinics
**Operated By**: Ten After Ten Group LLC
**Sister Site**: hormonemap.com (TRT clinic directory)

### Market Context
- Cash-pay market: typically $150–$200 per infusion
- Growing consumer demand for wellness IV services
- Mix of brick-and-mortar clinics and mobile IV services
- Regulatory landscape varies significantly by state
- Existing directories are thin on decision-grade data (pricing, credentials, safety)

### Competitive Landscape

| Directory | URL | Notes |
|-----------|-----|-------|
| IV Therapy Directory | ivtherapydirectory.com | Niche directory + content |
| IV Nutrition Locations | ivnutrition.com/locations/ | Brand/chain locator |
| Zocdoc | zocdoc.com | General marketplace, not IV-specific |
| MedSpa.us | medspa.us | Adjacent directory |
| Google Maps | maps.google.com | Infrastructure, not specialized |

### Differentiation Strategy
Our wedge is **decision-grade data per listing** that general directories don't provide:
- Service menu with per-drip pricing (not just "IV therapy")
- Mobile vs in-clinic availability
- Medical supervision level (MD on-site, NP-supervised, RN-administered)
- Safety disclosures (sterile compounding, ingredient sourcing, adverse event policies)
- State-specific credential requirements surfaced per listing
- Comparison tool for side-by-side evaluation

---

## Tech Stack

### Frontend
- **Next.js 16** — App Router with React Server Components
- **React 19** — UI library
- **TypeScript 5** — Type safety
- **Tailwind CSS 4** — Utility-first styling
- **Turbopack** — Fast development builds

### Backend
- **Supabase** — PostgreSQL database with Row Level Security
- **Next.js Server Actions** — Server-side data mutations
- **Resend** — Transactional email for lead notifications

### Infrastructure
- **Vercel** — Hosting and deployment (auto-deploys on GitHub push)
- **GitHub** — Source control at github.com/brettage/ivhealthclinics
- **GoDaddy** — Domain registrar for ivhealthclinics.com
- **Vercel DNS** — Nameservers
- **ImprovMX** — Email forwarding (hello@ivhealthclinics.com → info@tenafterten.com)

### Development Tools
- **ESLint** — Code linting
- **PostCSS** — CSS processing
- **Geist Fonts** — Sans and mono typefaces
- **PyCharm** — Primary IDE
- **Claude Code** — AI-assisted development

---

## Environment Variables

### Local (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key

# Python scripts use different variable names than Next.js
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### Vercel (Production)
Set in Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (service role key — required for write operations)
- `RESEND_API_KEY` (required for lead email notifications)

> ⚠️ **Key name difference**: Next.js uses `SUPABASE_SERVICE_KEY`, Python scripts use `SUPABASE_SERVICE_ROLE_KEY`. Both point to the same Supabase service role key value.

### Where to Find Keys
- **Supabase URL + anon key**: Supabase Dashboard → Settings → API → Project URL / anon public
- **Supabase service role key**: Supabase Dashboard → Settings → API → service_role (long JWT, ~200+ chars)
- **Resend API key**: resend.com → API Keys
- **Anthropic API key**: console.anthropic.com → API Keys

**Important**: Rotate keys if ever exposed publicly.

---

## Python Scripts — dotenv Setup

All Python scripts load environment variables from `.env.local` automatically. Add this to the top of any new script:

```python
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
```

---

## App Router Structure

```
src/
├── app/
│   ├── actions/
│   │   ├── clinics.ts           # Clinic CRUD operations
│   │   └── leads.ts             # Lead management + Resend email notification
│   ├── about/
│   │   └── page.tsx             # About page (Ten After Ten Group LLC)
│   ├── clinics/[slug]/
│   │   ├── page.tsx             # Clinic detail page
│   │   └── not-found.tsx
│   ├── compare/
│   │   └── page.tsx             # Side-by-side comparison tool
│   ├── contact/
│   │   └── page.tsx             # Contact page
│   ├── guides/
│   │   ├── page.tsx             # Guides index
│   │   ├── iv-therapy-cost/page.tsx
│   │   ├── types-of-iv-drips/page.tsx
│   │   ├── mobile-vs-clinic-iv/page.tsx
│   │   ├── first-iv-therapy-session/page.tsx
│   │   └── how-to-find-iv-clinic/page.tsx
│   ├── locations/
│   │   ├── page.tsx             # All states
│   │   └── [state]/
│   │       ├── page.tsx         # State cities
│   │       └── [city]/page.tsx  # City landing page
│   ├── privacy/
│   │   └── page.tsx             # Privacy Policy
│   ├── search/page.tsx
│   ├── services/
│   │   ├── page.tsx             # All service types
│   │   ├── [service]/page.tsx   # Service type page (e.g., nad-iv, vitamin-drips)
│   │   └── [service]/[state]/page.tsx  # Service + state combo
│   ├── mobile-iv/
│   │   ├── page.tsx             # Mobile IV services landing
│   │   └── [state]/page.tsx     # Mobile IV by state
│   ├── terms/
│   │   └── page.tsx             # Terms of Service
│   ├── sitemap.ts               # Auto-generates /sitemap.xml
│   ├── robots.ts                # Auto-generates /robots.txt
│   ├── layout.tsx               # Includes GoogleAnalytics component
│   ├── page.tsx                 # Homepage
│   └── globals.css
├── components/
│   ├── ClinicCard.tsx
│   ├── ClinicSelector.tsx
│   ├── ComparisonTable.tsx
│   ├── ConsultForm.tsx
│   ├── Footer.tsx
│   ├── GoogleAnalytics.tsx
│   ├── Header.tsx               # Nav: Locations, Services, Mobile IV, Compare, Guides, About
│   ├── LeadForm.tsx
│   ├── LocationFilters.tsx
│   ├── SearchBar.tsx
│   └── CredentialBadges.tsx     # Provider credential indicators
├── lib/
│   ├── format-clinic-name.ts
│   ├── schema-org.ts
│   └── supabase/
│       ├── client.ts
│       └── server.ts            # createClient() for anon, createServiceClient() for writes
└── types/
    ├── clinic.ts
    ├── database.ts
    └── supabase.ts
```

---

## Database Schema

### Supabase Project
- **URL**: TBD (create new Supabase project)
- **Project Ref**: TBD

### `clinics` Table — Key Fields

**Basic:**
```sql
id, name, slug, description, address, city, state, zip,
phone, website, logo_url, verified, mobile_service_available,
created_at, updated_at
```

**IV-Specific Fields:**
```sql
-- Care Setting
care_setting              -- 'in_clinic' | 'mobile_only' | 'both'
mobile_service_radius     -- text (e.g., "25 miles", "Greater Miami area")
mobile_service_areas      -- text[] array of areas served

-- Service Menu
service_types             -- text[] array: hydration, vitamin_drips, nad_plus, athletic_recovery,
                          --   hangover_relief, immune_support, beauty_anti_aging, weight_loss,
                          --   migraine_relief, detox, custom_blends, b12_shots, glutathione
drip_menu_available       -- boolean (does the clinic publish a menu?)

-- Pricing
price_range_min           -- integer (stored in cents, per infusion)
price_range_max           -- integer (stored in cents, per infusion)
membership_available      -- boolean
membership_price_monthly  -- integer (stored in cents)
pricing_disclosed         -- boolean
group_discounts           -- boolean
event_services            -- boolean (parties, corporate events, etc.)

-- Medical Supervision & Credentials
supervision_level         -- 'md_onsite' | 'md_oversight' | 'np_supervised' | 'rn_administered'
medical_director_name     -- text
administering_credentials -- text[] array: RN, LPN, NP, PA, MD, DO, paramedic
license_states            -- text[] array of state abbreviations
clinician_npi_numbers     -- text[] array

-- Safety & Compliance
sterile_compounding       -- boolean (uses 503A/503B pharmacy)
ingredient_sourcing       -- text (e.g., "FDA-registered 503B pharmacy")
adverse_event_policy      -- boolean
consent_form_required     -- boolean
allergy_screening         -- boolean
safety_disclosures        -- text (free text for any additional safety info)

-- Booking & Access
walk_ins_accepted         -- boolean
appointment_required      -- boolean
online_booking_url        -- text
hours_of_operation        -- jsonb
after_hours_available     -- boolean

-- Data Quality
is_iv_clinic              -- boolean (confirmed IV therapy provider)
featured                  -- boolean default false
email                     -- text (extracted from clinic website)
last_crawled_at           -- timestamptz
crawl_skipped             -- boolean default false
last_verified_date        -- timestamp
data_sources              -- text[]

-- SEO/Schema.org
latitude                  -- decimal(10,8)
longitude                 -- decimal(11,8)
rating_value              -- decimal(3,2)
rating_count              -- integer
```

### `leads` Table
```sql
id, clinic_id, first_name, last_name, email, phone, message,
source, status, created_at, updated_at
```

### `clinic_services` Table (Junction)
```sql
id, clinic_id, service_type, available, price_cents, duration_minutes, description, notes, created_at
UNIQUE(clinic_id, service_type)
```

### Important Notes
- `hours_of_operation` is `jsonb` — access with `as any` cast in TypeScript
- Use `createServiceClient()` for all write operations (RLS bypass)
- Prices stored in cents to avoid floating-point issues

---

## Email Infrastructure

### How It Works
1. User submits lead form on any clinic page
2. `createLead()` in `leads.ts` inserts to Supabase using service role client
3. Resend sends notification email from `notifications@ivhealthclinics.com` to `hello@ivhealthclinics.com`
4. ImprovMX forwards `hello@ivhealthclinics.com` → `info@tenafterten.com`

### Resend
- **Domain**: ivhealthclinics.com (needs verification)
- **From address**: `notifications@ivhealthclinics.com`
- **DNS records**: DKIM + SPF in Vercel DNS
- **Free tier**: 3,000 emails/month

### ImprovMX
- **Alias**: `*@ivhealthclinics.com` → `info@tenafterten.com`
- **MX records**: mx1.improvmx.com (priority 10) + mx2.improvmx.com (priority 20)

---

## Data Pipeline

### Phase 1: Initial Seeding
**Sources** (in order of priority):
1. **Google Places API** — Search for "IV therapy", "IV hydration", "vitamin drip", "IV infusion" + city/state combos. This is the primary seed source since IV clinics are businesses (not necessarily NPI-registered providers).
2. **NPPES NPI Registry** — Secondary source for medically supervised infusion centers. Search taxonomy codes for infusion therapy, naturopathic medicine, integrative medicine.
3. **Yelp/Brave Search API** — Supplement with business listing data for mobile IV services and wellness-focused providers that may not appear in medical registries.

**Why different from HormoneMap**: IV therapy clinics are often wellness businesses (not always NPI-registered medical practices), so Google Places is the primary seed rather than NPI. Many are mobile services, concierge operations, or med-spa add-ons.

### Phase 2: Google Places Enrichment
- Enrich with: website URL, hours, Google rating, review count, photos
- Batch processing in groups of 1,000–5,000
- Cost estimate: ~$0.006/record

### Phase 3: IV Clinic Identification
- Flag confirmed IV therapy providers (`is_iv_clinic = true`)
- Categorize by service types based on business name and category
- Separate mobile-only vs in-clinic vs both

### Phase 4: Website Crawling & IV Data Extraction
- **Tools**: Crawl4AI (website → markdown) + Claude Haiku API (extraction)
- **Fields to extract**: service_types, care_setting, pricing, supervision_level, drip_menu_available, membership info, safety disclosures, mobile service areas, email
- **Rate limiting**: Semaphore of 3 concurrent crawls, 1s delay between Claude API calls
- **Cost estimate**: ~$0.67 per 1,000 clinics

---

## SEO Infrastructure

### Sitemap (`src/app/sitemap.ts`)
Auto-generates `/sitemap.xml`. Includes:
- Static pages (home, locations, search, compare, guides, about)
- All 50 state pages (`/locations/[state]`)
- All city pages (dynamically queried from DB)
- All clinic profiles (`/clinics/[slug]`)
- All service type pages (`/services/[service]`)
- All service+state pages (`/services/[service]/[state]`)
- All mobile IV state pages (`/mobile-iv/[state]`)
- Guide articles

### Open Graph / Meta Tags
All page types need `generateMetadata()` with full OG + Twitter Card tags:
- Base URL: `https://ivhealthclinics.com`
- Default OG image: `/og-default.png`
- `metadataBase` set in `src/app/layout.tsx`
- `alternates.canonical` on all dynamic pages

### Schema.org
HealthAndBeautyBusiness + LocalBusiness JSON-LD on all clinic profile pages. Includes geo coordinates, hours, ratings, service menu.

### robots.txt
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/
Sitemap: https://ivhealthclinics.com/sitemap.xml
```

---

## Content Pages

### About Page (`/about`)
- Operated by Ten After Ten Group LLC
- Covers: mission, data sources, editorial standards, medical disclaimer
- Contact: hello@ivhealthclinics.com

### Legal Pages
- `/privacy` — Privacy Policy
- `/terms` — Terms of Service
- `/contact` — Contact page

### Guide Articles (`/guides`) — Planned
1. `/guides/iv-therapy-cost` — How Much Does IV Therapy Cost?
2. `/guides/types-of-iv-drips` — Types of IV Drips: Complete Guide
3. `/guides/mobile-vs-clinic-iv` — Mobile IV vs In-Clinic: Which Is Right for You?
4. `/guides/first-iv-therapy-session` — What to Expect at Your First IV Therapy Session
5. `/guides/how-to-find-iv-clinic` — How to Find an IV Therapy Clinic Near You

### Service Type Pages (`/services`) — Planned
- `/services/hydration` — IV Hydration
- `/services/nad-plus` — NAD+ IV Therapy
- `/services/vitamin-drips` — Vitamin Drip Therapy
- `/services/athletic-recovery` — Athletic Recovery IV
- `/services/immune-support` — Immune Support IV
- `/services/hangover-relief` — Hangover IV Therapy
- `/services/beauty-anti-aging` — Beauty & Anti-Aging IV
- `/services/weight-loss` — Weight Loss IV Therapy
- `/services/migraine-relief` — Migraine Relief IV
- `/services/b12-shots` — B12 Injections
- `/services/glutathione` — Glutathione IV Therapy

---

## Deployment

### Vercel Setup
- **Project**: ivhealthclinics
- **Repo**: github.com/brettage/ivhealthclinics
- **Auto-deploy**: On push to `main` branch
- **Domain**: ivhealthclinics.com

### Deploy Process
```bash
git add .
git commit -m "Your message"
git push
# Vercel auto-deploys — check dashboard for status
```

### DNS
- **Registrar**: GoDaddy
- **Nameservers**: ns1.vercel-dns.com, ns2.vercel-dns.com (after transfer)

---

## Known Issues & Fixes (Inherited from HormoneMap)

### TypeScript: `hours_of_operation` Type Error
```typescript
// WRONG
clinic.hours_of_operation.openNow
// CORRECT
(clinic.hours_of_operation as any).openNow
```

### Supabase Client in sitemap.ts
```typescript
const supabase = await createClient()  // ✅
const supabase = createClient()        // ❌
```

### Vercel Build: Scripts Folder
TypeScript compilation excludes `scripts/` folder via `tsconfig.json`. Do not change `"include"` back to `"**/*.ts"`.

### Supabase RLS: Silent Write Failures
Use `createServiceClient()` for all write operations.

---

## Data Formatting Utilities

### Title Case (`src/lib/format-clinic-name.ts`)
```typescript
formatClinicName('MIAMI IV HYDRATION LLC')
// => 'Miami IV Hydration LLC'
```
Handles: medical abbreviations (MD, DO, NP, LLC, IV, RN), roman numerals, name prefixes.

### Phone Format
`(XXX) XXX-XXXX` — applied at import time.

---

## Project Status

**Version**: 0.1.0
**Status**: Pre-development
**Last Updated**: March 19, 2026

### Completed ✅
- (nothing yet — project kickoff)

### Operated By
**Ten After Ten Group LLC**
Contact: hello@ivhealthclinics.com

---

*Always update this file after completing major features or data operations.*
