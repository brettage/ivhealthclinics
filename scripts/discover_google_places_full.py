#!/usr/bin/env python3
"""
discover_google_places_full.py

Full-scale Google Places API discovery across top 100 US metros and 5 IV-related
keywords. Resumable via discovery_runs audit table.

Strategy:
  - 100 US metropolitan statistical areas, principal city as search anchor
  - 25km radius location bias per metro (compromise: dense enough not to overlap
    too heavily, wide enough to catch suburban clinics)
  - 5 keywords spanning core IV terminology:
      'IV therapy'   — generic, highest-volume term
      'IV hydration' — alternative phrasing, partial overlap with above
      'mobile IV'    — mobile/concierge IV services specifically
      'NAD infusion' — premium NAD+ clinics, distinct sub-category
      'vitamin drip' — drip-bar branding, catches "Drip Bar" / "Vitamin Bar" naming

Cost estimate: 500 searches x $0.032 = ~$16.00
Hard cap: 600 searches (~$19.20). Run aborts if exceeded — prevents runaway costs.

Resumability:
  - Each (keyword, city) pair logged to discovery_runs after completion
  - On startup, skip pairs already in discovery_runs
  - Use --new-run to ignore prior runs and re-fetch everything

Usage:
  python scripts/discover_google_places_full.py             # standard run, resumes if prior run incomplete
  python scripts/discover_google_places_full.py --dry-run   # estimate cost, fetch nothing
  python scripts/discover_google_places_full.py --new-run   # ignore prior runs, re-fetch everything
  python scripts/discover_google_places_full.py --limit 50  # cap at first N pairs (testing)
  python scripts/discover_google_places_full.py --stats     # show current discovery counts only

Requires migrations:
  - create_places_discovery_table.sql
  - create_discovery_runs_table.sql

Env vars:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_PLACES_API_KEY
"""

import argparse
import os
import sys
import time
import uuid
from datetime import datetime, timedelta
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

SEARCH_FIELDS = (
    'places.id,places.displayName,places.formattedAddress,'
    'places.addressComponents,places.location,'
    'places.nationalPhoneNumber,places.websiteUri,'
    'places.rating,places.userRatingCount,'
    'places.businessStatus,places.primaryType,places.types'
)

REQUEST_DELAY_SEC = 0.3
MAX_RESULTS_PER_SEARCH = 20
LOCATION_BIAS_RADIUS_M = 25_000
MAX_RETRIES = 2

# Hard cost ceiling — abort run if total searches exceeds this
SEARCH_HARD_CAP = 600
COST_PER_SEARCH = 0.032

# ----------------------------------------------------------------------------
# 100 US Metropolitan Statistical Areas by population (2023 estimates)
# Lat/lng = principal city centroid
# ----------------------------------------------------------------------------

