# IVHealthClinics — Master To-Do List

**Created**: March 19, 2026
**Status**: Pre-development

---

## Phase 0: Project Setup & Infrastructure (Week 1)

### Domain & Hosting
- [ ] Purchase/confirm ivhealthclinics.com domain (GoDaddy)
- [ ] Create new GitHub repo: github.com/brettage/ivhealthclinics
- [ ] Create new Vercel project linked to repo
- [ ] Point domain nameservers to Vercel DNS (ns1.vercel-dns.com, ns2.vercel-dns.com)
- [ ] Connect custom domain in Vercel dashboard

### Supabase
- [ ] Create new Supabase project (separate from HormoneMap)
- [ ] Run `supabase/schema.sql` to create tables
- [ ] Verify RLS policies are active
- [ ] Copy project URL, anon key, and service role key
- [ ] Test write operations with service role key

### Project Scaffold
- [ ] Initialize Next.js 16 project with TypeScript + Tailwind CSS 4 + App Router
- [ ] Set up `.env.local` with all environment variables
- [ ] Set up `.gitignore` (include scripts/, checkpoint files, .env.local)
- [ ] Configure `tsconfig.json` — scope `"include"` to `src/**` only
- [ ] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, Geist fonts
- [ ] Create `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`
- [ ] Create TypeScript types (`src/types/clinic.ts`, `database.ts`, `supabase.ts`)
- [ ] Verify `npm run dev` starts cleanly
- [ ] Verify `npm run build` succeeds
- [ ] Push to GitHub → confirm Vercel auto-deploys

---

## Phase 1: Core Pages & Layout (Week 1–2)

### Layout & Navigation
- [ ] Create `src/app/layout.tsx` with metadata, Geist fonts, metadataBase
- [ ] Create `src/components/Header.tsx` — Nav: Locations, Services, Mobile IV, Compare, Guides, About
- [ ] Create `src/components/Footer.tsx` — Links, legal pages, copyright
- [ ] Create `src/app/globals.css` with Tailwind imports
- [ ] Design color scheme / brand identity (distinct from HormoneMap)

### Homepage
- [ ] Create `src/app/page.tsx` — Hero section, search bar, featured clinics, service type cards
- [ ] Create `src/components/SearchBar.tsx` — Location + service type search
- [ ] Add quick-filter chips (Mobile IV, NAD+, Hydration, etc.)
- [ ] Add "How It Works" section
- [ ] Add city quick links section

### Clinic Listing Card
- [ ] Create `src/components/ClinicCard.tsx`
- [ ] Display: name, city/state, rating, service types, care setting badge, price range
- [ ] Mobile service badge (🚐)
- [ ] Link to detail page

### Clinic Detail Page
- [ ] Create `src/app/clinics/[slug]/page.tsx`
- [ ] Hero section with breadcrumbs, name, location, badges
- [ ] About section with description
- [ ] Service menu / drip types offered
- [ ] Pricing information (if disclosed)
- [ ] Medical credentials & supervision level
- [ ] Safety information section
- [ ] Contact sidebar (address, phone, website, booking link)
- [ ] Lead capture form (sidebar)
- [ ] Similar clinics nearby section
- [ ] Create `src/app/clinics/[slug]/not-found.tsx`

### Search Page
- [ ] Create `src/app/search/page.tsx`
- [ ] Full-text search by name/city/state
- [ ] Filters: service type, care setting, price range, mobile available, verified

---

## Phase 2: Location & Service Pages (Week 2–3)

### Location Pages
- [ ] Create `src/app/locations/page.tsx` — All 50 states grid
- [ ] Create `src/app/locations/[state]/page.tsx` — Cities in state
- [ ] Create `src/app/locations/[state]/[city]/page.tsx` — City landing page with clinics
- [ ] Create `src/components/LocationFilters.tsx` — Sidebar filters for city pages
- [ ] Add NPI count display on state cards

### Service Type Pages
- [ ] Create `src/app/services/page.tsx` — All service types grid
- [ ] Create `src/app/services/[service]/page.tsx` — Clinics offering specific service
- [ ] Create `src/app/services/[service]/[state]/page.tsx` — Service + state combo
- [ ] Service types to create pages for:
  - [ ] hydration
  - [ ] vitamin-drips
  - [ ] nad-plus
  - [ ] athletic-recovery
  - [ ] hangover-relief
  - [ ] immune-support
  - [ ] beauty-anti-aging
  - [ ] weight-loss
  - [ ] migraine-relief
  - [ ] b12-shots
  - [ ] glutathione

