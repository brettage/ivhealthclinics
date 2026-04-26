#!/usr/bin/env python3
"""
crawl_iv_clinics.py

Phase 3.2 — Website crawling and Claude Haiku extraction for Places-discovered clinics.

For each clinic in places_discovery with a website URL:
  1. Crawl the homepage with Crawl4AI (Playwright-based, handles JS-rendered pages)
  2. Truncate content to ~3,500 words to stay within token budget
  3. Send to Claude Haiku for structured extraction of clinic data
  4. Write result JSON to places_discovery.crawl_result

Required migration (run once in Supabase Dashboard → SQL Editor):
  ALTER TABLE places_discovery
    ADD COLUMN IF NOT EXISTS crawl_status  TEXT,         -- NULL | done | error | skipped
    ADD COLUMN IF NOT EXISTS crawled_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS crawl_result  JSONB;        -- structured output from Claude

  CREATE INDEX IF NOT EXISTS idx_pd_crawl_status
    ON places_discovery(crawl_status) WHERE crawl_status IS NOT NULL;

Cost estimate (3,296 clinics, Claude Haiku 4.5):
  Per clinic:  ~4,000 tokens input  + ~250 tokens output
  Total input: 13.2M tokens  @ ~$1/1M  ≈ $13
  Total output:  820K tokens @ ~$5/1M  ≈  $4
  Grand total:  ~$17  (Crawl4AI is free/open-source)
  Hard cap: 500 clinics per run by default (~$3/run, safe to test incrementally)

Usage:
  python scripts/crawl_iv_clinics.py                    # run on pending places_discovery rows
  python scripts/crawl_iv_clinics.py --limit 20         # test with 20 clinics
  python scripts/crawl_iv_clinics.py --dry-run          # crawl + extract but skip DB writes
  python scripts/crawl_iv_clinics.py --stats            # show crawl progress and exit
  python scripts/crawl_iv_clinics.py --reset-errors     # retry rows with crawl_status='error'
  python scripts/crawl_iv_clinics.py --yes              # skip cost confirmation prompt

Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
Install:  pip install crawl4ai anthropic supabase python-dotenv
          playwright install chromium
"""

import argparse
import asyncio
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

import anthropic
from dotenv import load_dotenv
from supabase import create_client

# ----------------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------------

load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

if not all([SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_API_KEY]):
    print("ERROR: Missing env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY)")
    sys.exit(1)

CLAUDE_MODEL = 'claude-haiku-4-5-20251001'
MAX_WORDS_PER_PAGE = 3_500     # Truncation limit — ~4,500 tokens
CRAWL_TIMEOUT_SEC = 20        # Per-page timeout
REQUEST_DELAY_SEC = 0.4       # Between Claude calls to respect rate limits
CHECKPOINT_EVERY = 25
HARD_CAP = 500                # Max clinics per run — override with --limit

# Approximate cost tracking (Haiku 4.5 pricing)
COST_PER_1M_INPUT = 1.00
COST_PER_1M_OUTPUT = 5.00

ERROR_LOG = Path(__file__).parent / 'crawl_errors.log'


# ----------------------------------------------------------------------------
# Crawl4AI
# ----------------------------------------------------------------------------

try:
    from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
    HAS_CRAWL4AI = True
except ImportError:
    HAS_CRAWL4AI = False
    print("WARNING: crawl4ai not installed. Run: pip install crawl4ai && playwright install chromium")


async def crawl_url(url: str) -> tuple[str, str | None]:
    """
    Crawl a URL and return (markdown_content, error_message).
    Falls back to empty string on failure.
    """
    if not HAS_CRAWL4AI:
        return '', 'crawl4ai_not_installed'

    try:
        config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            word_count_threshold=30,
            excluded_tags=['nav', 'footer', 'header', 'script', 'style'],
            process_iframes=False,
            remove_overlay_elements=True,
            page_timeout=CRAWL_TIMEOUT_SEC * 1000,
        )
        async with AsyncWebCrawler(verbose=False) as crawler:
            result = await asyncio.wait_for(
                crawler.arun(url=url, config=config),
                timeout=CRAWL_TIMEOUT_SEC + 5,
            )
        if not result.success:
            return '', result.error_message or 'crawl_failed'
        content = getattr(result, 'markdown_v2', None)
        if content:
            text = getattr(content, 'raw_markdown', '') or ''
        else:
            text = getattr(result, 'markdown', '') or ''
        return text.strip(), None
    except asyncio.TimeoutError:
        return '', 'timeout'
    except Exception as e:
        return '', str(e)[:200]


