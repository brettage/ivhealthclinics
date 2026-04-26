#!/usr/bin/env python3
"""
enrich_google_places.py  (v5)

Enriches clinic records with Google Places API data.

v5 improvements over v4:
  - Smarter collision handling: when a Place ID is already owned by another
    clinic and retry doesn't find a different match, compare the failing row's
    name to the owner's name. If similar -> real NPI duplicate. If different,
    it's just an unfindable clinic whose query hits a popular chain -> mark
    as no_google_match instead of falsely flagging as duplicate.
  - Pre-flight cost estimate and ETA tracking for long runs (4,000+ rows).
  - Checkpoint every 50 rows instead of 20 (less noise at scale).

Confidence tiers (unchanged from v4):
  high          -> name >= 0.60 AND zip match
  medium        -> name >= 0.60 AND city match (only, not zip)
  low           -> name 0.40-0.60 AND zip match
  address_only  -> street address matches but name doesn't (hidden until crawl)

Required migrations (run in order, in Supabase Dashboard):
  1. add_google_places_columns.sql
  2. add_duplicate_tracking.sql
  3. add_match_confidence.sql

Usage:
  python scripts/enrich_google_places.py --iv-only         # only is_iv_clinic=true
  python scripts/enrich_google_places.py --all             # all 4,651 clinics
  python scripts/enrich_google_places.py --limit 50        # cap processing
  python scripts/enrich_google_places.py --dry-run         # no Supabase writes
  python scripts/enrich_google_places.py --all --yes       # skip cost confirmation
"""

import argparse
import os
import re
import sys
import time
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from pathlib import Path

import requests
from dotenv import load_dotenv
from supabase import create_client

# ----------------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------------

load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')

if not all([SUPABASE_URL, SUPABASE_KEY, GOOGLE_API_KEY]):
    print("ERROR: Missing env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_PLACES_API_KEY)")
    sys.exit(1)

SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText'
DETAILS_URL = 'https://places.googleapis.com/v1/places/{place_id}'

SEARCH_FIELDS = (
    'places.id,places.displayName,places.formattedAddress,'
    'places.addressComponents,places.nationalPhoneNumber'
)
DETAILS_FIELDS = (
    'id,displayName,formattedAddress,location,'
    'rating,userRatingCount,regularOpeningHours,'
    'photos,businessStatus,nationalPhoneNumber'
)

# Pricing (as of Places API (New), 2024)
COST_PER_SEARCH = 0.032  # Text Search Pro
COST_PER_DETAILS = 0.017  # Place Details Essentials+

NAME_CONFIDENT = 0.60
NAME_WEAK = 0.40
DUP_NAME_THRESHOLD = 0.60  # NEW v5: name similarity cutoff for real-duplicate vs unfindable
STREET_MATCH_THRESHOLD = 0.80
REQUEST_DELAY_SEC = 0.2
CHECKPOINT_EVERY = 50  # CHANGED v5: larger for 4k+ runs
MAX_PHOTO_REFS = 10
MAX_RETRIES = 2

MISS_LOG = Path(__file__).parent / 'google_places_misses.log'
ERROR_LOG = Path(__file__).parent / 'google_places_errors.log'
DUP_LOG = Path(__file__).parent / 'google_places_duplicates.log'
ADDRESS_ONLY_LOG = Path(__file__).parent / 'google_places_address_only.log'

CONFIDENCE_MAP = {
    'confident_name+zip': 'high',
    'confident_name+city': 'medium',
    'weak_name+zip_tiebreaker': 'low',
    'street_address_match': 'address_only',
}

# ----------------------------------------------------------------------------
# Name normalization (unchanged)
# ----------------------------------------------------------------------------

CORP_SUFFIXES = [
    r'\bLLC\b', r'\bL\.L\.C\.?\b', r'\bLLP\b',
    r'\bPLLC\b', r'\bP\.L\.L\.C\.?\b',
    r'\bPC\b', r'\bP\.C\.?\b',
    r'\bINC\b', r'\bINC\.?\b',
    r'\bCORP\b', r'\bCORPORATION\b', r'\bLTD\b',
]
COMPRESSION_FIXES = [
    (r'(\d)', r' \1 '),
    (r'\b4\b', 'for'), (r'\b2\b', 'to'),
    (r'&', ' and '), (r'\+', ' plus '),
]
FILLER_WORDS = {'of', 'the', 'a', 'an', 'in', 'at', 'and', 'for', 'to', 'plus'}


