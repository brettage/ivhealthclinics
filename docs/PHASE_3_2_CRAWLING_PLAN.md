# Phase 3.2 — Website Crawling Plan

**Status:** Ready to run
**Script:** `scripts/crawl_iv_clinics.py`
**Target:** 3,296 clinics in `places_discovery` with website URLs
**Estimated cost:** ~$17 Claude (Crawl4AI is free)

---

## Goal

Enrich `places_discovery` rows with structured clinic data extracted from their websites:

| Field | Source |
|---|---|
| `is_iv_clinic` | Confirms the business is actually a wellness IV clinic (not oncology infusion) |
| `service_types` | hydration, vitamin_drips, nad_plus, hangover_relief, etc. |
| `care_setting` | in_clinic / mobile_only / both |
| `mobile_service_available` | bool |
| `supervision_level` | md_onsite / md_oversight / np_supervised / rn_administered |
| `price_range_min/max` | Dollars (lowest and highest IV drip price) |
| `membership_available` | bool |
| `walk_ins_accepted` | bool |
| `sterile_compounding` | bool (USP 797 mentioned) |
| `administering_credentials` | RN, NP, PA, MD, DO, paramedic |

---

## Migration (run once before first crawl)

In Supabase Dashboard → SQL Editor:

```sql
ALTER TABLE places_discovery
  ADD COLUMN IF NOT EXISTS crawl_status  TEXT,
  ADD COLUMN IF NOT EXISTS crawled_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS crawl_result  JSONB;

CREATE INDEX IF NOT EXISTS idx_pd_crawl_status
  ON places_discovery(crawl_status) WHERE crawl_status IS NOT NULL;
```

---

## Setup

```bash
pip install crawl4ai anthropic supabase python-dotenv
playwright install chromium
```

Required `.env.local` vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`

---

## Run Strategy

Run in incremental batches to stay within daily API rate limits and inspect quality early.

### Step 1 — Dry run on 20 clinics (no cost)

```bash
python scripts/crawl_iv_clinics.py --limit 20 --dry-run
```

Verifies Crawl4AI and Claude are working. Prints extracted JSON without writing to DB.

### Step 2 — Pilot batch of 100 clinics (~$0.50)

```bash
python scripts/crawl_iv_clinics.py --limit 100 --yes
```

After completion, review quality:
```bash
python scripts/crawl_iv_clinics.py --stats
```

Check `crawl_result` in Supabase for a sample of rows. Confirm `is_iv_clinic`, `service_types`, and `price_range_min/max` look correct.

### Step 3 — Full run (~3,200 remaining clinics, ~$16)

```bash
python scripts/crawl_iv_clinics.py --yes
```

The hard cap is 500 per run by default. Run multiple times — the script is resumable and skips already-crawled rows automatically. To run all at once, pass `--limit 3300`.

### Step 4 — Retry errors

```bash
python scripts/crawl_iv_clinics.py --reset-errors --yes
```

Rows that errored on crawl (timeout, JS-only page, bot block) are retried. Some will remain errors — acceptable for ~5–10% of crawls.

---

## Quality Gates (before merge)

After all clinics are crawled, evaluate before merging into `clinics`:

| Gate | Target |
|---|---|
| `crawl_status = 'done'` rate | ≥ 85% of rows with websites |
| `is_iv_clinic = true` rate | ≥ 80% of done rows (Google Places pre-filters well) |
| `service_types` non-empty | ≥ 60% of done rows |
| `price_range_min` found | ≥ 25% of done rows (many clinics hide pricing) |

If `is_iv_clinic = false` rate is high (>25%), inspect those rows manually — may indicate keyword false-positives from the Places discovery run (e.g., medical infusion centers).

---

## Data Flow

```
places_discovery (3,296 rows)
  + crawl_result JSONB
        ↓
  [Phase 3.3 — Merge script]
        ↓
  clinics table
  (source = 'google_places')
```

The merge script (Phase 3.3, not yet written) will:
1. Filter `places_discovery` where `crawl_status = 'done'` AND `crawl_result->>'is_iv_clinic' = 'true'`
2. Map `crawl_result` fields to `clinics` columns (prices × 100 for cents)
3. Set `is_iv_clinic = true`, `enrichment_status = 'enriched'`, `match_confidence = 'high'`
4. Insert into `clinics` (upsert on `google_place_id`)
5. Update `places_discovery.merge_status = 'merged'` and `merged_into_clinic_id`

---

## Cost Economics

| Item | Details |
|---|---|
| Crawl4AI | Free (open-source, self-hosted Playwright) |
| Claude Haiku 4.5 input | ~4,000 tokens/clinic × 3,296 = 13.2M tokens @ $1/1M = **$13** |
| Claude Haiku 4.5 output | ~250 tokens/clinic × 3,296 = 824K tokens @ $5/1M = **$4** |
| **Total** | **~$17** |

Compare to Phase 3 discovery ($15.84) — similar cost, much richer data output.

---

## Known Failure Modes

| Failure | Crawl status | Mitigation |
|---|---|---|
| Page timeout (slow site) | `error` | Retry with `--reset-errors`; 20s timeout is generous |
| JS-only SPA (blank crawl) | `skipped` | Crawl4AI uses Playwright — handles most SPAs |
| Bot protection / 403 | `error` | Some clinic sites block scrapers; accept as data gap |
| Short page (< 30 words) | `skipped` | Site may redirect to booking widget; accept as data gap |
| Claude parse error | `error` | Rare; Claude returns non-JSON; retry usually fixes it |

Expect ~5–10% combined error/skip rate. These clinics will still appear in the directory without enrichment data; the `service_types` field will just be empty.

---

## Monitoring

The script logs all errors to `scripts/crawl_errors.log` (tab-separated):

```
{place_id}  {name}  {website}  {stage}  {error_message}
```

Check this file after each batch to spot patterns (e.g., a specific CDN blocking the crawler).
