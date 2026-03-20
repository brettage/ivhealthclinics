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

#### `clinic_services`
Detailed drip menu: clinic_id, service_type, price_cents, duration_minutes, description

#### `leads`
Lead capture: clinic_id, first_name, last_name, email, phone, message, source, status

### Important Notes
- `hours_of_operation` is `jsonb` → access with `as any` cast
- Use `createServiceClient()` for ALL write operations (bypasses RLS)
- Prices stored in cents (multiply display values by 100)
- `is_iv_clinic` may not be in generated Supabase types yet → use `as any` cast

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

- All pages need `generateMetadata()` with OG + Twitter Card tags
- Base URL: `https://ivhealthclinics.com`
- Schema.org: `HealthAndBeautyBusiness` + `LocalBusiness` JSON-LD
- Canonical URLs on all dynamic pages
- Sitemap at `/sitemap.xml` (auto-generated)

## Email Flow

Form submit → `createLead()` → Supabase (service role) → Resend notification → ImprovMX → info@tenafterten.com

## Python Scripts

All scripts in `/scripts/` load env from `.env.local`:
```python
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent.parent / '.env.local')
```

Env var names for Python: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`

## Key Differences from HormoneMap
- Primary data source: Google Places (not NPI)
- Key filter: service_types (not modalities)
- Care model: care_setting (in_clinic/mobile_only/both) instead of telehealth
- Safety fields: sterile_compounding, ingredient_sourcing, adverse_event_policy
- Schema.org: HealthAndBeautyBusiness (not MedicalBusiness)