def normalize_name(name: str) -> str:
    if not name:
        return ''
    s = name
    for pat, repl in COMPRESSION_FIXES:
        s = re.sub(pat, repl, s)
    for pat in CORP_SUFFIXES:
        s = re.sub(pat, '', s, flags=re.IGNORECASE)
    s = re.sub(r"[,.|/\\:;'\"()\[\]{}#-]", ' ', s)
    s = re.sub(r'\s+', ' ', s).strip().lower()
    return ' '.join(t for t in s.split() if t not in FILLER_WORDS)


def name_similarity(ours: str, theirs: str) -> float:
    n1 = normalize_name(ours)
    n2 = normalize_name(theirs)
    if not n1 or not n2:
        return 0.0
    base = SequenceMatcher(None, n1, n2).ratio()
    t1 = set(n1.split())
    t2 = set(n2.split())
    if t1 and t2:
        overlap = len(t1 & t2) / min(len(t1), len(t2))
        return 0.6 * base + 0.4 * overlap
    return base


# ----------------------------------------------------------------------------
# Street address normalization (unchanged)
# ----------------------------------------------------------------------------

ADDRESS_ABBREVIATIONS = {
    r'\bst\b': 'street', r'\bstr\b': 'street', r'\brd\b': 'road',
    r'\bave\b': 'avenue', r'\bav\b': 'avenue', r'\bblvd\b': 'boulevard',
    r'\bdr\b': 'drive', r'\bln\b': 'lane', r'\bpkwy\b': 'parkway',
    r'\bhwy\b': 'highway', r'\bct\b': 'court', r'\bpl\b': 'place',
    r'\btrl\b': 'trail', r'\bcir\b': 'circle', r'\bsq\b': 'square',
    r'\bn\b': 'north', r'\bs\b': 'south', r'\be\b': 'east', r'\bw\b': 'west',
    r'\bne\b': 'northeast', r'\bnw\b': 'northwest',
    r'\bse\b': 'southeast', r'\bsw\b': 'southwest',
    r'\bsuite\s+\w+': '', r'\bste\.?\s+\w+': '', r'\bsuite\s+#?\w+': '',
    r'\bunit\s+\w+': '', r'\bapt\.?\s+\w+': '',
    r'\bbldg\.?\s+\w+': '', r'\bfloor\s+\w+': '',
    r'\bfl\.?\s+\d+': '', r'\b#\s*\w+': '',
}


def normalize_address(addr: str) -> str:
    if not addr:
        return ''
    s = addr.lower()
    s = re.sub(r"[,.|/\\:;'\"()\[\]{}]", ' ', s)
    for pat, repl in ADDRESS_ABBREVIATIONS.items():
        s = re.sub(pat, repl, s, flags=re.IGNORECASE)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def extract_street_from_google_address(formatted: str) -> str:
    if not formatted:
        return ''
    return formatted.split(',')[0].strip()


def street_similarity(our_addr: str, google_formatted: str) -> float:
    our_normalized = normalize_address(our_addr)
    google_street = extract_street_from_google_address(google_formatted)
    google_normalized = normalize_address(google_street)
    if not our_normalized or not google_normalized:
        return 0.0
    base = SequenceMatcher(None, our_normalized, google_normalized).ratio()
    our_num = re.match(r'^(\d+)', our_normalized)
    google_num = re.match(r'^(\d+)', google_normalized)
    if our_num and google_num:
        if our_num.group(1) == google_num.group(1):
            base = max(base, 0.7)
        else:
            return min(base, 0.4)
    return base


# ----------------------------------------------------------------------------
# Address verification
# ----------------------------------------------------------------------------

def extract_zip_from_google(place: dict):
    for comp in place.get('addressComponents', []) or []:
        if 'postal_code' in (comp.get('types') or []):
            code = (comp.get('longText') or '').strip()
            if code:
                return code[:5]
    return None


def extract_city_from_google(place: dict):
    for comp in place.get('addressComponents', []) or []:
        if 'locality' in (comp.get('types') or []):
            return (comp.get('longText') or '').strip().lower()
    return None


def address_match_strength(clinic: dict, place: dict) -> str:
    our_zip = (clinic.get('zip') or '').strip()[:5]
    our_city = (clinic.get('city') or '').strip().lower()
    g_zip = extract_zip_from_google(place)
    g_city = extract_city_from_google(place)
    if our_zip and g_zip and our_zip == g_zip:
        return 'zip'
    if our_city and g_city and our_city == g_city:
        return 'city'
    return 'none'