def truncate_to_words(text: str, max_words: int) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    return ' '.join(words[:max_words]) + '\n[... truncated]'


# ----------------------------------------------------------------------------
# Claude extraction
# ----------------------------------------------------------------------------

EXTRACTION_PROMPT = """You are extracting structured data from an IV therapy clinic website.

Website content:
---
{content}
---

Extract the following as a JSON object. Use null for anything not clearly stated on the site.

{{
  "is_iv_clinic": true,        // bool: Is this actually an IV hydration / vitamin drip / infusion wellness clinic? (not a medical infusion for cancer, MS, etc.)
  "service_types": [],         // list of matching values: hydration, vitamin_drips, nad_plus, athletic_recovery, hangover_relief, immune_support, beauty_anti_aging, weight_loss, migraine_relief, b12_shots, glutathione, detox, custom_blends
  "care_setting": null,        // "in_clinic" | "mobile_only" | "both" — does the clinic come to you or only operate in-clinic?
  "mobile_service_available": null,  // bool: do they offer mobile/at-home IV service?
  "supervision_level": null,   // "md_onsite" | "md_oversight" | "np_supervised" | "rn_administered"
  "price_range_min": null,     // integer: lowest IV drip price in dollars (omit cents)
  "price_range_max": null,     // integer: highest IV drip price in dollars
  "membership_available": null, // bool: do they offer membership or subscription plans?
  "walk_ins_accepted": null,   // bool
  "sterile_compounding": null, // bool: USP 797 sterile compounding or sterile pharmacy mentioned?
  "administering_credentials": [] // list of: RN, NP, PA, MD, DO, paramedic
}}

Rules:
- If "is_iv_clinic" is false, set all other fields to null / empty.
- service_types must only contain values from the list above.
- price_range_min/max should be integers in dollars, not cents.
- Respond with ONLY the JSON object. No explanation, no markdown fences."""


def extract_with_claude(content: str, client: anthropic.Anthropic) -> tuple[dict, int, int]:
    """
    Send truncated page content to Claude Haiku for extraction.
    Returns (parsed_dict, input_tokens, output_tokens).
    """
    prompt = EXTRACTION_PROMPT.format(content=content)
    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=512,
        temperature=0,
        messages=[{'role': 'user', 'content': prompt}],
    )
    raw = response.content[0].text.strip()
    input_tokens = response.usage.input_tokens
    output_tokens = response.usage.output_tokens

    # Strip accidental markdown fences
    if raw.startswith('```'):
        raw = re.sub(r'^```[^\n]*\n?', '', raw)
        raw = re.sub(r'\n?```$', '', raw)

    parsed = json.loads(raw)
    return parsed, input_tokens, output_tokens


# ----------------------------------------------------------------------------
# Supabase helpers
# ----------------------------------------------------------------------------

def fetch_pending(supabase, reset_errors: bool, limit: int | None) -> list[dict]:
    q = (
        supabase.table('places_discovery')
        .select('id, name, website, city, state')
        .not_.is_('website', 'null')
        .neq('website', '')
    )
    if reset_errors:
        q = q.eq('crawl_status', 'error')
    else:
        q = q.is_('crawl_status', 'null')

    page_size = 1000
    all_rows = []
    offset = 0
    while True:
        rows = q.range(offset, offset + page_size - 1).execute().data or []
        all_rows.extend(rows)
        if len(rows) < page_size:
            break
        offset += page_size
        if limit and len(all_rows) >= limit:
            break

    return all_rows[:limit] if limit else all_rows


def write_result(supabase, row_id: str, status: str, result: dict | None, dry_run: bool):
    if dry_run:
        return
    payload: dict = {
        'crawl_status': status,
        'crawled_at': datetime.utcnow().isoformat(),
    }
    if result is not None:
        payload['crawl_result'] = result
    supabase.table('places_discovery').update(payload).eq('id', row_id).execute()


