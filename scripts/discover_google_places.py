#!/usr/bin/env python3
"""
discover_google_places.py  (pilot)

Bottom-up clinic discovery via Google Places API Text Search.

Queries IV-related keywords across target cities, collects unique businesses,
writes to `places_discovery` staging table. Does NOT fetch Place Details
(cheaper search-only pilot). Details enrichment runs as a separate step
after you review the pilot data.

Pilot defaults:
  - 5 cities (Miami, LA, NYC, Austin, Chicago)
  - 3 keywords ('IV therapy', 'IV hydration', 'mobile IV')
  - 30km radius location bias per city
  - Up to 20 results per search (Places API max)
  - Estimated cost: ~$0.50

Usage:
  python scripts/discover_google_places.py              # pilot (defaults)
  python scripts/discover_google_places.py --dry-run    # fetch but don't write
  python scripts/discover_google_places.py --stats      # just show current discovery counts

Requires migration:
  - create_places_discovery_table.sql

Env vars:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_PLACES_API_KEY
"""

import argparse
import os
import sys
import time
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

# Fields to retrieve per search result — keep minimal for cost control
# These are "Essentials" and "Pro" tier fields for Text Search
SEARCH_FIELDS = (
    'places.id,places.displayName,places.formattedAddress,'
    'places.addressComponents,places.location,'
    'places.nationalPhoneNumber,places.websiteUri,'
    'places.rating,places.userRatingCount,'
    'places.businessStatus,places.primaryType,places.types'
)

REQUEST_DELAY_SEC = 0.3
MAX_RESULTS_PER_SEARCH = 20  # Places API New max per Text Search

# Pilot target cities — good geographic + cultural spread for IV wellness
PILOT_CITIES = [
    {'name': 'Miami, FL',     'lat': 25.7617, 'lng': -80.1918},
    {'name': 'Los Angeles, CA','lat': 34.0522, 'lng': -118.2437},
    {'name': 'New York, NY',  'lat': 40.7128, 'lng': -74.0060},
    {'name': 'Austin, TX',    'lat': 30.2672, 'lng': -97.7431},
    {'name': 'Chicago, IL',   'lat': 41.8781, 'lng': -87.6298},
]

# Pilot keywords — most IV-specific consumer search terms
PILOT_KEYWORDS = [
    'IV therapy',
    'IV hydration',
    'mobile IV',
]

# Location bias radius (meters) — 30km covers most metro areas
LOCATION_BIAS_RADIUS_M = 30_000


# ----------------------------------------------------------------------------
# Google Places API
# ----------------------------------------------------------------------------

def places_text_search(query: str, lat: float, lng: float, radius_m: int = LOCATION_BIAS_RADIUS_M):
    """Run Places API (New) Text Search with location bias.

    Returns list of place dicts (up to MAX_RESULTS_PER_SEARCH).
    """
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
                'radius': radius_m,
            }
        },
    }
    try:
        r = requests.post(SEARCH_URL, headers=headers, json=body, timeout=30)
        r.raise_for_status()
        data = r.json()
        return data.get('places', [])
    except requests.RequestException as e:
        print(f"  !! Search error for '{query}' @ ({lat},{lng}): {e}")
        return []


# ----------------------------------------------------------------------------
# Address parsing
# ----------------------------------------------------------------------------

def parse_address_components(place: dict) -> dict:
    """Extract structured address from addressComponents array."""
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
            out['state'] = short_text  # Use 2-letter abbreviation
        elif 'postal_code' in types:
            out['zip'] = long_text[:5]

    if street_number and route:
        out['street_address'] = f"{street_number} {route}"
    elif route:
        out['street_address'] = route

    return out


# ----------------------------------------------------------------------------
# Transform + persist
# ----------------------------------------------------------------------------

def build_discovery_row(place: dict, keyword: str, city: str) -> dict:
    """Transform a Places API result into a places_discovery row."""
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


def upsert_discovery(supabase, rows: list[dict], dry_run: bool):
    """Insert rows with on-conflict do-nothing (dedup by google_place_id).

    Returns (inserted, skipped) counts.
    """
    if not rows:
        return 0, 0

    if dry_run:
        return len(rows), 0

    # Supabase client uses upsert with ignore_duplicates to skip existing place_ids
    inserted = 0
    skipped = 0

    for row in rows:
        try:
            # Check if exists first (cheaper than failed insert)
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
                print(f"  !! Insert error for {row['google_place_id']}: {e}")

    return inserted, skipped