# ----------------------------------------------------------------------------
# Query construction
# ----------------------------------------------------------------------------

def build_search_query(clinic: dict, specific: bool = True) -> str:
    parts = [clinic['name']]
    if specific:
        if clinic.get('address'):
            parts.append(clinic['address'])
        if clinic.get('city'):
            parts.append(clinic['city'])
        if clinic.get('state'):
            parts.append(clinic['state'])
        if clinic.get('zip'):
            parts.append(clinic['zip'])
    else:
        if clinic.get('city'):
            parts.append(clinic['city'])
        if clinic.get('state'):
            parts.append(clinic['state'])
    return ' '.join(p for p in parts if p).strip()


# ----------------------------------------------------------------------------
# Decision logic
# ----------------------------------------------------------------------------

def decide(clinic: dict, place: dict, name_score: float, addr_match: str):
    if name_score >= NAME_CONFIDENT:
        if addr_match == 'zip':
            return 'accept', 'confident_name+zip'
        if addr_match == 'city':
            return 'accept', 'confident_name+city'
        return 'reject', 'confident_name_but_wrong_address'
    if name_score >= NAME_WEAK and addr_match == 'zip':
        return 'accept', 'weak_name+zip_tiebreaker'
    google_formatted = place.get('formattedAddress', '')
    our_addr = clinic.get('address', '')
    if our_addr and google_formatted and addr_match in ('zip', 'city'):
        street_score = street_similarity(our_addr, google_formatted)
        if street_score >= STREET_MATCH_THRESHOLD:
            return 'accept', 'street_address_match'
    if name_score >= NAME_WEAK:
        return 'reject', f'weak_name_no_zip_match(addr={addr_match})'
    return 'reject', 'name_too_different'


# ----------------------------------------------------------------------------
# Google API calls with retry
# ----------------------------------------------------------------------------

def _with_retry(fn, *args, **kwargs):
    last_err = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            return fn(*args, **kwargs), None
        except requests.RequestException as e:
            last_err = e
            if attempt < MAX_RETRIES:
                time.sleep(0.5 * (2 ** attempt))
    return None, str(last_err)


def _do_search(query: str):
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': SEARCH_FIELDS,
    }
    body = {'textQuery': query, 'maxResultCount': 1}
    r = requests.post(SEARCH_URL, headers=headers, json=body, timeout=15)
    r.raise_for_status()
    data = r.json()
    places = data.get('places', [])
    return places[0] if places else None


def _do_details(place_id: str):
    headers = {
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': DETAILS_FIELDS,
    }
    r = requests.get(DETAILS_URL.format(place_id=place_id), headers=headers, timeout=15)
    r.raise_for_status()
    return r.json()


# ----------------------------------------------------------------------------
# Logging
# ----------------------------------------------------------------------------

def log_miss(clinic: dict, reason: str, details: str = ''):
    with open(MISS_LOG, 'a') as f:
        f.write(f"{clinic['id']}\t{clinic['name']}\t{clinic.get('city','')}, {clinic.get('state','')}\t{reason}\t{details}\n")


def log_error(clinic: dict, stage: str, err: str):
    with open(ERROR_LOG, 'a') as f:
        f.write(f"{clinic['id']}\t{clinic['name']}\t{stage}\t{err}\n")


def log_duplicate(clinic: dict, owner_id: str, owner_name: str, place_id: str, name_sim: float):
    with open(DUP_LOG, 'a') as f:
        f.write(
            f"{clinic['id']}\t{clinic['name']}\t{clinic.get('city','')}, {clinic.get('state','')}\t"
            f"{owner_id}\t{owner_name}\t{place_id}\tname_sim={name_sim:.2f}\n"
        )


def log_address_only(clinic: dict, google_name: str, google_addr: str, street_score: float):
    with open(ADDRESS_ONLY_LOG, 'a') as f:
        f.write(
            f"{clinic['id']}\t{clinic['name']}\t{clinic.get('address','')} {clinic.get('city','')}, {clinic.get('state','')}\t"
            f"google='{google_name}'\t{google_addr}\tstreet_score={street_score:.2f}\n"
        )


# ----------------------------------------------------------------------------
# Supabase helpers
# ----------------------------------------------------------------------------