### Mobile IV Pages
- [ ] Create `src/app/mobile-iv/page.tsx` — Mobile IV landing page
- [ ] Create `src/app/mobile-iv/[state]/page.tsx` — Mobile IV by state

---

## Phase 3: Comparison & Lead Capture (Week 3)

### Comparison Tool
- [ ] Create `src/app/compare/page.tsx`
- [ ] Create `src/components/ClinicSelector.tsx`
- [ ] Create `src/components/ComparisonTable.tsx`
- [ ] Compare fields: care setting, service types, pricing, credentials, safety, ratings

### Lead Capture
- [ ] Create `src/components/ConsultForm.tsx` — Compact sidebar form
- [ ] Create `src/components/LeadForm.tsx` — General lead capture
- [ ] Create `src/app/actions/leads.ts` — Server action with Resend email
- [ ] Create `src/app/actions/clinics.ts` — Clinic CRUD operations
- [ ] Test full lead flow: form → Supabase → Resend email

---

## Phase 4: Content & Legal Pages (Week 3–4)

### Legal Pages
- [ ] Create `src/app/about/page.tsx` — Ten After Ten Group LLC
- [ ] Create `src/app/privacy/page.tsx` — Privacy Policy
- [ ] Create `src/app/terms/page.tsx` — Terms of Service
- [ ] Create `src/app/contact/page.tsx` — Contact page

### Guide Articles
- [ ] Create `src/app/guides/page.tsx` — Guides index
- [ ] Create `/guides/iv-therapy-cost` — How Much Does IV Therapy Cost?
- [ ] Create `/guides/types-of-iv-drips` — Types of IV Drips: Complete Guide
- [ ] Create `/guides/mobile-vs-clinic-iv` — Mobile IV vs In-Clinic
- [ ] Create `/guides/first-iv-therapy-session` — What to Expect
- [ ] Create `/guides/how-to-find-iv-clinic` — How to Find an IV Clinic

---

## Phase 5: SEO Infrastructure (Week 4)

### Technical SEO
- [ ] Create `src/app/sitemap.ts` — Auto-generated sitemap
- [ ] Create `src/app/robots.ts` — robots.txt
- [ ] Create `src/lib/schema-org.ts` — HealthAndBeautyBusiness + LocalBusiness JSON-LD
- [ ] Add `generateMetadata()` with OG + Twitter Card tags to ALL page types
- [ ] Set `metadataBase` in layout.tsx
- [ ] Add `alternates.canonical` on all dynamic pages
- [ ] Create `/og-default.png` for Open Graph image

### Favicon & PWA
- [ ] Create `src/app/favicon.ico`
- [ ] Create `public/apple-touch-icon.png` (180x180)
- [ ] Create `public/icon-192.png`, `public/icon-512.png`

### Google Setup
- [ ] Set up Google Analytics (GA4) — get measurement ID
- [ ] Create `src/components/GoogleAnalytics.tsx`
- [ ] Add GA to `layout.tsx` (afterInteractive, no 'use client')
- [ ] Verify property in Google Search Console (TXT record in Vercel DNS)
- [ ] Submit sitemap to Google Search Console

---

## Phase 6: Email Infrastructure (Week 4)

- [ ] Add domain to Resend (ivhealthclinics.com)
- [ ] Add DKIM record (`resend._domainkey` TXT) in Vercel DNS
- [ ] Add SPF record (`send` TXT) in Vercel DNS
- [ ] Set up ImprovMX: `*@ivhealthclinics.com` → `info@tenafterten.com`
- [ ] Add MX records in Vercel DNS (mx1.improvmx.com, mx2.improvmx.com)
- [ ] Test end-to-end: form submit → Supabase insert → Resend notification → ImprovMX forward

---

## Phase 7: Data Pipeline (Weeks 2–6, parallel with UI work)

### 7a: Google Places Seeding (Primary)
- [ ] Write `scripts/seed-google-places.ts` — Search for IV therapy businesses
- [ ] Search queries: "IV therapy", "IV hydration", "vitamin drip", "IV infusion", "mobile IV"
- [ ] Target top 100 cities first, expand to all metro areas
- [ ] Import to Supabase: name, address, phone, website, hours, rating, lat/lng
- [ ] Generate slugs, format phone numbers, title case names
- [ ] Deduplicate on address + phone