# ----------------------------------------------------------------------------
# Stats reporting
# ----------------------------------------------------------------------------

def show_stats(supabase):
    """Print current places_discovery table stats."""
    print("\n========== places_discovery STATS ==========\n")

    total = supabase.table('places_discovery').select('id', count='exact').execute()
    print(f"Total rows: {total.count}")

    # By state
    print("\nBy state (top 10):")
    rows = supabase.table('places_discovery').select('state').execute().data or []
    state_counts = {}
    for r in rows:
        s = r.get('state') or 'unknown'
        state_counts[s] = state_counts.get(s, 0) + 1
    for state, c in sorted(state_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"  {state}: {c}")

    # By keyword
    print("\nBy keyword:")
    rows = supabase.table('places_discovery').select('discovered_via_keyword').execute().data or []
    kw_counts = {}
    for r in rows:
        k = r.get('discovered_via_keyword') or 'unknown'
        kw_counts[k] = kw_counts.get(k, 0) + 1
    for k, c in sorted(kw_counts.items(), key=lambda x: -x[1]):
        print(f"  {k}: {c}")

    # Rating distribution
    rows = supabase.table('places_discovery').select('rating_count').execute().data or []
    rated = [r for r in rows if r.get('rating_count')]
    print(f"\nRating counts: {len(rated)} rated / {len(rows)} total")
    if rated:
        counts = sorted([r['rating_count'] for r in rated])
        print(f"  min={counts[0]} median={counts[len(counts)//2]} max={counts[-1]}")


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true', help='Fetch but do not persist')
    parser.add_argument('--stats', action='store_true', help='Show stats and exit')
    parser.add_argument('--cities', help='Comma-separated city indexes (e.g. "0,1,2") to run subset')
    parser.add_argument('--keywords', help='Comma-separated keyword indexes to run subset')
    args = parser.parse_args()

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    if args.stats:
        show_stats(supabase)
        return

    # Select subset if specified
    cities = PILOT_CITIES
    if args.cities:
        idxs = [int(x) for x in args.cities.split(',')]
        cities = [PILOT_CITIES[i] for i in idxs]
    keywords = PILOT_KEYWORDS
    if args.keywords:
        idxs = [int(x) for x in args.keywords.split(',')]
        keywords = [PILOT_KEYWORDS[i] for i in idxs]

    total_searches = len(cities) * len(keywords)
    est_cost = total_searches * 0.032

    print(f"Pilot discovery run")
    print(f"  Cities:    {len(cities)} ({', '.join(c['name'] for c in cities)})")
    print(f"  Keywords:  {len(keywords)} ({', '.join(keywords)})")
    print(f"  Searches:  {total_searches}")
    print(f"  Est cost:  ~${est_cost:.2f}")
    print(f"  Dry run:   {args.dry_run}\n")

    all_rows = []
    per_search_counts = []

    for city in cities:
        for keyword in keywords:
            print(f"[{city['name']}] Searching '{keyword}'...")
            places = places_text_search(keyword, city['lat'], city['lng'])
            print(f"  -> {len(places)} results")
            per_search_counts.append({
                'city': city['name'],
                'keyword': keyword,
                'results': len(places),
            })
            for p in places:
                all_rows.append(build_discovery_row(p, keyword, city['name']))
            time.sleep(REQUEST_DELAY_SEC)

    # Dedup in-memory by google_place_id before DB write
    seen = set()
    unique_rows = []
    for r in all_rows:
        if r['google_place_id'] not in seen:
            seen.add(r['google_place_id'])
            unique_rows.append(r)

    print(f"\nCollected {len(all_rows)} results, {len(unique_rows)} unique (after dedup)")

    # Persist
    inserted, skipped = upsert_discovery(supabase, unique_rows, args.dry_run)
    print(f"Inserted: {inserted} | Skipped (already in DB): {skipped}\n")

    # Summary
    print("========== PER-SEARCH BREAKDOWN ==========")
    for s in per_search_counts:
        print(f"  {s['city']:<20} '{s['keyword']:<15}' -> {s['results']} results")

    if not args.dry_run:
        print()
        show_stats(supabase)


if __name__ == '__main__':
    main()
