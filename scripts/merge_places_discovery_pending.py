#!/usr/bin/env python3
"""
merge_places_discovery_pending.py

One-time merge for newly discovered Google Places rows.

Processes ONLY places_discovery rows where merge_status = 'pending'. Existing
resolved rows are not selected and are never revisited by this script.

Usage:
  python scripts/merge_places_discovery_pending.py --dry-run
  python scripts/merge_places_discovery_pending.py --yes

Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

import argparse
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("ERROR: Missing env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
    sys.exit(1)

PAGE_SIZE = 1000

NOISE_PATTERNS = [
    r'\bhospital\b',
    r'\burgent\s+care\b',
    r'\bemergency\s+room\b',
    r'\ber\b',
    r'\bveterinary\b',
    r'\bvet\b',
    r'\banimal\s+hospital\b',
    r'\bwhole\s+foods\b',
    r'\bwalgreens\b',
    r'\bcvs\b',
    r'\bwalmart\b',
    r'\bpharmacy\b',
    r'\bfire\s+department\b',
    r'\bpolice\b',
    r'\bdental\b',
    r'\bdentist\b',
    r'\borthodontic\b',
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def fetch_pending_rows(supabase) -> list[dict]:
    """Fetch all currently pending rows up front so writes do not affect pagination."""
    rows: list[dict] = []
    offset = 0
    while True:
        batch = (
            supabase.table('places_discovery')
            .select(
                'id, google_place_id, name, street_address, formatted_address, '
                'city, state, zip, phone, website, rating_value, rating_count, '
                'latitude, longitude, business_status, primary_type, merge_status'
            )
            .eq('merge_status', 'pending')
            .order('discovered_at', desc=False)
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
            .data or []
        )
        rows.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def update_discovery_status(
    supabase,
    row_id: str,
    merge_status: str,
    dry_run: bool,
    merged_into_clinic_id: str | None = None,
):
    if dry_run:
        return

    payload = {
        'merge_status': merge_status,
        'reviewed_at': utc_now(),
    }
    if merged_into_clinic_id:
        payload['merged_into_clinic_id'] = merged_into_clinic_id

    (
        supabase.table('places_discovery')
        .update(payload)
        .eq('id', row_id)
        .eq('merge_status', 'pending')
        .execute()
    )


def is_noise(row: dict) -> bool:
    haystack = ' '.join([
        str(row.get('name') or ''),
        str(row.get('primary_type') or ''),
    ]).lower()
    return any(re.search(pattern, haystack, flags=re.IGNORECASE) for pattern in NOISE_PATTERNS)


def generate_slug(name: str, city: str | None = None, state: str | None = None) -> str:
    """
    Mirrors scripts/import-npi-to-supabase.ts generateSlug():
    lowercase; strip to a-z0-9/space/hyphen; spaces to hyphens; collapse hyphens;
    trim edge hyphens; append city/state if under 4 chars; fallback to clinic.
    """
    slug = (name or '').lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = re.sub(r'^-|-$', '', slug)

    if len(slug) < 4 and city and state:
        city_slug = re.sub(r'\s+', '-', city.lower())
        slug = f"{slug}-{city_slug}-{state.lower()}"

    return slug or 'clinic'


def fetch_existing_slugs(supabase, base_slug: str) -> set[str]:
    rows = (
        supabase.table('clinics')
        .select('slug')
        .or_(f'slug.eq.{base_slug},slug.like.{base_slug}-%')
        .execute()
        .data or []
    )
    return {r['slug'] for r in rows if r.get('slug')}


def first_available_slug(supabase, base_slug: str) -> str:
    taken = fetch_existing_slugs(supabase, base_slug)
    if base_slug not in taken:
        return base_slug

    suffix = 2
    while f'{base_slug}-{suffix}' in taken:
        suffix += 1
    return f'{base_slug}-{suffix}'


def find_duplicate_clinic(supabase, google_place_id: str | None) -> dict | None:
    if not google_place_id:
        return None
    rows = (
        supabase.table('clinics')
        .select('id, slug, name')
        .eq('google_place_id', google_place_id)
        .limit(1)
        .execute()
        .data or []
    )
    return rows[0] if rows else None


def build_clinic_payload(row: dict, slug: str, match_confidence: str) -> dict:
    # places_discovery.street_address maps to clinics.address.
    return {
        'name': row.get('name'),
        'slug': slug,
        'address': row.get('street_address') or row.get('formatted_address'),
        'city': row.get('city'),
        'state': row.get('state'),
        'zip': row.get('zip'),
        'phone': row.get('phone'),
        'website': row.get('website'),
        'rating_value': row.get('rating_value'),
        'rating_count': row.get('rating_count'),
        'latitude': row.get('latitude'),
        'longitude': row.get('longitude'),
        'business_status': row.get('business_status'),
        'google_place_id': row.get('google_place_id'),
        'source': 'google_places',
        'enrichment_status': 'enriched',
        'match_confidence': match_confidence,
        'is_iv_clinic': True,
        'data_sources': ['google_places_gapfill'],
    }


def insert_clinic(supabase, payload: dict, dry_run: bool) -> str | None:
    if dry_run:
        return None
    inserted = (
        supabase.table('clinics')
        .insert(payload)
        .execute()
        .data or []
    )
    if not inserted:
        raise RuntimeError('insert returned no rows')
    return inserted[0]['id']


def row_label(row: dict) -> str:
    return f"{row.get('name') or '(unnamed)'} [{row.get('city') or ''}, {row.get('state') or ''}]"


def process_row(supabase, row: dict, dry_run: bool) -> tuple[str, str | None]:
    rating_count = row.get('rating_count')
    if rating_count is None or int(rating_count) < 5:
        update_discovery_status(supabase, row['id'], 'rejected_quality', dry_run)
        return 'rejected_quality', 'rating_count < 5'

    business_status = row.get('business_status')
    if business_status and business_status != 'OPERATIONAL':
        update_discovery_status(supabase, row['id'], 'rejected_closed', dry_run)
        return 'rejected_closed', f'business_status={business_status}'

    if is_noise(row):
        update_discovery_status(supabase, row['id'], 'rejected_noise', dry_run)
        return 'rejected_noise', 'name/primary_type noise pattern'

    duplicate = find_duplicate_clinic(supabase, row.get('google_place_id'))
    if duplicate:
        update_discovery_status(
            supabase,
            row['id'],
            'skipped_duplicate',
            dry_run,
            merged_into_clinic_id=duplicate['id'],
        )
        return 'skipped_duplicate', f"existing clinic {duplicate['id']}"

    base_slug = generate_slug(row.get('name') or '', row.get('city'), row.get('state'))
    slug = first_available_slug(supabase, base_slug)
    match_confidence = 'high' if int(rating_count) >= 20 else 'medium'
    payload = build_clinic_payload(row, slug, match_confidence)
    clinic_id = insert_clinic(supabase, payload, dry_run)

    if dry_run:
        return 'merged', f"would insert slug={slug} confidence={match_confidence}"

    update_discovery_status(
        supabase,
        row['id'],
        'merged',
        dry_run=False,
        merged_into_clinic_id=clinic_id,
    )
    return 'merged', f"inserted clinic {clinic_id} slug={slug}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true', help='Print decisions without writing')
    parser.add_argument('--yes', '-y', action='store_true', help='Skip confirmation prompt')
    parser.add_argument('--limit', type=int, help='Cap number of pending rows to process')
    args = parser.parse_args()

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    rows = fetch_pending_rows(supabase)
    if args.limit:
        rows = rows[:args.limit]

    print('\nMerge pending places_discovery rows')
    print(f"  Pending rows: {len(rows)}")
    print(f"  Dry run:      {args.dry_run}")

    if not rows:
        print('\nNo pending rows found. Nothing to do.')
        return

    if not args.dry_run and not args.yes:
        try:
            response = input(f"\nProceed with writes for {len(rows)} pending rows? [y/N]: ").strip().lower()
        except EOFError:
            response = ''
        if response not in ('y', 'yes'):
            print('Aborted.')
            return

    stats = {
        'processed': 0,
        'merged': 0,
        'rejected_quality': 0,
        'rejected_closed': 0,
        'rejected_noise': 0,
        'skipped_duplicate': 0,
        'errors': 0,
    }

    for index, row in enumerate(rows, start=1):
        stats['processed'] += 1
        label = row_label(row)
        try:
            decision, reason = process_row(supabase, row, args.dry_run)
            stats[decision] += 1
            print(f"[{index}/{len(rows)}] {decision:<18} {label} - {reason}")
        except Exception as e:
            stats['errors'] += 1
            print(f"[{index}/{len(rows)}] error              {label} - {str(e)[:160]}")

    print('\n========== FINAL ==========')
    print(f"Total processed:     {stats['processed']}")
    print(f"Merged:              {stats['merged']}")
    print(f"Rejected quality:    {stats['rejected_quality']}")
    print(f"Rejected closed:     {stats['rejected_closed']}")
    print(f"Rejected noise:      {stats['rejected_noise']}")
    print(f"Skipped duplicate:   {stats['skipped_duplicate']}")
    print(f"Errors:              {stats['errors']}")
    if args.dry_run:
        print('(dry run - no rows were written)')


if __name__ == '__main__':
    main()
