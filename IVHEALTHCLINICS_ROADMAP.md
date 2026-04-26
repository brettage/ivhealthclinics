# IVHealthClinics — Roadmap

**Current status (2026-04-25)**: Site live at ivhealthclinics.com. Directory currently shows ~154 NPI-enriched IV clinics. Discovery phase complete with 3,296 additional Places-sourced clinics in `places_discovery` staging, awaiting merge into main `clinics` table.

For technical details, schema, and session-specific learnings, see `CLAUDE2.md`.

---

## ✅ Complete

- **Phase 1: DNS, Analytics & Indexing** — Vercel DNS, GA4 (`G-4ZW806CWHT`), Search Console, sitemap submitted
- **Phase 2: SEO Foundation** — Sitemap, robots.txt, Schema.org `HealthAndBeautyBusiness` JSON-LD, OG tags, `metadataBase`. Outstanding: favicon/PWA icons, `alternates.canonical` audit on dynamic pages
- **Phase 3.1: NPI Enrichment** — 154 clinics enriched with Google Places data (ratings, hours, photos, lat/lng). Match confidence tiers in place. Final cost ~$3.
- **Phase 3 Pivot: Google Places Discovery** — 3,296 unique IV clinics discovered across 100 US metros for $15.84. Validates strategic shift from NPI-primary to Places-primary seeding.

---

## 🔴 Active — Next Session

### Merge `places_discovery` → `clinics`

Goal: get the discovered clinics into the live directory.

- [ ] Quality filter decision (recommend 5+ reviews → 3,023 surviving rows)
- [ ] Optional: Geographic gap-fill run (~$5, ~30 suburban metros, +500-1000 clinics)
- [ ] Add `source` column to `clinics` ('npi' | 'google_places' | 'manual')
- [ ] Make NPI-specific columns nullable
- [ ] Migration: insert `places_discovery` rows into `clinics` with `source='google_places'`, `is_iv_clinic=true`, appropriate `match_confidence`
- [ ] Skip 16 overlap rows where `google_place_id` already exists
- [ ] Generate slugs for new clinic rows
- [ ] Verify pages render: `/clinics/[slug]`, state pages, city pages
- [ ] Update sitemap regeneration to include new rows
- [ ] Deploy and verify production

Detailed steps in `TODO_2026-04-25.md`.

---

## 🟡 Phase 3.2 — Website Crawling (After Merge)

Crawl ~3,200 clinic websites to extract IV-specific service/pricing/safety fields. Same pattern as HormoneMap's `crawl_trt_clinics.py`.

- [ ] Write `scripts/crawl_iv_clinics.py` using Crawl4AI + Claude Haiku
- [ ] Extract per IV_FIELDS_GUIDE.md: service_types, care_setting, pricing, supervision_level, credentials, safety, mobile service areas, email
- [ ] Rate limit: 3 concurrent, 1s delay between API calls
- [ ] Checkpoint every 10 records
- [ ] Resolve `address_only` confidence rows from Phase 3.1 — verify or reject based on crawled content
- [ ] Refine `is_iv_clinic` flag based on website content (not just inclusion in directory)
- [ ] Score clinics on data completeness for ranking
- [ ] Estimated cost: ~$0.05-0.10 per crawl × 3,200 = $150-300

---

## 🟡 Phase 4 — Content & Legal Pages

### Legal pages
- [ ] `/about` — Ten After Ten Group LLC, mission, data sources, medical disclaimer
- [ ] `/privacy` — Privacy policy
- [ ] `/terms` — Terms of service
- [ ] `/contact` — Contact page

### Guide articles (SEO content, target long-tail keywords)
- [ ] `/guides/iv-therapy-cost`
- [ ] `/guides/types-of-iv-drips`
- [ ] `/guides/mobile-vs-clinic-iv`
- [ ] `/guides/first-iv-therapy-session`
- [ ] `/guides/how-to-find-iv-clinic`

### City + service page content
- [ ] Unique intro paragraphs for top 25 city pages (YMYL signal — Google cares)
- [ ] State-specific regulatory notes (IV therapy rules vary by state)
- [ ] Add FAQ schema to guide articles

---

## 🟡 Phase 5 — Email Infrastructure