def find_place_id_owner(supabase, place_id: str):
    r = supabase.table('clinics').select('id, name, city, state').eq('google_place_id', place_id).limit(1).execute()
    rows = r.data or []
    return rows[0] if rows else None


def build_update_payload(place: dict, confidence: str) -> dict:
    payload = {
        'google_place_id': place['id'],
        'enrichment_status': 'enriched',
        'match_confidence': confidence,
    }
    loc = place.get('location') or {}
    if 'latitude' in loc and 'longitude' in loc:
        payload['latitude'] = loc['latitude']
        payload['longitude'] = loc['longitude']
    if 'rating' in place:
        payload['rating_value'] = place['rating']
    if 'userRatingCount' in place:
        payload['rating_count'] = place['userRatingCount']
    if 'regularOpeningHours' in place:
        payload['hours_of_operation'] = place['regularOpeningHours']
    photos = place.get('photos') or []
    if photos:
        refs = [p.get('name') for p in photos[:MAX_PHOTO_REFS] if p.get('name')]
        if refs:
            payload['google_photo_refs'] = refs
    if 'businessStatus' in place:
        payload['business_status'] = place['businessStatus']
    return payload


def mark_duplicate(supabase, clinic_id: str, owner_id: str, dry_run: bool):
    if dry_run:
        return
    supabase.table('clinics').update({
        'duplicate_of': owner_id,
        'enrichment_status': 'duplicate_of_canonical',
    }).eq('id', clinic_id).execute()


def mark_status(supabase, clinic_id: str, status: str, dry_run: bool):
    if dry_run:
        return
    supabase.table('clinics').update({'enrichment_status': status}).eq('id', clinic_id).execute()


# ----------------------------------------------------------------------------
# Main pipeline
# ----------------------------------------------------------------------------

def fetch_clinics(supabase, iv_only: bool, limit):
    q = (
        supabase.table('clinics')
        .select('id, name, address, city, state, zip')
        .is_('google_place_id', 'null')
        .is_('enrichment_status', 'null')
    )
    if iv_only:
        q = q.eq('is_iv_clinic', True)
    all_rows = []
    page_size = 1000
    offset = 0
    while True:
        page = q.range(offset, offset + page_size - 1).execute()
        rows = page.data or []
        all_rows.extend(rows)
        if len(rows) < page_size:
            break
        offset += page_size
        if limit and len(all_rows) >= limit:
            break
    return all_rows[:limit] if limit else all_rows


def try_search_and_score(clinic: dict, specific: bool):
    query = build_search_query(clinic, specific=specific)
    search_result, err = _with_retry(_do_search, query)
    if err:
        return None, 0, 'none', 'reject', 'search_error', err
    if not search_result:
        return None, 0, 'none', 'reject', 'no_search_result', None
    google_name = (search_result.get('displayName') or {}).get('text', '')
    score = name_similarity(clinic['name'], google_name)
    addr_match = address_match_strength(clinic, search_result)
    decision, reason = decide(clinic, search_result, score, addr_match)
    return search_result, score, addr_match, decision, reason, None