METROS = [
    # Top 25
    {'name': 'New York, NY',         'lat': 40.7128, 'lng': -74.0060},
    {'name': 'Los Angeles, CA',      'lat': 34.0522, 'lng': -118.2437},
    {'name': 'Chicago, IL',          'lat': 41.8781, 'lng': -87.6298},
    {'name': 'Dallas, TX',           'lat': 32.7767, 'lng': -96.7970},
    {'name': 'Houston, TX',          'lat': 29.7604, 'lng': -95.3698},
    {'name': 'Atlanta, GA',          'lat': 33.7490, 'lng': -84.3880},
    {'name': 'Washington, DC',       'lat': 38.9072, 'lng': -77.0369},
    {'name': 'Philadelphia, PA',     'lat': 39.9526, 'lng': -75.1652},
    {'name': 'Miami, FL',            'lat': 25.7617, 'lng': -80.1918},
    {'name': 'Phoenix, AZ',          'lat': 33.4484, 'lng': -112.0740},
    {'name': 'Boston, MA',           'lat': 42.3601, 'lng': -71.0589},
    {'name': 'Riverside, CA',        'lat': 33.9533, 'lng': -117.3961},
    {'name': 'San Francisco, CA',    'lat': 37.7749, 'lng': -122.4194},
    {'name': 'Detroit, MI',          'lat': 42.3314, 'lng': -83.0458},
    {'name': 'Seattle, WA',          'lat': 47.6062, 'lng': -122.3321},
    {'name': 'Minneapolis, MN',      'lat': 44.9778, 'lng': -93.2650},
    {'name': 'Tampa, FL',            'lat': 27.9506, 'lng': -82.4572},
    {'name': 'San Diego, CA',        'lat': 32.7157, 'lng': -117.1611},
    {'name': 'Denver, CO',           'lat': 39.7392, 'lng': -104.9903},
    {'name': 'Baltimore, MD',        'lat': 39.2904, 'lng': -76.6122},
    {'name': 'St. Louis, MO',        'lat': 38.6270, 'lng': -90.1994},
    {'name': 'Orlando, FL',          'lat': 28.5383, 'lng': -81.3792},
    {'name': 'Charlotte, NC',        'lat': 35.2271, 'lng': -80.8431},
    {'name': 'San Antonio, TX',      'lat': 29.4241, 'lng': -98.4936},
    {'name': 'Portland, OR',         'lat': 45.5152, 'lng': -122.6784},
    # 26-50
    {'name': 'Sacramento, CA',       'lat': 38.5816, 'lng': -121.4944},
    {'name': 'Pittsburgh, PA',       'lat': 40.4406, 'lng': -79.9959},
    {'name': 'Las Vegas, NV',        'lat': 36.1699, 'lng': -115.1398},
    {'name': 'Austin, TX',           'lat': 30.2672, 'lng': -97.7431},
    {'name': 'Cincinnati, OH',       'lat': 39.1031, 'lng': -84.5120},
    {'name': 'Kansas City, MO',      'lat': 39.0997, 'lng': -94.5786},
    {'name': 'Columbus, OH',         'lat': 39.9612, 'lng': -82.9988},
    {'name': 'Cleveland, OH',        'lat': 41.4993, 'lng': -81.6944},
    {'name': 'Indianapolis, IN',     'lat': 39.7684, 'lng': -86.1581},
    {'name': 'San Jose, CA',         'lat': 37.3382, 'lng': -121.8863},
    {'name': 'Nashville, TN',        'lat': 36.1627, 'lng': -86.7816},
    {'name': 'Virginia Beach, VA',   'lat': 36.8529, 'lng': -75.9780},
    {'name': 'Providence, RI',       'lat': 41.8240, 'lng': -71.4128},
    {'name': 'Milwaukee, WI',        'lat': 43.0389, 'lng': -87.9065},
    {'name': 'Jacksonville, FL',     'lat': 30.3322, 'lng': -81.6557},
    {'name': 'Oklahoma City, OK',    'lat': 35.4676, 'lng': -97.5164},
    {'name': 'Raleigh, NC',          'lat': 35.7796, 'lng': -78.6382},
    {'name': 'Memphis, TN',          'lat': 35.1495, 'lng': -90.0490},
    {'name': 'Richmond, VA',         'lat': 37.5407, 'lng': -77.4360},
    {'name': 'Louisville, KY',       'lat': 38.2527, 'lng': -85.7585},
    {'name': 'New Orleans, LA',      'lat': 29.9511, 'lng': -90.0715},
    {'name': 'Salt Lake City, UT',   'lat': 40.7608, 'lng': -111.8910},
    {'name': 'Hartford, CT',         'lat': 41.7658, 'lng': -72.6734},
    {'name': 'Buffalo, NY',          'lat': 42.8864, 'lng': -78.8784},
    {'name': 'Birmingham, AL',       'lat': 33.5186, 'lng': -86.8104},
    # 51-75
    {'name': 'Rochester, NY',        'lat': 43.1566, 'lng': -77.6088},
    {'name': 'Grand Rapids, MI',     'lat': 42.9634, 'lng': -85.6681},
    {'name': 'Tucson, AZ',           'lat': 32.2226, 'lng': -110.9747},
    {'name': 'Honolulu, HI',         'lat': 21.3099, 'lng': -157.8581},
    {'name': 'Tulsa, OK',            'lat': 36.1540, 'lng': -95.9928},
    {'name': 'Fresno, CA',           'lat': 36.7378, 'lng': -119.7871},
    {'name': 'Worcester, MA',        'lat': 42.2626, 'lng': -71.8023},
    {'name': 'Omaha, NE',            'lat': 41.2565, 'lng': -95.9345},
    {'name': 'Bridgeport, CT',       'lat': 41.1865, 'lng': -73.1952},
    {'name': 'Greenville, SC',       'lat': 34.8526, 'lng': -82.3940},
    {'name': 'Albuquerque, NM',      'lat': 35.0844, 'lng': -106.6504},
    {'name': 'Bakersfield, CA',      'lat': 35.3733, 'lng': -119.0187},
    {'name': 'Albany, NY',           'lat': 42.6526, 'lng': -73.7562},
    {'name': 'Knoxville, TN',        'lat': 35.9606, 'lng': -83.9207},
    {'name': 'McAllen, TX',          'lat': 26.2034, 'lng': -98.2300},
    {'name': 'Baton Rouge, LA',      'lat': 30.4515, 'lng': -91.1871},
    {'name': 'El Paso, TX',          'lat': 31.7619, 'lng': -106.4850},
    {'name': 'New Haven, CT',        'lat': 41.3083, 'lng': -72.9279},
    {'name': 'Allentown, PA',        'lat': 40.6084, 'lng': -75.4902},
    {'name': 'Oxnard, CA',           'lat': 34.1975, 'lng': -119.1771},
    {'name': 'Columbia, SC',         'lat': 34.0007, 'lng': -81.0348},
    {'name': 'North Port, FL',       'lat': 27.0442, 'lng': -82.2359},
    {'name': 'Cape Coral, FL',       'lat': 26.5629, 'lng': -81.9495},
    {'name': 'Dayton, OH',           'lat': 39.7589, 'lng': -84.1916},
    {'name': 'Charleston, SC',       'lat': 32.7765, 'lng': -79.9311},
    # 76-100
    {'name': 'Greensboro, NC',       'lat': 36.0726, 'lng': -79.7920},
    {'name': 'Stockton, CA',         'lat': 37.9577, 'lng': -121.2908},
    {'name': 'Colorado Springs, CO', 'lat': 38.8339, 'lng': -104.8214},
    {'name': 'Boise, ID',            'lat': 43.6150, 'lng': -116.2023},
    {'name': 'Lakeland, FL',         'lat': 28.0395, 'lng': -81.9498},
    {'name': 'Little Rock, AR',      'lat': 34.7465, 'lng': -92.2896},
    {'name': 'Akron, OH',            'lat': 41.0814, 'lng': -81.5190},
    {'name': 'Des Moines, IA',       'lat': 41.5868, 'lng': -93.6250},
    {'name': 'Ogden, UT',            'lat': 41.2230, 'lng': -111.9738},
    {'name': 'Winston-Salem, NC',    'lat': 36.0999, 'lng': -80.2442},
    {'name': 'Madison, WI',          'lat': 43.0731, 'lng': -89.4012},
    {'name': 'Syracuse, NY',         'lat': 43.0481, 'lng': -76.1474},
    {'name': 'Provo, UT',            'lat': 40.2338, 'lng': -111.6585},
    {'name': 'Wichita, KS',          'lat': 37.6872, 'lng': -97.3301},
    {'name': 'Toledo, OH',           'lat': 41.6528, 'lng': -83.5379},
    {'name': 'Augusta, GA',          'lat': 33.4735, 'lng': -82.0105},
    {'name': 'Palm Bay, FL',         'lat': 28.0345, 'lng': -80.5887},
    {'name': 'Jackson, MS',          'lat': 32.2988, 'lng': -90.1848},
    {'name': 'Harrisburg, PA',       'lat': 40.2732, 'lng': -76.8867},
    {'name': 'Spokane, WA',          'lat': 47.6588, 'lng': -117.4260},
    {'name': 'Chattanooga, TN',      'lat': 35.0456, 'lng': -85.3097},
    {'name': 'Scranton, PA',         'lat': 41.4090, 'lng': -75.6624},
    {'name': 'Fayetteville, AR',     'lat': 36.0822, 'lng': -94.1719},
    {'name': 'Modesto, CA',          'lat': 37.6391, 'lng': -120.9969},
    {'name': 'Lancaster, PA',        'lat': 40.0379, 'lng': -76.3055},
]