- [ ] Add `ivhealthclinics.com` to Resend
- [ ] DKIM TXT record (`resend._domainkey`) in Vercel DNS
- [ ] SPF TXT record (`send` subdomain)
- [ ] From address: `notifications@ivhealthclinics.com`
- [ ] ImprovMX wildcard alias: `*@ivhealthclinics.com` → `info@tenafterten.com`
- [ ] MX records (mx1.improvmx.com, mx2.improvmx.com)
- [ ] Lead form backend: `src/app/actions/leads.ts` with Supabase insert + Resend notification
- [ ] `src/components/ConsultForm.tsx` — sidebar form for clinic detail pages
- [ ] End-to-end test: form → Supabase → Resend → ImprovMX → inbox

---

## 🟢 Phase 6 — Feature Additions

- [ ] **Comparison tool** at `/compare` — select 2-3 clinics, compare side-by-side (care setting, services, pricing, credentials, ratings). URL state via query params.
- [ ] **Mobile IV landing pages** — `/mobile-iv` and `/mobile-iv/[state]`. High-intent keyword differentiator.
- [ ] **Service type pages** — `/services` index, `/services/[type]`, `/services/[type]/[state]` combos
- [ ] **NPI verification pages** (optional) — `/npi/[number]` queries live NPPES API. Good unique-page SEO play.

---

## 🟢 Phase 7 — Performance & QA

- [ ] Lighthouse audit on homepage, clinic detail, city page (target 95+ across categories)
- [ ] Mobile QA — touch targets, font sizes, scroll behavior, search flow
- [ ] Core Web Vitals monitoring in Search Console
- [ ] Image optimization (next/image, WebP)
- [ ] Favicon and PWA icons (carryover from Phase 2)

---

## 🔵 Phase 8 — Clinic Outreach

- [ ] "Claim Your Listing" page — form for clinic owners to request listing management
- [ ] Manual review process via email notifications
- [ ] "Verified" badge after confirmation
- [ ] Outreach campaign: export top 100 clinic emails, use **Mailchimp** for cold outreach (NOT Resend — wrong tool for bulk)
- [ ] Lead routing: forward consultation requests to relevant clinic
- [ ] Track which clinics respond vs ignore

---

## 🔵 Phase 9 — Ongoing Maintenance

- [ ] Re-run Places discovery monthly to catch new clinics
- [ ] Re-crawl websites quarterly for updated pricing/services
- [ ] Flag stale listings (>6 months unverified) with "Needs Update" indicator
- [ ] Monthly GA4 + Search Console review (traffic sources, conversions, keyword opportunities)
- [ ] Add new guide articles monthly

---

## ⚪ Phase 10 — Monetization (Only After Organic Traffic)

Don't build payment features until traffic proves demand.

- [ ] **Featured placement** — paid clinics first in city/state results. Simple `featured = true` toggle. Price by market size.
- [ ] **Verified Clinic subscription** — monthly fee for verified badge, priority placement, logo, custom description. Stripe integration.
- [ ] **Pay-per-lead** — charge per qualified consultation request. Track lead source attribution.
- [ ] **"Pricing Disclosed" badge** — free but requires clinic engagement. Funnel to paid features.
- [ ] **Clinic owner dashboard** — self-service portal replacing email-based lead routing. Build only when subscriber count justifies.

---

## Priority Summary

| Priority | Phase | Effort | Impact |
|---|---|---|---|
| 🔴 Now | Merge places_discovery → clinics | Medium | Unlocks full directory inventory |
| 🟡 Next | 3.2 Website crawling | High | Transforms data quality, fills service/pricing fields |
| 🟡 Next | 4. Content & legal pages | Medium | SEO + trust + compliance |
| 🟡 Next | 5. Email infrastructure | Low | Enables lead capture revenue |
| 🟢 Soon | 6. Comparison tool, mobile IV pages | Medium | Feature differentiation |
| 🟢 Soon | 7. Performance & QA | Low | Polish before scaling traffic |
| 🔵 Later | 8. Clinic outreach | Medium | Provider relationships |
| 🔵 Later | 9. Maintenance pipeline | Low | Keeps data fresh |
| ⚪ When ready | 10. Monetization | High | Revenue, only after traffic |

---

*Last updated: 2026-04-25. Update as phases complete.*