def enrich_one(clinic: dict, supabase, dry_run: bool):
    """Returns (status, reason). Status: ok | miss | reject | duplicate | error."""

    result, score, addr_match, decision, reason, err = try_search_and_score(clinic, specific=True)

    if err:
        log_error(clinic, 'search_specific', err)
        return 'error', err

    if decision == 'reject' and reason == 'no_search_result':
        time.sleep(REQUEST_DELAY_SEC)
        result, score, addr_match, decision, reason, err = try_search_and_score(clinic, specific=False)
        if err:
            log_error(clinic, 'search_fallback', err)
            return 'error', err
        if not result:
            log_miss(clinic, 'no_search_result', build_search_query(clinic, specific=False))
            mark_status(supabase, clinic['id'], 'no_google_match', dry_run)
            return 'miss', 'no_search_result'

    if decision == 'reject':
        google_name = (result.get('displayName') or {}).get('text', '') if result else ''
        google_addr = result.get('formattedAddress', '') if result else ''
        detail = (
            f"score={score:.2f} addr_match={addr_match} reason={reason} "
            f"google='{google_name}' ({google_addr}) "
            f"ours='{clinic['name']}' ({clinic.get('address','')})"
        )
        log_miss(clinic, 'rejected', detail)
        mark_status(supabase, clinic['id'], 'rejected_wrong_business', dry_run)
        return 'reject', reason

    # decision == 'accept'
    place_id = result['id']
    confidence = CONFIDENCE_MAP.get(reason, 'medium')

    if reason == 'street_address_match':
        google_name = (result.get('displayName') or {}).get('text', '')
        google_addr = result.get('formattedAddress', '')
        street_score = street_similarity(clinic.get('address', ''), google_addr)
        log_address_only(clinic, google_name, google_addr, street_score)

    # Collision check
    owner = find_place_id_owner(supabase, place_id)
    if owner and owner['id'] != clinic['id']:
        # Retry with alternate query
        retry_query = f"{clinic['name']} {clinic.get('address','')} {clinic.get('zip','')}".strip()
        time.sleep(REQUEST_DELAY_SEC)
        retry_result, retry_err = _with_retry(_do_search, retry_query)
        if not retry_err and retry_result and retry_result['id'] != place_id:
            google_name = (retry_result.get('displayName') or {}).get('text', '')
            new_score = name_similarity(clinic['name'], google_name)
            new_addr = address_match_strength(clinic, retry_result)
            new_decision, new_reason = decide(clinic, retry_result, new_score, new_addr)
            if new_decision == 'accept':
                new_owner = find_place_id_owner(supabase, retry_result['id'])
                if not new_owner or new_owner['id'] == clinic['id']:
                    result = retry_result
                    place_id = retry_result['id']
                    score, addr_match, reason = new_score, new_addr, new_reason
                    confidence = CONFIDENCE_MAP.get(reason, 'medium')
                    owner = None

        # Still colliding — disambiguate real duplicate vs unfindable clinic
        if owner and owner['id'] != clinic['id']:
            # v5 NEW: compare failing name to owner name
            dup_name_score = name_similarity(clinic['name'], owner['name'])
            if dup_name_score >= DUP_NAME_THRESHOLD:
                # Real NPI duplicate
                log_duplicate(clinic, owner['id'], owner['name'], place_id, dup_name_score)
                mark_duplicate(supabase, clinic['id'], owner['id'], dry_run)
                return 'duplicate', f"dup_of={owner['name']} (name_sim={dup_name_score:.2f})"
            else:
                # Different clinic, Google just kept returning owner's Place ID
                log_miss(
                    clinic,
                    'collision_unfindable',
                    f"google returned place owned by '{owner['name']}' "
                    f"(name_sim={dup_name_score:.2f} — too low for real duplicate)"
                )
                mark_status(supabase, clinic['id'], 'no_google_match', dry_run)
                return 'miss', f'collision_unfindable (owner={owner["name"]})'

    # Clear to write
    time.sleep(REQUEST_DELAY_SEC)
    place, err = _with_retry(_do_details, place_id)
    if err:
        log_error(clinic, 'details', err)
        return 'error', err
    if not place:
        log_error(clinic, 'details', 'empty_response')
        return 'error', 'empty_details'

    payload = build_update_payload(place, confidence)

    if dry_run:
        return 'ok', f'dry_run accept={reason} conf={confidence}'

    try:
        supabase.table('clinics').update(payload).eq('id', clinic['id']).execute()
        return 'ok', f'{reason} (conf={confidence})'
    except Exception as e:
        err_str = str(e)
        if 'duplicate key' in err_str or '23505' in err_str:
            owner = find_place_id_owner(supabase, place_id)
            if owner and owner['id'] != clinic['id']:
                dup_name_score = name_similarity(clinic['name'], owner['name'])
                if dup_name_score >= DUP_NAME_THRESHOLD:
                    log_duplicate(clinic, owner['id'], owner['name'], place_id, dup_name_score)
                    mark_duplicate(supabase, clinic['id'], owner['id'], dry_run)
                    return 'duplicate', f"dup_of={owner['name']}"
                else:
                    log_miss(clinic, 'collision_unfindable',
                             f"race-condition collision with '{owner['name']}' (name_sim={dup_name_score:.2f})")
                    mark_status(supabase, clinic['id'], 'no_google_match', dry_run)
                    return 'miss', 'collision_unfindable'
        log_error(clinic, 'supabase_update', err_str)
        return 'error', 'supabase_update_failed'