KEYWORDS = [
    'IV therapy',
    'IV hydration',
    'mobile IV',
    'NAD infusion',
    'vitamin drip',
]


# ----------------------------------------------------------------------------
# Google Places API
# ----------------------------------------------------------------------------

def places_text_search(query: str, lat: float, lng: float):
    """Run Places API (New) Text Search with location bias and retry."""
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': SEARCH_FIELDS,
    }
    body = {
        'textQuery': query,
        'maxResultCount': MAX_RESULTS_PER_SEARCH,
        'locationBias': {
            'circle': {
                'center': {'latitude': lat, 'longitude': lng},
                'radius': LOCATION_BIAS_RADIUS_M,
            }
        },
    }
    last_err = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            r = requests.post(SEARCH_URL, headers=headers, json=body, timeout=30)
            r.raise_for_status()
            data = r.json()
            return data.get('places', []), None
        except requests.RequestException as e:
            last_err = e
            if attempt < MAX_RETRIES:
                time.sleep(0.5 * (2 ** attempt))
    return [], str(last_err)


# ----------------------------------------------------------------------------
# Address parsing
# ----------------------------------------------------------------------------

def parse_address_components(place: dict) -> dict:
    out = {'street_address': None, 'city': None, 'state': None, 'zip': None}
    comps = place.get('addressComponents', []) or []
    street_number = None
    route = None
    for comp in comps:
        types = comp.get('types') or []
        long_text = comp.get('longText', '')
        short_text = comp.get('shortText', '')
        if 'street_number' in types:
            street_number = long_text
        elif 'route' in types:
            route = long_text
        elif 'locality' in types:
            out['city'] = long_text
        elif 'administrative_area_level_1' in types:
            out['state'] = short_text
        elif 'postal_code' in types:
            out['zip'] = long_text[:5]
    if street_number and route:
        out['street_address'] = f"{street_number} {route}"
    elif route:
        out['street_address'] = route
    return out