def log_error(row: dict, stage: str, err: str):
    with open(ERROR_LOG, 'a') as f:
        f.write(f"{row['id']}\t{row['name']}\t{row.get('website','')}\t{stage}\t{err}\n")


# ----------------------------------------------------------------------------
# Stats
# ----------------------------------------------------------------------------

def show_stats(supabase):
    print('\n========== crawl stats (places_discovery) ==========\n')
    total = supabase.table('places_discovery').select('id', count='exact').execute()
    print(f"Total rows:   {total.count}")

    with_site = (
        supabase.table('places_discovery')
        .select('id', count='exact')
        .not_.is_('website', 'null')
        .neq('website', '')
        .execute()
    )
    print(f"Has website:  {with_site.count}")

    for status in ('done', 'error', 'skipped'):
        r = (
            supabase.table('places_discovery')
            .select('id', count='exact')
            .eq('crawl_status', status)
            .execute()
        )
        print(f"  {status}:       {r.count}")

    pending = (
        supabase.table('places_discovery')
        .select('id', count='exact')
        .not_.is_('website', 'null')
        .neq('website', '')
        .is_('crawl_status', 'null')
        .execute()
    )
    print(f"  pending:     {pending.count}")

    # Extraction quality from done rows
    done_rows = (
        supabase.table('places_discovery')
        .select('crawl_result')
        .eq('crawl_status', 'done')
        .limit(1000)
        .execute()
        .data or []
    )
    if done_rows:
        is_iv = sum(1 for r in done_rows if (r.get('crawl_result') or {}).get('is_iv_clinic'))
        mobile = sum(1 for r in done_rows if (r.get('crawl_result') or {}).get('mobile_service_available'))
        has_services = sum(1 for r in done_rows if (r.get('crawl_result') or {}).get('service_types'))
        has_pricing = sum(1 for r in done_rows if (r.get('crawl_result') or {}).get('price_range_min') or (r.get('crawl_result') or {}).get('price_range_max'))
        n = len(done_rows)
        print(f"\nExtraction quality (last {n} done rows):")
        print(f"  is_iv_clinic confirmed:  {is_iv}/{n} ({100*is_iv//n}%)")
        print(f"  service_types found:     {has_services}/{n} ({100*has_services//n}%)")
        print(f"  pricing found:           {has_pricing}/{n} ({100*has_pricing//n}%)")
        print(f"  mobile confirmed:        {mobile}/{n} ({100*mobile//n}%)")


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, help='Cap number of clinics to process')
    parser.add_argument('--dry-run', action='store_true', help='Crawl + extract but skip DB writes')
    parser.add_argument('--stats', action='store_true', help='Show stats and exit')
    parser.add_argument('--reset-errors', action='store_true', help='Retry rows with crawl_status=error')
    parser.add_argument('--yes', '-y', action='store_true', help='Skip cost confirmation')
    args = parser.parse_args()

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    if args.stats:
        show_stats(supabase)
        return

    if not HAS_CRAWL4AI:
        print("ERROR: crawl4ai is required. Install with:")
        print("  pip install crawl4ai && playwright install chromium")
        sys.exit(1)

    cap = args.limit or HARD_CAP
    rows = fetch_pending(supabase, args.reset_errors, cap)
    n = len(rows)

    if n == 0:
        print("No pending rows found. Run --stats to check progress.")
        return

    est_input_tokens = n * 4_000
    est_output_tokens = n * 250
    est_cost = (
        est_input_tokens / 1_000_000 * COST_PER_1M_INPUT
        + est_output_tokens / 1_000_000 * COST_PER_1M_OUTPUT
    )

    print(f"\nPhase 3.2 — Crawl + Extract")
    print(f"  Clinics to crawl:  {n}")
    print(f"  Est. Claude cost:  ~${est_cost:.2f}")
    print(f"  Model:             {CLAUDE_MODEL}")
    print(f"  Dry run:           {args.dry_run}")
    print(f"  Reset errors:      {args.reset_errors}")

    if n > 50 and not args.yes and not args.dry_run:
        try:
            resp = input(f"\nProceed with {n} clinics (~${est_cost:.2f})? [y/N]: ").strip().lower()
        except EOFError:
            resp = ''
        if resp not in ('y', 'yes'):
            print("Aborted.")
            return

    if ERROR_LOG.exists() and not args.reset_errors:
        ERROR_LOG.unlink()

    claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    stats = {'done': 0, 'error': 0, 'skipped': 0}
    total_input_tokens = 0
    total_output_tokens = 0
    start_time = datetime.now()

    for i, row in enumerate(rows, start=1):
        name = row.get('name', '')
        url = row.get('website', '')
        location = f"{row.get('city','')}, {row.get('state','')}"
        print(f"[{i}/{n}] {name[:45]:<45} {location}", end=' | ', flush=True)

        # --- Crawl ---
        content, crawl_err = asyncio.run(crawl_url(url))

        if crawl_err and not content:
            print(f"crawl_error: {crawl_err[:60]}")
            log_error(row, 'crawl', crawl_err)
            write_result(supabase, row['id'], 'error', None, args.dry_run)
            stats['error'] += 1
            time.sleep(REQUEST_DELAY_SEC)
            continue

        if len(content.split()) < 30:
            print(f"skipped (too little content: {len(content.split())} words)")
            write_result(supabase, row['id'], 'skipped', None, args.dry_run)
            stats['skipped'] += 1
            continue

        truncated = truncate_to_words(content, MAX_WORDS_PER_PAGE)

        # --- Extract ---
        try:
            result, input_tok, output_tok = extract_with_claude(truncated, claude)
            total_input_tokens += input_tok
            total_output_tokens += output_tok
        except json.JSONDecodeError as e:
            print(f"parse_error: {e}")
            log_error(row, 'json_parse', str(e))
            write_result(supabase, row['id'], 'error', None, args.dry_run)
            stats['error'] += 1
            time.sleep(REQUEST_DELAY_SEC)
            continue
        except Exception as e:
            print(f"claude_error: {str(e)[:60]}")
            log_error(row, 'claude', str(e))
            write_result(supabase, row['id'], 'error', None, args.dry_run)
            stats['error'] += 1
            time.sleep(REQUEST_DELAY_SEC)
            continue

        is_iv = result.get('is_iv_clinic')
        services = result.get('service_types') or []
        print(f"ok | iv={is_iv} services={len(services)} tok={input_tok}+{output_tok}")

        write_result(supabase, row['id'], 'done', result, args.dry_run)
        stats['done'] += 1

        if i % CHECKPOINT_EVERY == 0:
            elapsed = datetime.now() - start_time
            rate = elapsed.total_seconds() / i
            remaining = timedelta(seconds=rate * (n - i))
            actual_cost = (
                total_input_tokens / 1_000_000 * COST_PER_1M_INPUT
                + total_output_tokens / 1_000_000 * COST_PER_1M_OUTPUT
            )
            print(
                f"\n  === Progress: {i}/{n} ({100*i/n:.0f}%) | "
                f"{stats} | cost so far ~${actual_cost:.2f} | "
                f"ETA {(datetime.now() + remaining).strftime('%H:%M:%S')} ===\n"
            )

        time.sleep(REQUEST_DELAY_SEC)

    elapsed = datetime.now() - start_time
    actual_cost = (
        total_input_tokens / 1_000_000 * COST_PER_1M_INPUT
        + total_output_tokens / 1_000_000 * COST_PER_1M_OUTPUT
    )

    print('\n========== FINAL ==========')
    print(f"Clinics processed: {n}")
    print(f"Done:              {stats['done']}")
    print(f"Skipped:           {stats['skipped']}")
    print(f"Errors:            {stats['error']}")
    print(f"Runtime:           {str(elapsed).split('.')[0]}")
    print(f"Tokens:            {total_input_tokens:,} in + {total_output_tokens:,} out")
    print(f"Actual cost:       ~${actual_cost:.2f}")
    if args.dry_run:
        print("(dry run — no rows were written)")
    if ERROR_LOG.exists() and ERROR_LOG.stat().st_size > 0:
        print(f"Errors logged:     {ERROR_LOG}")

    show_stats(supabase)


if __name__ == '__main__':
    main()