def print_cost_estimate(n: int):
    """Rough estimate of API cost based on empirical v4 ratios."""
    # From 216-clinic run: ~70% accept (search + details), ~30% reject/miss (search only)
    est_search_calls = int(n * 1.15)  # includes retries
    est_details_calls = int(n * 0.65)
    est_cost = est_search_calls * COST_PER_SEARCH + est_details_calls * COST_PER_DETAILS
    est_minutes = (n * (REQUEST_DELAY_SEC * 2 + 0.5)) / 60
    print(f"\n  Estimated API cost: ~${est_cost:.2f}")
    print(f"  Estimated runtime:  ~{est_minutes:.0f} minutes ({est_minutes/60:.1f} hours)")
    print(f"  Estimated calls:    ~{est_search_calls} searches, ~{est_details_calls} details\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--iv-only', action='store_true', default=True)
    parser.add_argument('--all', action='store_true')
    parser.add_argument('--limit', type=int)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--yes', '-y', action='store_true', help='skip cost confirmation')
    args = parser.parse_args()

    iv_only = not args.all
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print(f"Fetching clinics (iv_only={iv_only}, limit={args.limit})...")
    clinics = fetch_clinics(supabase, iv_only, args.limit)
    n = len(clinics)
    print(f"Found {n} clinics needing enrichment.")
    if not clinics:
        print("Nothing to do.")
        return

    # Cost confirmation for large runs
    if n >= 500 and not args.yes and not args.dry_run:
        print_cost_estimate(n)
        try:
            resp = input("Proceed? [y/N]: ").strip().lower()
        except EOFError:
            resp = ''
        if resp not in ('y', 'yes'):
            print("Aborted.")
            return
    else:
        print_cost_estimate(n)

    for p in (MISS_LOG, ERROR_LOG, DUP_LOG, ADDRESS_ONLY_LOG):
        if p.exists():
            p.unlink()

    stats = {'ok': 0, 'miss': 0, 'reject': 0, 'duplicate': 0, 'error': 0}
    accept_reasons = {}
    confidence_counts = {}
    start_time = datetime.now()

    for i, clinic in enumerate(clinics, start=1):
        print(f"[{i}/{n}] {clinic['name']} ({clinic.get('city','')}, {clinic.get('state','')})")
        status, reason = enrich_one(clinic, supabase, args.dry_run)
        stats[status] += 1
        if status == 'ok':
            base_reason = reason.split(' (conf=')[0] if ' (conf=' in reason else reason
            accept_reasons[base_reason] = accept_reasons.get(base_reason, 0) + 1
            conf = CONFIDENCE_MAP.get(base_reason, 'medium')
            confidence_counts[conf] = confidence_counts.get(conf, 0) + 1
        print(f"  -> {status} ({reason})")

        if i % CHECKPOINT_EVERY == 0:
            elapsed = datetime.now() - start_time
            avg_per_row = elapsed.total_seconds() / i
            remaining = timedelta(seconds=avg_per_row * (n - i))
            eta = (datetime.now() + remaining).strftime('%H:%M:%S')
            print(
                f"\n  === Progress: {i}/{n} ({100*i/n:.0f}%) | "
                f"{stats} | ETA {eta} (~{str(remaining).split('.')[0]} remaining) ===\n"
            )

        time.sleep(REQUEST_DELAY_SEC)

    elapsed = datetime.now() - start_time
    print("\n========== FINAL ==========")
    print(f"Total:      {n}")
    print(f"Enriched:   {stats['ok']}")
    print(f"Duplicates: {stats['duplicate']}")
    print(f"No match:   {stats['miss']}")
    print(f"Rejected:   {stats['reject']}")
    print(f"Errors:     {stats['error']}")
    print(f"Runtime:    {str(elapsed).split('.')[0]}")
    if accept_reasons:
        print("\nAccept breakdown:")
        for r, c in sorted(accept_reasons.items(), key=lambda x: -x[1]):
            print(f"  {r}: {c}")
    if confidence_counts:
        print("\nConfidence distribution:")
        for c, n_c in sorted(confidence_counts.items(), key=lambda x: -x[1]):
            print(f"  {c}: {n_c}")
    if MISS_LOG.exists() and MISS_LOG.stat().st_size > 0:
        print(f"\nMisses:       {MISS_LOG}")
    if DUP_LOG.exists() and DUP_LOG.stat().st_size > 0:
        print(f"Duplicates:   {DUP_LOG}")
    if ADDRESS_ONLY_LOG.exists() and ADDRESS_ONLY_LOG.stat().st_size > 0:
        print(f"Address-only: {ADDRESS_ONLY_LOG}")
    if ERROR_LOG.exists() and ERROR_LOG.stat().st_size > 0:
        print(f"Errors:       {ERROR_LOG}")


if __name__ == '__main__':
    main()