def build_discovery_row(place: dict, keyword: str, city: str) -> dict:
    addr = parse_address_components(place)
    loc = place.get('location') or {}
    display = place.get('displayName') or {}
    return {
        'google_place_id': place['id'],
        'name': display.get('text', ''),
        'formatted_address': place.get('formattedAddress'),
        'latitude': loc.get('latitude'),
        'longitude': loc.get('longitude'),
        'street_address': addr['street_address'],
        'city': addr['city'],
        'state': addr['state'],
        'zip': addr['zip'],
        'phone': place.get('nationalPhoneNumber'),
        'website': place.get('websiteUri'),
        'business_status': place.get('businessStatus'),
        'rating_value': place.get('rating'),
        'rating_count': place.get('userRatingCount'),
        'primary_type': place.get('primaryType'),
        'types': place.get('types'),
        'discovered_via_keyword': keyword,
        'discovered_via_city': city,
    }


# ----------------------------------------------------------------------------
# Persistence
# ----------------------------------------------------------------------------

def insert_discovery_rows(supabase, rows: list[dict]) -> tuple[int, int]:
    """Insert rows. Returns (inserted, skipped_duplicates)."""
    if not rows:
        return 0, 0
    inserted = 0
    skipped = 0
    for row in rows:
        try:
            existing = (
                supabase.table('places_discovery')
                .select('id')
                .eq('google_place_id', row['google_place_id'])
                .limit(1)
                .execute()
            )
            if existing.data:
                skipped += 1
                continue
            supabase.table('places_discovery').insert(row).execute()
            inserted += 1
        except Exception as e:
            err = str(e)
            if 'duplicate key' in err or '23505' in err:
                skipped += 1
            else:
                print(f"    !! Insert error for {row['google_place_id']}: {e}")
    return inserted, skipped


