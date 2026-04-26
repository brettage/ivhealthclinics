#!/usr/bin/env python3
"""
discover_google_places_gapfill.py

Second-pass Google Places discovery targeting underrepresented suburban and
secondary metros that were thin in the main 100-metro discovery run.

Differences from full discovery:
  - 30 suburban/secondary metros (not in main 100)
  - 15km radius (smaller — focused on suburb, not bleeding into primary metro)
  - Same 5 keywords as main run for consistency
  - Resumability via shared discovery_runs audit table
  - Hard cap: 200 searches (safety net)

Estimated cost: 30 metros x 5 keywords x $0.032 = ~$4.80
Estimated runtime: ~10-15 min
Expected yield: 500-1,000 new unique clinics (after dedup)

Usage:
  python scripts/discover_google_places_gapfill.py             # standard run
  python scripts/discover_google_places_gapfill.py --dry-run   # estimate, no API calls
  python scripts/discover_google_places_gapfill.py --stats     # current discovery counts

Requires (already created in main discovery setup):
  - places_discovery table
  - discovery_runs table

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
LOCATION_BIAS_RADIUS_M = 15_000  # smaller than main 25km — suburb-focused
MAX_RETRIES = 2
SEARCH_HARD_CAP = 200
COST_PER_SEARCH = 0.032

# 30 suburban/secondary metros for gap-fill
GAPFILL_METROS = [
    # Northeast suburbs
    {'name': 'Hempstead, NY (Long Island)',     'lat': 40.7062, 'lng': -73.6187},
    {'name': 'White Plains, NY (Westchester)',  'lat': 41.0339, 'lng': -73.7629},
    {'name': 'Newark, NJ',                       'lat': 40.7357, 'lng': -74.1724},
    {'name': 'Jersey City, NJ',                  'lat': 40.7178, 'lng': -74.0431},
    {'name': 'Cherry Hill, NJ',                  'lat': 39.9348, 'lng': -75.0307},
    {'name': 'Stamford, CT',                     'lat': 41.0534, 'lng': -73.5387},

    # Chicagoland suburbs
    {'name': 'Naperville, IL',                   'lat': 41.7508, 'lng': -88.1535},
    {'name': 'Schaumburg, IL',                   'lat': 42.0334, 'lng': -88.0834},
    {'name': 'Aurora, IL',                       'lat': 41.7606, 'lng': -88.3201},

    # Bay Area suburbs
    {'name': 'Walnut Creek, CA',                 'lat': 37.9101, 'lng': -122.0652},
    {'name': 'San Mateo, CA',                    'lat': 37.5630, 'lng': -122.3255},
    {'name': 'Fremont, CA',                      'lat': 37.5485, 'lng': -121.9886},

    # LA-area secondary
    {'name': 'Long Beach, CA',                   'lat': 33.7701, 'lng': -118.1937},
    {'name': 'Santa Monica, CA',                 'lat': 34.0195, 'lng': -118.4912},
    {'name': 'Pasadena, CA',                     'lat': 34.1478, 'lng': -118.1445},
    {'name': 'Anaheim, CA',                      'lat': 33.8366, 'lng': -117.9143},
    {'name': 'Irvine, CA',                       'lat': 33.6846, 'lng': -117.8265},

    # DC/Baltimore corridor
    {'name': 'Bethesda, MD',                     'lat': 38.9847, 'lng': -77.0947},
    {'name': 'Silver Spring, MD',                'lat': 38.9907, 'lng': -77.0261},
    {'name': 'Tysons, VA',                       'lat': 38.9186, 'lng': -77.2311},
    {'name': 'Alexandria, VA',                   'lat': 38.8048, 'lng': -77.0469},

    # Atlanta suburbs
    {'name': 'Marietta, GA',                     'lat': 33.9526, 'lng': -84.5499},
    {'name': 'Alpharetta, GA',                   'lat': 34.0754, 'lng': -84.2941},

    # DFW secondary
    {'name': 'Plano, TX',                        'lat': 33.0198, 'lng': -96.6989},
    {'name': 'Frisco, TX',                       'lat': 33.1507, 'lng': -96.8236},
    {'name': 'Arlington, TX',                    'lat': 32.7357, 'lng': -97.1081},

    # Houston suburbs
    {'name': 'Sugar Land, TX',                   'lat': 29.5994, 'lng': -95.6147},
    {'name': 'The Woodlands, TX',                'lat': 30.1658, 'lng': -95.4613},

    # Seattle suburb
    {'name': 'Bellevue, WA',                     'lat': 47.6101, 'lng': -122.2015},

    # Underserved smaller markets
    {'name': 'Asheville, NC',                    'lat': 35.5951, 'lng': -82.5515},
    {'name': 'Naples, FL',                       'lat': 26.1420, 'lng': -81.7948},
    {'name': 'Sarasota, FL',                     'lat': 27.3364, 'lng': -82.5307},
    {'name': 'Boulder, CO',                      'lat': 40.0150, 'lng': -105.2705},
    {'name': 'Reno, NV',                         'lat': 39.5296, 'lng': -119.8138},
]

KEYWORDS = [
    'IV therapy',
    'IV hydration',
    'mobile IV',
    'NAD infusion',
    'vitamin drip',
]


def places_text_search(query, lat, lng):
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
            return r.json().get('places', []), None
        except requests.RequestException as e:
            last_err = e
            if attempt < MAX_RETRIES:
                time.sleep(0.5 * (2 ** attempt))
    return [], str(last_err)


def parse_address_components(place):
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


def build_discovery_row(place, keyword, city):
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


def insert_rows(supabase, rows):
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
                print(f"    !! Insert error: {e}")
    return inserted, skipped


def log_run(supabase, run_id, keyword, metro, results, inserted, skipped, status='success', error=None):
    supabase.table('discovery_runs').insert({
        'run_id': run_id,
        'keyword': keyword,
        'city_name': metro['name'],
        'city_lat': metro['lat'],
        'city_lng': metro['lng'],
        'radius_m': LOCATION_BIAS_RADIUS_M,
        'results_count': results,
        'inserted_count': inserted,
        'skipped_count': skipped,
        'api_status': status,
        'error_message': error,
    }).execute()


def get_completed_pairs(supabase):
    rows = supabase.table('discovery_runs').select('keyword, city_name').eq('api_status', 'success').execute().data or []
    return {(r['keyword'], r['city_name']) for r in rows}


def show_stats(supabase):
    print("\n========== places_discovery STATS ==========\n")
    total = supabase.table('places_discovery').select('id', count='exact').execute()
    print(f"Total rows: {total.count}\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--stats', action='store_true')
    parser.add_argument('--yes', '-y', action='store_true')
    args = parser.parse_args()

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    if args.stats:
        show_stats(supabase)
        return

    all_pairs = [(kw, m) for kw in KEYWORDS for m in GAPFILL_METROS]
    completed = get_completed_pairs(supabase)
    pairs = [(kw, m) for kw, m in all_pairs if (kw, m['name']) not in completed]

    n = len(pairs)
    est_cost = n * COST_PER_SEARCH

    print(f"\nGap-fill discovery run plan")
    print(f"  Metros:    {len(GAPFILL_METROS)}")
    print(f"  Keywords:  {len(KEYWORDS)} ({', '.join(KEYWORDS)})")
    print(f"  Radius:    {LOCATION_BIAS_RADIUS_M}m (smaller than main run's 25km)")
    print(f"  Pairs:     {len(all_pairs)} planned, {n} pending after resumability check")
    print(f"  Est cost:  ~${est_cost:.2f}")
    print(f"  Hard cap:  {SEARCH_HARD_CAP} searches (~${SEARCH_HARD_CAP * COST_PER_SEARCH:.2f})")
    print(f"  Dry run:   {args.dry_run}")

    if n == 0:
        print("\nAll pairs already completed. Nothing to do.")
        return

    if n > SEARCH_HARD_CAP:
        print(f"\nABORT: planned searches ({n}) exceeds hard cap ({SEARCH_HARD_CAP}).")
        sys.exit(1)

    if args.dry_run:
        print("\nDry run — exiting without API calls.")
        return

    if not args.yes:
        try:
            resp = input(f"\nProceed with {n} searches (~${est_cost:.2f})? [y/N]: ").strip().lower()
        except EOFError:
            resp = ''
        if resp not in ('y', 'yes'):
            print("Aborted.")
            return

    run_id = str(uuid.uuid4())
    print(f"\nRun ID: {run_id}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    start_time = datetime.now()
    total_inserted = 0
    total_skipped = 0
    total_results = 0
    errors = 0

    for i, (keyword, metro) in enumerate(pairs, start=1):
        print(f"[{i}/{n}] {metro['name']:<35} '{keyword}'", end=' ', flush=True)
        places, err = places_text_search(keyword, metro['lat'], metro['lng'])

        if err:
            print(f"-> ERROR: {err}")
            log_run(supabase, run_id, keyword, metro, 0, 0, 0, status='error', error=err)
            errors += 1
            time.sleep(REQUEST_DELAY_SEC)
            continue

        rows = [build_discovery_row(p, keyword, metro['name']) for p in places]
        seen = set()
        unique = []
        for r in rows:
            if r['google_place_id'] not in seen:
                seen.add(r['google_place_id'])
                unique.append(r)

        inserted, skipped = insert_rows(supabase, unique)
        total_inserted += inserted
        total_skipped += skipped
        total_results += len(places)

        log_run(supabase, run_id, keyword, metro, len(places), inserted, skipped)
        print(f"-> {len(places)} found, {inserted} new, {skipped} dup")

        if i % 25 == 0:
            elapsed = datetime.now() - start_time
            rate = elapsed.total_seconds() / i
            remaining = timedelta(seconds=rate * (n - i))
            eta = (datetime.now() + remaining).strftime('%H:%M:%S')
            print(f"\n  === Progress: {i}/{n} ({100*i/n:.0f}%) | {total_inserted} new | ETA {eta} ===\n")

        time.sleep(REQUEST_DELAY_SEC)

    elapsed = datetime.now() - start_time
    actual_cost = (i if errors > 0 else n) * COST_PER_SEARCH

    print("\n========== GAP-FILL FINAL ==========")
    print(f"Run ID:           {run_id}")
    print(f"Pairs completed:  {n}")
    print(f"Total results:    {total_results}")
    print(f"New clinics:      {total_inserted}")
    print(f"Duplicates:       {total_skipped}")
    print(f"Errors:           {errors}")
    print(f"Runtime:          {str(elapsed).split('.')[0]}")
    print(f"Actual cost:      ~${actual_cost:.2f}")

    show_stats(supabase)


if __name__ == '__main__':
    main()
