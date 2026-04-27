#!/usr/bin/env python3
"""
merge_crawl_to_clinics.py

Phase 3.3 — Merge crawl_result data from places_discovery into the clinics table.

All places_discovery rows are already linked to clinics via merged_into_clinic_id
(Phase 3 merged all 3,888 rows). This script enriches those clinics rows with
the structured data extracted in Phase 3.2.

Two operations:
  ENRICH  — where crawl_result.is_iv_clinic = true:
              fill NULL fields in clinics with crawl-extracted data.

  DEMOTE  — where crawl_result.is_iv_clinic = false (opt-in via --demote-non-iv):
              set clinics.enrichment_status = 'rejected_wrong_business' to hide
              those clinics from the directory. Use with caution — review first.

Field update rules (conservative):
  service_types          → MERGE (array union, never replace)
  care_setting           → fill NULL only
  supervision_level      → fill NULL only
  mobile_service_available → upgrade NULL/false → true only; never set to false
  price_range_min/max    → fill NULL only; crawl dollars × 100 → cents
  membership_available   → upgrade NULL/false → true only
  walk_ins_accepted      → fill NULL only
  sterile_compounding    → fill NULL only
  administering_credentials → MERGE (array union)
  data_sources           → append 'website_crawl' if not already present
  last_crawled_at        → always set

No schema migration required — all target columns already exist.

Usage:
  python scripts/merge_crawl_to_clinics.py --dry-run          # preview: counts + 10 samples
  python scripts/merge_crawl_to_clinics.py --stats            # readiness summary
  python scripts/merge_crawl_to_clinics.py --yes              # execute enrich
  python scripts/merge_crawl_to_clinics.py --demote-non-iv --dry-run  # preview demotions
  python scripts/merge_crawl_to_clinics.py --demote-non-iv --yes      # execute demotions

Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

# ----------------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------------

load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("ERROR: Missing env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
    sys.exit(1)

CHECKPOINT_EVERY = 100

# DB check constraint — only these values are valid
VALID_SUPERVISION_LEVELS = {'md_onsite', 'md_oversight', 'np_supervised', 'rn_administered'}


# ----------------------------------------------------------------------------
# Field merge logic
# ----------------------------------------------------------------------------

def build_enrich_payload(clinic: dict, crawl: dict, crawled_at: str | None) -> dict:
    """
    Build the UPDATE payload for a clinics row based on crawl_result.
    Only includes fields that would actually change.
    """
    updates: dict = {}

    # service_types — MERGE (union), never replace
    crawl_services = [s for s in (crawl.get('service_types') or []) if s]
    if crawl_services:
        existing = clinic.get('service_types') or []
        merged = sorted(set(existing) | set(crawl_services))
        if set(merged) != set(existing):
            updates['service_types'] = merged

    # care_setting — fill NULL only
    if clinic.get('care_setting') is None and crawl.get('care_setting'):
        updates['care_setting'] = crawl['care_setting']

    # supervision_level — fill NULL only; skip values not in DB enum
    crawl_supervision = crawl.get('supervision_level')
    if clinic.get('supervision_level') is None and crawl_supervision in VALID_SUPERVISION_LEVELS:
        updates['supervision_level'] = crawl_supervision

    # mobile_service_available — upgrade to true only, never set false
    if crawl.get('mobile_service_available') is True and not clinic.get('mobile_service_available'):
        updates['mobile_service_available'] = True
    # Infer mobile from care_setting if crawl is explicit
    if crawl.get('care_setting') in ('mobile_only', 'both') and not clinic.get('mobile_service_available'):
        updates['mobile_service_available'] = True

    # price_range_min — fill NULL only, convert dollars → cents
    if clinic.get('price_range_min') is None:
        raw = crawl.get('price_range_min')
        if raw is not None:
            try:
                updates['price_range_min'] = int(float(raw)) * 100
            except (ValueError, TypeError):
                pass

    # price_range_max — fill NULL only, convert dollars → cents
    if clinic.get('price_range_max') is None:
        raw = crawl.get('price_range_max')
        if raw is not None:
            try:
                updates['price_range_max'] = int(float(raw)) * 100
            except (ValueError, TypeError):
                pass

    # membership_available — upgrade to true only
    if crawl.get('membership_available') is True and not clinic.get('membership_available'):
        updates['membership_available'] = True

    # walk_ins_accepted — fill NULL only
    if clinic.get('walk_ins_accepted') is None and crawl.get('walk_ins_accepted') is not None:
        updates['walk_ins_accepted'] = crawl['walk_ins_accepted']

    # sterile_compounding — fill NULL only
    if clinic.get('sterile_compounding') is None and crawl.get('sterile_compounding') is not None:
        updates['sterile_compounding'] = crawl['sterile_compounding']

    # administering_credentials — MERGE (union)
    crawl_creds = [c for c in (crawl.get('administering_credentials') or []) if c]
    if crawl_creds:
        existing_creds = clinic.get('administering_credentials') or []
        merged_creds = sorted(set(existing_creds) | set(crawl_creds))
        if set(merged_creds) != set(existing_creds):
            updates['administering_credentials'] = merged_creds

    # data_sources — append 'website_crawl' if not present
    existing_sources = clinic.get('data_sources') or []
    if 'website_crawl' not in existing_sources:
        updates['data_sources'] = existing_sources + ['website_crawl']

    # last_crawled_at — always set
    updates['last_crawled_at'] = crawled_at or datetime.utcnow().isoformat()

    return updates


# ----------------------------------------------------------------------------
# Supabase helpers
# ----------------------------------------------------------------------------

def fetch_qualifying(supabase, demote_mode: bool) -> list[dict]:
    """
    Fetch places_discovery rows with crawl data, joined to their clinics row.
    Returns rows where:
      - crawl_status = 'done'
      - crawl_result is not null
      - merged_into_clinic_id is not null
      - For enrich mode: crawl_result.is_iv_clinic = true
      - For demote mode: crawl_result.is_iv_clinic = false
    """
    PAGE_SIZE = 1000
    all_rows: list[dict] = []
    offset = 0

    while True:
        q = (
            supabase.table('places_discovery')
            .select('id, merged_into_clinic_id, crawl_result, crawled_at')
            .eq('crawl_status', 'done')
            .not_.is_('crawl_result', 'null')
            .not_.is_('merged_into_clinic_id', 'null')
        )
        if demote_mode:
            # JSONB boolean filter: is_iv_clinic = false
            q = q.eq('crawl_result->>is_iv_clinic', 'false')
        else:
            q = q.eq('crawl_result->>is_iv_clinic', 'true')

        rows = q.range(offset, offset + PAGE_SIZE - 1).execute().data or []
        all_rows.extend(rows)
        if len(rows) < PAGE_SIZE:
            break
        offset += PAGE_SIZE

    return all_rows


def fetch_clinic(supabase, clinic_id: str) -> dict | None:
    rows = (
        supabase.table('clinics')
        .select(
            'id, service_types, care_setting, supervision_level, '
            'mobile_service_available, price_range_min, price_range_max, '
            'membership_available, walk_ins_accepted, sterile_compounding, '
            'administering_credentials, data_sources, last_crawled_at, '
            'enrichment_status, name'
        )
        .eq('id', clinic_id)
        .limit(1)
        .execute()
        .data or []
    )
    return rows[0] if rows else None


def fetch_clinics_batch(supabase, clinic_ids: list[str]) -> dict[str, dict]:
    """Fetch multiple clinics at once. Returns {id: clinic_row}."""
    if not clinic_ids:
        return {}
    rows = (
        supabase.table('clinics')
        .select(
            'id, service_types, care_setting, supervision_level, '
            'mobile_service_available, price_range_min, price_range_max, '
            'membership_available, walk_ins_accepted, sterile_compounding, '
            'administering_credentials, data_sources, last_crawled_at, '
            'enrichment_status, name'
        )
        .in_('id', clinic_ids)
        .execute()
        .data or []
    )
    return {r['id']: r for r in rows}


# ----------------------------------------------------------------------------
# Stats
# ----------------------------------------------------------------------------

def show_stats(supabase):
    print('\n========== Phase 3.3 merge readiness ==========\n')

    total_done = (
        supabase.table('places_discovery')
        .select('id', count='exact')
        .eq('crawl_status', 'done')
        .execute()
        .count
    )
    print(f"places_discovery crawl_status=done:  {total_done}")

    iv_true = (
        supabase.table('places_discovery')
        .select('id', count='exact')
        .eq('crawl_status', 'done')
        .eq('crawl_result->>is_iv_clinic', 'true')
        .execute()
        .count
    )
    iv_false = (
        supabase.table('places_discovery')
        .select('id', count='exact')
        .eq('crawl_status', 'done')
        .eq('crawl_result->>is_iv_clinic', 'false')
        .execute()
        .count
    )
    print(f"  is_iv_clinic = true:   {iv_true}  → will ENRICH clinics")
    print(f"  is_iv_clinic = false:  {iv_false}  → will DEMOTE if --demote-non-iv")

    # Current fill rates on clinics linked to done+true rows
    print('\nField null rates on to-be-enriched clinics (sample 500):')
    sample_pd = (
        supabase.table('places_discovery')
        .select('merged_into_clinic_id')
        .eq('crawl_status', 'done')
        .eq('crawl_result->>is_iv_clinic', 'true')
        .not_.is_('merged_into_clinic_id', 'null')
        .limit(500)
        .execute()
        .data or []
    )
    clinic_ids = [r['merged_into_clinic_id'] for r in sample_pd if r.get('merged_into_clinic_id')]
    if clinic_ids:
        clinics = fetch_clinics_batch(supabase, clinic_ids[:500])
        fields = ['service_types', 'care_setting', 'supervision_level',
                  'mobile_service_available', 'price_range_min', 'data_sources']
        for f in fields:
            null_count = sum(1 for c in clinics.values() if not c.get(f))
            pct = 100 * null_count // len(clinics)
            print(f"  {f:<30} {null_count}/{len(clinics)} NULL ({pct}%)")


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without writing')
    parser.add_argument('--stats', action='store_true', help='Show readiness stats and exit')
    parser.add_argument('--yes', '-y', action='store_true', help='Execute without confirmation')
    parser.add_argument('--demote-non-iv', action='store_true',
                        help='Also mark is_iv_clinic=false clinics as rejected_wrong_business')
    args = parser.parse_args()

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    if args.stats:
        show_stats(supabase)
        return

    demote_mode = args.demote_non_iv
    operation = 'DEMOTE' if demote_mode else 'ENRICH'

    print(f'\nPhase 3.3 — {operation}')
    print(f'  Dry run: {args.dry_run}')

    print('Fetching qualifying places_discovery rows...')
    pd_rows = fetch_qualifying(supabase, demote_mode)
    n = len(pd_rows)
    print(f'Qualifying rows: {n}')

    if n == 0:
        print('Nothing to do.')
        return

    if not args.yes and not args.dry_run:
        try:
            resp = input(f'\nProceed with {operation} on {n} clinics? [y/N]: ').strip().lower()
        except EOFError:
            resp = ''
        if resp not in ('y', 'yes'):
            print('Aborted.')
            return

    # Pre-fetch all clinics in batches of 500
    print('Pre-fetching clinics...')
    clinic_cache: dict[str, dict] = {}
    clinic_ids = [r['merged_into_clinic_id'] for r in pd_rows if r.get('merged_into_clinic_id')]
    for i in range(0, len(clinic_ids), 500):
        batch = fetch_clinics_batch(supabase, clinic_ids[i:i+500])
        clinic_cache.update(batch)
    print(f'Fetched {len(clinic_cache)} clinics from cache.')

    stats = {'enriched': 0, 'skipped_no_change': 0, 'demoted': 0, 'not_found': 0, 'error': 0}
    field_fill_counts: dict[str, int] = {}
    dry_run_samples: list[str] = []
    start_time = datetime.now()

    for i, pd_row in enumerate(pd_rows, start=1):
        clinic_id = pd_row.get('merged_into_clinic_id')
        if not clinic_id:
            stats['not_found'] += 1
            continue

        clinic = clinic_cache.get(clinic_id)
        if not clinic:
            stats['not_found'] += 1
            continue

        crawl = pd_row.get('crawl_result') or {}
        crawled_at = pd_row.get('crawled_at')

        if demote_mode:
            # Only demote if not already demoted
            if clinic.get('enrichment_status') != 'rejected_wrong_business':
                if not args.dry_run:
                    try:
                        supabase.table('clinics').update({
                            'enrichment_status': 'rejected_wrong_business',
                            'last_crawled_at': crawled_at or datetime.utcnow().isoformat(),
                        }).eq('id', clinic_id).execute()
                        stats['demoted'] += 1
                    except Exception as e:
                        print(f'  !! Error demoting {clinic_id}: {e}')
                        stats['error'] += 1
                else:
                    stats['demoted'] += 1
                    if len(dry_run_samples) < 5:
                        dry_run_samples.append(
                            f"  DEMOTE: {clinic.get('name', clinic_id)}"
                        )
            else:
                stats['skipped_no_change'] += 1
        else:
            payload = build_enrich_payload(clinic, crawl, crawled_at)

            # Track which fields are being filled
            for field in ('service_types', 'care_setting', 'supervision_level',
                          'mobile_service_available', 'price_range_min', 'price_range_max',
                          'membership_available', 'walk_ins_accepted', 'sterile_compounding',
                          'administering_credentials'):
                if field in payload and field != 'last_crawled_at' and field != 'data_sources':
                    field_fill_counts[field] = field_fill_counts.get(field, 0) + 1

            # Always writes last_crawled_at; only count as enriched if other fields changed
            meaningful_fields = {k for k in payload if k not in ('last_crawled_at', 'data_sources')}
            if meaningful_fields:
                stats['enriched'] += 1
            else:
                stats['skipped_no_change'] += 1

            if args.dry_run and len(dry_run_samples) < 10:
                changed = [k for k in payload if k not in ('last_crawled_at', 'data_sources')]
                if changed:
                    dry_run_samples.append(
                        f"  ENRICH {clinic.get('name', clinic_id)[:40]:<40} "
                        f"fields: {', '.join(changed)}"
                    )

            if not args.dry_run and meaningful_fields:
                try:
                    supabase.table('clinics').update(payload).eq('id', clinic_id).execute()
                except Exception as e:
                    print(f'  !! Error updating {clinic_id}: {e}')
                    stats['error'] += 1

        if i % CHECKPOINT_EVERY == 0:
            elapsed = (datetime.now() - start_time).total_seconds()
            rate = i / elapsed
            remaining = (n - i) / rate
            print(
                f'  [{i}/{n} {100*i//n}%] '
                f'{stats} | {elapsed:.0f}s elapsed | ~{remaining:.0f}s remaining'
            )

    elapsed = datetime.now() - start_time

    if args.dry_run and dry_run_samples:
        print('\nSample changes (first 10):')
        for s in dry_run_samples:
            print(s)

    print(f'\n========== FINAL ({operation}) ==========')
    if demote_mode:
        print(f"Demoted:          {stats['demoted']}")
    else:
        print(f"Enriched:         {stats['enriched']}")
        print(f"No new data:      {stats['skipped_no_change']}")
        if field_fill_counts:
            print('\nFields filled:')
            for field, count in sorted(field_fill_counts.items(), key=lambda x: -x[1]):
                print(f"  {field:<30} {count}")
    print(f"Not found:        {stats['not_found']}")
    print(f"Errors:           {stats['error']}")
    print(f"Runtime:          {str(elapsed).split('.')[0]}")
    if args.dry_run:
        print('(dry run — no rows were written)')


if __name__ == '__main__':
    main()