### 7b: NPI Supplementary Seeding
- [ ] Write `scripts/seed-npi.ts` — Query NPPES API for infusion-related taxonomy codes
- [ ] Relevant taxonomy codes: naturopathic, integrative medicine, infusion therapy
- [ ] Cross-reference with Google Places data to avoid duplicates
- [ ] Import supplementary listings

### 7c: Google Places Enrichment
- [ ] Write `scripts/enrich-google-places.ts`
- [ ] Enrich clinics missing: website URL, hours, rating, review count
- [ ] Process in batches of 1,000–5,000
- [ ] Track cost per record

### 7d: Website Crawling & IV Data Extraction
- [ ] Write `scripts/crawl_iv_clinics.py`
- [ ] Use Crawl4AI for website → markdown conversion
- [ ] Use Claude Haiku API for structured field extraction (see IV_FIELDS_GUIDE.md)
- [ ] Extract: service_types, care_setting, pricing, supervision_level, drip_menu, credentials, safety, email
- [ ] Rate limiting: semaphore of 3, 1s delay between API calls
- [ ] Checkpointing: save progress every 10 records
- [ ] Email extraction: regex scrape homepage + /contact pages

### 7e: Data Cleanup & Verification
- [ ] Flag confirmed IV clinics (`is_iv_clinic = true`)
- [ ] Categorize care_setting (in_clinic / mobile_only / both)
- [ ] Remove non-IV businesses that slipped through
- [ ] Normalize city/state names
- [ ] Deduplicate on address + business name

---

## Phase 8: Post-Launch Optimization (Week 5+)

### Content
- [ ] Write unique intro paragraphs for top 25 city pages (SEO — YMYL)
- [ ] Add FAQ schema to guide articles
- [ ] Create state-specific regulatory notes (IV therapy rules vary by state)

### Features
- [ ] "Claim Your Listing" page for clinic owners
- [ ] Freshness / staleness flagging (flag listings not verified in 6+ months)
- [ ] Clinic outreach emails (CSV export for Mailchimp — NOT Resend for cold outreach)

### Performance
- [ ] Run Lighthouse audit — target 95+ across all categories
- [ ] Optimize images (next/image, WebP)
- [ ] Test Core Web Vitals

---

## Phase 9: Monetization (Post-Traffic)

- [ ] Featured placement (paid clinics appear first in city results)
- [ ] Verified Clinic subscription tier
- [ ] Pay-per-lead model
- [ ] "Pricing Disclosed" badge (free but requires clinic engagement — funnel to paid)
- [ ] Clinic owner dashboard (future — start with email-based lead routing)
- [ ] Event/group booking lead generation premium

---

## Key Differences from HormoneMap

| Aspect | HormoneMap | IVHealthClinics |
|--------|-----------|-----------------|
| Primary data source | NPI Registry (medical providers) | Google Places (wellness businesses) |
| Clinic type | Medical practices | Mix of medical + wellness + mobile |
| Key filter | Modality (injections, gels, pellets) | Service type (NAD+, hydration, recovery) |
| Unique angle | Telehealth by state, pricing transparency | Mobile vs in-clinic, safety/credentials |
| Care model field | telehealth_only / hybrid / in_person_only | in_clinic / mobile_only / both |
| Credential focus | NPI verification, license states | Supervision level, administering credentials |
| Safety angle | (minimal) | Sterile compounding, ingredient sourcing, adverse event policy |
| Schema.org type | MedicalBusiness | HealthAndBeautyBusiness |
| Regulatory | Less state variation | Significant state-by-state variation |

---

## File Checklist (What to Create)

### Documentation (✅ = created in this session)
- [x] `IVHEALTHCLINICS.md` — Main project documentation
- [x] `QUICKSTART.md` — Quick start guide
- [x] `IV_FIELDS_GUIDE.md` — IV-specific field reference
- [x] `supabase_schema.sql` — Database schema
- [x] `TODO.md` — This file
- [ ] `CLAUDE.md` — Claude Code instructions (create when starting dev)
- [ ] `CLINIC_PROFILE.md` — Clinic profile page documentation
- [ ] `COMPARISON_FEATURE_GUIDE.md` — Comparison tool docs
- [ ] `SCHEMA_ORG_GUIDE.md` — Schema.org implementation
- [ ] `HOMEPAGE_DESIGN.md` — Homepage design spec

---

*Update this file as tasks are completed. Check off items with `[x]`.*