def log_discovery_run(supabase, run_id: str, keyword: str, metro: dict,
                       results_count: int, inserted: int, skipped: int,
                       status: str = 'success', error: str | None = None):
    supabase.table('discovery_runs').insert({
        'run_id': run_id,
        'keyword': keyword,
        'city_name': metro['name'],
        'city_lat': metro['lat'],
        'city_lng': metro['lng'],
        'radius_m': LOCATION_BIAS_RADIUS_M,
        'results_count': results_count,
        'inserted_count': inserted,
        'skipped_count': skipped,
        'api_status': status,
        'error_message': error,
    }).execute()


def get_completed_pairs(supabase) -> set[tuple[str, str]]:
    """Fetch all (keyword, city) pairs already completed across all prior runs."""
    rows = supabase.table('discovery_runs').select('keyword, city_name').eq('api_status', 'success').execute().data or []
    return {(r['keyword'], r['city_name']) for r in rows}


# ----------------------------------------------------------------------------
# Stats
# ----------------------------------------------------------------------------

def show_stats(supabase):
    print("\n========== places_discovery STATS ==========\n")
    total = supabase.table('places_discovery').select('id', count='exact').execute()
    print(f"Total rows: {total.count}")

    rows = supabase.table('places_discovery').select('state, discovered_via_keyword, rating_count').execute().data or []

    state_counts = {}
    kw_counts = {}
    rated = 0
    review_counts = []
    for r in rows:
        s = r.get('state') or 'unknown'
        state_counts[s] = state_counts.get(s, 0) + 1
        k = r.get('discovered_via_keyword') or 'unknown'
        kw_counts[k] = kw_counts.get(k, 0) + 1
        rc = r.get('rating_count')
        if rc:
            rated += 1
            review_counts.append(rc)

    print(f"\nBy state (top 15):")
    for state, c in sorted(state_counts.items(), key=lambda x: -x[1])[:15]:
        print(f"  {state}: {c}")

    print(f"\nBy keyword:")
    for k, c in sorted(kw_counts.items(), key=lambda x: -x[1]):
        print(f"  {k}: {c}")

    print(f"\nRating coverage: {rated}/{len(rows)} ({100*rated/max(1,len(rows)):.0f}%)")
    if review_counts:
        review_counts.sort()
        print(f"  median reviews: {review_counts[len(review_counts)//2]}")
        print(f"  max reviews:    {review_counts[-1]}")


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true', help='Estimate cost, fetch nothing')
    parser.add_argument('--new-run', action='store_true', help='Ignore prior runs, re-fetch everything')
    parser.add_argument('--limit', type=int, help='Cap number of (keyword,city) pairs (testing)')
    parser.add_argument('--stats', action='store_true', help='Show stats and exit')
    parser.add_argument('--yes', '-y', action='store_true', help='Skip cost confirmation')
    args = parser.parse_args()

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    if args.stats:
        show_stats(supabase)
        return

    # Build full pair list
    all_pairs = [(kw, m) for kw in KEYWORDS for m in METROS]
    total_planned = len(all_pairs)

    # Resumability: filter out already-completed pairs
    if not args.new_run:
        completed = get_completed_pairs(supabase)
        pairs = [(kw, m) for kw, m in all_pairs if (kw, m['name']) not in completed]
        skipped_count = total_planned - len(pairs)
        if skipped_count:
            print(f"Resuming: {skipped_count} pairs already completed in prior runs (skipping)")
    else:
        pairs = all_pairs

    if args.limit:
        pairs = pairs[:args.limit]

    n = len(pairs)
    est_cost = n * COST_PER_SEARCH

    print(f"\nFull discovery run plan")
    print(f"  Metros:    {len(METROS)}")
    print(f"  Keywords:  {len(KEYWORDS)} ({', '.join(KEYWORDS)})")
    print(f"  Pairs:     {total_planned} planned, {n} pending")
    print(f"  Est cost:  ~${est_cost:.2f}")
    print(f"  Hard cap:  {SEARCH_HARD_CAP} searches (~${SEARCH_HARD_CAP * COST_PER_SEARCH:.2f})")
    print(f"  Dry run:   {args.dry_run}")

    if n == 0:
        print("\nAll pairs already completed. Nothing to do.")
        if not args.dry_run:
            show_stats(supabase)
        return

    if n > SEARCH_HARD_CAP:
        print(f"\nABORT: planned searches ({n}) exceeds hard cap ({SEARCH_HARD_CAP}).")
        print("Run with --limit to cap, or raise SEARCH_HARD_CAP if intentional.")
        sys.exit(1)

    if args.dry_run:
        print("\nDry run — exiting without API calls.")
        return

    if not args.yes and n >= 100:
        try:
            resp = input(f"\nProceed with {n} searches (~${est_cost:.2f})? [y/N]: ").strip().lower()
        except EOFError:
            resp = ''
        if resp not in ('y', 'yes'):
            print("Aborted.")
            return

    # Run
    run_id = str(uuid.uuid4())
    print(f"\nRun ID: {run_id}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    start_time = datetime.now()
    total_inserted = 0
    total_skipped = 0
    total_results = 0
    errors = 0
    capped_searches = 0

    for i, (keyword, metro) in enumerate(pairs, start=1):
        if capped_searches >= SEARCH_HARD_CAP:
            print(f"\n!! Hard cap reached ({SEARCH_HARD_CAP} searches). Stopping.")
            break

        print(f"[{i}/{n}] {metro['name']:<25} '{keyword}'", end=' ', flush=True)
        places, err = places_text_search(keyword, metro['lat'], metro['lng'])
        capped_searches += 1

        if err:
            print(f"-> ERROR: {err}")
            log_discovery_run(supabase, run_id, keyword, metro, 0, 0, 0, status='error', error=err)
            errors += 1
            time.sleep(REQUEST_DELAY_SEC)
            continue

        rows = [build_discovery_row(p, keyword, metro['name']) for p in places]
        # Dedup within batch
        seen = set()
        unique = []
        for r in rows:
            if r['google_place_id'] not in seen:
                seen.add(r['google_place_id'])
                unique.append(r)

        inserted, skipped = insert_discovery_rows(supabase, unique)
        total_inserted += inserted
        total_skipped += skipped
        total_results += len(places)

        log_discovery_run(supabase, run_id, keyword, metro, len(places), inserted, skipped)

        print(f"-> {len(places)} found, {inserted} new, {skipped} dup")

        # Progress every 25 pairs
        if i % 25 == 0:
            elapsed = datetime.now() - start_time
            rate = elapsed.total_seconds() / i
            remaining = timedelta(seconds=rate * (n - i))
            eta = (datetime.now() + remaining).strftime('%H:%M:%S')
            print(
                f"\n  === Progress: {i}/{n} ({100*i/n:.0f}%) | "
                f"{total_inserted} new clinics | ETA {eta} ===\n"
            )

        time.sleep(REQUEST_DELAY_SEC)

    elapsed = datetime.now() - start_time
    actual_cost = capped_searches * COST_PER_SEARCH

    print("\n========== FINAL ==========")
    print(f"Run ID:           {run_id}")
    print(f"Pairs completed:  {capped_searches}/{n}")
    print(f"Total results:    {total_results}")
    print(f"New clinics:      {total_inserted}")
    print(f"Duplicates:       {total_skipped}")
    print(f"Errors:           {errors}")
    print(f"Runtime:          {str(elapsed).split('.')[0]}")
    print(f"Actual cost:      ~${actual_cost:.2f}")

    show_stats(supabase)


if __name__ == '__main__':
    main()
