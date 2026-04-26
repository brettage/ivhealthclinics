#!/usr/bin/env python3
"""
IVHealthClinics — Brave Search URL Enrichment Script
=====================================================
Searches Brave Web Search API for clinic website URLs.
Much cheaper than Google Places for URL discovery.

Pricing: $5 per 1,000 requests ($5 free credit/month)
For 4,651 clinics: ~$23.25 total (minus $5 free = ~$18.25)

Strategy:
  1. Run this FIRST to get website URLs cheaply via Brave
  2. Then run Google Places ONLY on clinics that need ratings/hours/photos

Usage:
  pip install requests python-dotenv supabase
  python scripts/enrich_brave_urls.py

Options:
  --confirmed-only    Only enrich the 216 confirmed IV clinics first
  --batch-size 100    Process N clinics per batch (default: 100)
  --dry-run           Search but don't update Supabase
  --start-from 0      Resume from a specific offset

Environment variables (in .env.local):
  BRAVE_API_KEY=your_brave_api_key
  SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
"""

import argparse
import json
import logging
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")

BRAVE_API_KEY = os.getenv("BRAVE_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

BRAVE_WEB_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"

# Rate limiting: Brave allows 1 req/sec on free tier, more on paid
REQUESTS_PER_SECOND = 1  # Conservative — bump to 3-5 if on paid plan
DELAY_BETWEEN_REQUESTS = 1.0 / REQUESTS_PER_SECOND

# Checkpoint file to track progress
CHECKPOINT_FILE = "brave_enrich_checkpoint.json"
RESULTS_LOG_FILE = "brave_enrich_results.jsonl"

# Domains to skip (not real clinic websites)
# Organized by category for easy maintenance
SKIP_DOMAINS = {
    # --- Social media ---
    "facebook.com", "instagram.com", "twitter.com", "x.com",
    "linkedin.com", "tiktok.com", "pinterest.com", "youtube.com",
    "reddit.com", "nextdoor.com", "threads.net",

    # --- Major directories & review sites ---
    "yelp.com", "yellowpages.com", "bbb.org", "superpages.com",
    "whitepages.com", "citysearch.com", "foursquare.com",
    "mapquest.com", "google.com", "apple.com", "bing.com",
    "thumbtack.com", "angi.com", "homeadvisor.com", "bark.com",

    # --- Healthcare directories ---
    "healthgrades.com", "zocdoc.com", "vitals.com", "webmd.com",
    "doximity.com", "sharecare.com", "ratemds.com", "wellness.com",
    "castleconnolly.com", "usnews.com", "docspot.com",
    "carefinder.com", "findadoctor.com", "doctor.com",
    "medlineplus.gov", "medicare.gov", "cms.gov",

    # --- NPI / provider registries (the ones that fooled the dry run) ---
    "npidb.org", "npino.com", "npiprofile.com", "hipaaspace.com",
    "opennpi.com", "npinumberlookup.org", "npiregistry.cms.hhs.gov",
    "pubprofile.com", "practicecrown.com", "begincare.com",
    "cluenpi.com", "nppes.com", "nppesapi.com",
    "medicaidproviderenrollment.com", "providerenrollment.com",
    "clinicianconnect.com", "providergo.com", "npiwatch.com",
    "pecosenrollment.com", "findnpi.com", "npilist.com",
    "npifind.com", "docinfo.org", "freeprofilelookup.com",
    "nursys.com", "healthdata.gov",

    # --- Healthcare/infusion directories & Medicare supplier listings ---
    "2infuse.com", "medicarelist.com", "providerwire.com",
    "visionhealthmatters.com", "infusioncenter.org",
    "medicare.com", "medicareinteractive.org",
    "supplierdir.com", "dmeposreferral.com",
    "homehealth.com", "carelinkhealth.com",
    "healthnetwork.com", "medicalrecords.com",
    "wellnessconnection.com", "infusionproviders.com",
    "health-network.com", "healthcarefacilitydirectory.com",
    "e-physician.info", "affinityventures.com",
    "natampa.com", "g2xchange.com",

    # --- Business data aggregators ---
    "manta.com", "chamberofcommerce.com", "buzzfile.com",
    "opencorporates.com", "dnb.com", "zoominfo.com",
    "crunchbase.com", "bloomberg.com", "owler.com",
    "bizapedia.com", "corporationwiki.com", "sec.gov",
    "sunbiz.org", "opengovus.com",

    # --- Job sites ---
    "indeed.com", "glassdoor.com", "ziprecruiter.com", "salary.com",

    # --- Legal / court / government ---
    "courtlistener.com", "govinfo.gov", "regulations.gov",
    "usa.gov", "sba.gov",

    # --- Catch-all patterns for common directory suffixes ---
    "hotfrog.com", "showmelocal.com", "merchantcircle.com",
    "brownbook.net", "cylex.us", "tupalo.com", "fyple.com",
    "spoke.com", "dandb.com", "dexknows.com", "infobel.com",
    "ezlocal.com", "cityfos.com", "n49.com", "hub.biz",
    "getfave.com", "bizhwy.com", "salespider.com",
    "golocal247.com", "chamberorganizer.com",
    "us-info.com", "us-business.info",
}

# Substrings found in directory URLs (catches domains not in the exact list above)
SKIP_URL_PATTERNS = [
    "/provider/", "/providers/", "/npi/", "/doctor/", "/doctors/",
    "/listing/", "/listings/", "/biz/", "/business/",
    "/profile/", "/profiles/", "/profile-ic/", "/profile-oc/",
    "npi-number", "npi-lookup",
    "provider-directory", "find-a-doctor", "find-a-provider",
    "/supplier/", "/health-network/", "/clinic-directory/",
    "/infusion-therapy-clinic", "/medicare-supplier",
]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def validate_env():
    """Check all required environment variables are set."""
    missing = []
    if not BRAVE_API_KEY:
        missing.append("BRAVE_API_KEY")
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
    if not SUPABASE_SERVICE_ROLE_KEY:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        log.error(f"Missing environment variables: {', '.join(missing)}")
        log.error("Add them to .env.local in the project root.")
        sys.exit(1)


def is_valid_clinic_url(url: str, clinic_name: str) -> bool:
    """
    Check if a URL is likely the clinic's actual website
    (not a directory listing, social media page, etc.)
    """
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower().replace("www.", "")
        full_url_lower = url.lower()

        # Skip known non-clinic domains
        for skip in SKIP_DOMAINS:
            if domain.endswith(skip):
                return False

        # Skip URLs with directory-style path patterns
        for pattern in SKIP_URL_PATTERNS:
            if pattern in full_url_lower:
                return False

        # Skip if domain looks like a generic directory
        directory_signals = [
            "findadoctor", "doctor.com", "wellness.com",
            "directory", "lookup", "registry", "locator",
        ]
        if any(d in domain for d in directory_signals):
            return False

        # Skip very long paths with lots of segments (usually aggregator pages)
        path_segments = [s for s in parsed.path.split("/") if s]
        if len(path_segments) > 4:
            return False

        return True
    except Exception:
        return False


def extract_best_url(search_results: dict, clinic_name: str, city: str) -> str | None:
    """
    From Brave search results, find the most likely clinic website URL.
    
    Strategy:
    - Heavy bonus if clinic name words appear in the domain itself (strongest signal)
    - Check title match ratio — require at least 50% of name words to match
    - Skip results where the title clearly references a different business name
    - High confidence threshold to avoid wrong-business matches
    """
    web_results = search_results.get("web", {}).get("results", [])
    
    if not web_results:
        return None

    # Normalize clinic name for matching
    name_lower = clinic_name.lower()
    name_words = set(re.sub(r"[^a-z0-9\s]", "", name_lower).split())
    # Remove common filler words for matching
    filler_words = {
        "llc", "inc", "corp", "the", "and", "of", "pllc", "pc", "pa",
        "md", "do", "center", "clinic", "services", "service", "therapy",
    }
    name_words -= filler_words
    
    # Build a simplified version of the name for domain matching
    # e.g., "Activate Drip Spa LLC" -> "activatedripspa"
    name_slug = re.sub(r"[^a-z0-9]", "", name_lower)
    # Also try with just the distinctive words (no filler)
    distinctive_slug = "".join(sorted(name_words))

    best_url = None
    best_score = 0

    for result in web_results:
        url = result.get("url", "")
        title = result.get("title", "").lower()
        description = result.get("description", "").lower()

        if not is_valid_clinic_url(url, clinic_name):
            continue

        # Score this result
        score = 0
        
        # --- DOMAIN NAME MATCH (strongest signal) ---
        # If "activatedripspa" appears in "activatedripspa.com", that's almost certainly the site
        try:
            domain = urlparse(url).netloc.lower().replace("www.", "")
            domain_no_tld = domain.rsplit(".", 1)[0]  # "activatedripspa" from "activatedripspa.com"
            domain_clean = re.sub(r"[^a-z0-9]", "", domain_no_tld)
            
            # Check if name slug is in the domain or vice versa
            if name_slug and len(name_slug) >= 6:
                if name_slug in domain_clean or domain_clean in name_slug:
                    score += 15  # Very strong match
            
            # Check if most distinctive name words appear in domain
            domain_words_match = sum(1 for w in name_words if w in domain_clean and len(w) >= 3)
            if len(name_words) > 0 and domain_words_match >= len(name_words) * 0.6:
                score += 10
        except Exception:
            pass

        # --- TITLE MATCH ---
        title_words = set(re.sub(r"[^a-z0-9\s]", "", title).split())
        matching_words = name_words & title_words
        if len(name_words) > 0:
            match_ratio = len(matching_words) / len(name_words)
            score += match_ratio * 8  # Up to 8 points for name match in title

        # --- CITY MATCH ---
        if city.lower() in title or city.lower() in description:
            score += 2

        # --- IV KEYWORDS ---
        iv_keywords = ["iv ", "iv therapy", "hydration", "infusion", "vitamin drip", "nad+", "mobile iv", "drip bar"]
        for kw in iv_keywords:
            if kw in title or kw in description:
                score += 1
                break

        if score > best_score:
            best_score = score
            best_url = url

    # Require solid confidence — better to miss a URL than save the wrong one
    if best_score >= 5:
        return best_url

    return None


def search_brave(query: str) -> dict | None:
    """Execute a Brave Web Search API call."""
    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY,
    }
    params = {
        "q": query,
        "count": 5,  # We only need top few results
        "safesearch": "off",
    }

    try:
        resp = requests.get(BRAVE_WEB_SEARCH_URL, headers=headers, params=params, timeout=15)
        
        if resp.status_code == 429:
            log.warning("Rate limited by Brave API. Waiting 10s...")
            time.sleep(10)
            resp = requests.get(BRAVE_WEB_SEARCH_URL, headers=headers, params=params, timeout=15)

        resp.raise_for_status()
        return resp.json()

    except requests.exceptions.RequestException as e:
        log.error(f"Brave API error: {e}")
        return None


def load_checkpoint() -> dict:
    """Load progress checkpoint."""
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, "r") as f:
            return json.load(f)
    return {"processed_ids": [], "stats": {"searched": 0, "found": 0, "skipped": 0, "errors": 0}}


def save_checkpoint(data: dict):
    """Save progress checkpoint."""
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump(data, f, indent=2)


def log_result(clinic_id: str, clinic_name: str, url: str | None, query: str):
    """Append result to JSONL log for review."""
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "clinic_id": clinic_id,
        "clinic_name": clinic_name,
        "query": query,
        "url_found": url,
    }
    with open(RESULTS_LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")


# ---------------------------------------------------------------------------
# Main enrichment logic
# ---------------------------------------------------------------------------


def fetch_clinics(supabase: Client, confirmed_only: bool, start_from: int, batch_size: int) -> list:
    """Fetch clinics from Supabase that don't have a website URL yet."""
    query = supabase.table("clinics").select(
        "id, name, city, state, address"
    ).is_("website", "null")  # Only clinics without a website

    if confirmed_only:
        query = query.eq("is_iv_clinic", True)

    query = query.order("name").range(start_from, start_from + batch_size - 1)

    result = query.execute()
    return result.data if result.data else []


def count_clinics_without_website(supabase: Client, confirmed_only: bool) -> int:
    """Count how many clinics need a website URL."""
    query = supabase.table("clinics").select(
        "id", count="exact"
    ).is_("website", "null")

    if confirmed_only:
        query = query.eq("is_iv_clinic", True)

    result = query.execute()
    return result.count if result.count else 0


def enrich_clinics(
    supabase: Client,
    confirmed_only: bool = False,
    batch_size: int = 100,
    dry_run: bool = False,
    start_from: int = 0,
):
    """Main enrichment loop."""
    
    total = count_clinics_without_website(supabase, confirmed_only)
    log.info(f"Found {total} clinics without website URLs")
    
    if total == 0:
        log.info("All clinics already have website URLs. Nothing to do!")
        return

    checkpoint = load_checkpoint()
    processed_ids = set(checkpoint["processed_ids"])
    stats = checkpoint["stats"]

    log.info(f"Resuming from checkpoint: {stats['searched']} searched, {stats['found']} found")
    log.info(f"Starting from offset {start_from}, batch size {batch_size}")
    if dry_run:
        log.info("🔍 DRY RUN — will search but NOT update Supabase")

    offset = start_from
    
    while True:
        clinics = fetch_clinics(supabase, confirmed_only, offset, batch_size)
        
        if not clinics:
            log.info("No more clinics to process.")
            break

        log.info(f"\n--- Batch: {len(clinics)} clinics (offset {offset}) ---")

        for clinic in clinics:
            clinic_id = clinic["id"]
            
            # Skip if already processed in a previous run
            if clinic_id in processed_ids:
                continue

            name = clinic["name"]
            city = clinic.get("city", "")
            state = clinic.get("state", "")

            # Build search query: "clinic name" + city + state + "website"
            # Adding "website" biases Brave toward the clinic's actual site
            # rather than directory listings about the clinic
            query = f'"{name}" {city} {state}'
            
            log.info(f"  Searching: {name} ({city}, {state})")

            # Search Brave
            results = search_brave(query)

            if results is None:
                stats["errors"] += 1
                log.warning(f"    ❌ API error for {name}")
                time.sleep(DELAY_BETWEEN_REQUESTS)
                continue

            # Extract best URL
            url = extract_best_url(results, name, city)

            # If first search didn't find a good match, try a refined query
            if url is None:
                # Try adding IV/infusion context to disambiguate
                retry_query = f'{name} {city} {state} IV infusion clinic website'
                log.info(f"    🔄 Retrying: {retry_query}")
                time.sleep(DELAY_BETWEEN_REQUESTS)
                stats["searched"] += 1  # Count the retry as a search
                
                results2 = search_brave(retry_query)
                if results2:
                    url = extract_best_url(results2, name, city)

            if url:
                stats["found"] += 1
                log.info(f"    ✅ Found: {url}")

                if not dry_run:
                    # Update Supabase
                    try:
                        update_data = {
                            "website": url,
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                        }

                        supabase.table("clinics").update(update_data).eq("id", clinic_id).execute()

                    except Exception as e:
                        log.error(f"    ⚠️ Supabase update failed: {e}")
                        stats["errors"] += 1
            else:
                stats["skipped"] += 1
                log.info(f"    ⏭️ No URL found")

            stats["searched"] += 1
            processed_ids.add(clinic_id)

            # Log result for review
            log_result(clinic_id, name, url, query)

            # Save checkpoint every 10 records
            if stats["searched"] % 10 == 0:
                checkpoint["processed_ids"] = list(processed_ids)
                checkpoint["stats"] = stats
                save_checkpoint(checkpoint)
                log.info(f"  📊 Progress: {stats['searched']} searched, {stats['found']} found, "
                         f"{stats['skipped']} not found, {stats['errors']} errors")

            # Rate limiting
            time.sleep(DELAY_BETWEEN_REQUESTS)

        offset += batch_size

    # Final checkpoint save
    checkpoint["processed_ids"] = list(processed_ids)
    checkpoint["stats"] = stats
    save_checkpoint(checkpoint)

    # Summary
    log.info("\n" + "=" * 60)
    log.info("ENRICHMENT COMPLETE")
    log.info("=" * 60)
    log.info(f"  Total searched:  {stats['searched']}")
    log.info(f"  URLs found:      {stats['found']} ({stats['found']/max(stats['searched'],1)*100:.1f}%)")
    log.info(f"  No URL found:    {stats['skipped']}")
    log.info(f"  Errors:          {stats['errors']}")
    
    estimated_cost = stats["searched"] / 1000 * 5  # $5 per 1,000 requests
    log.info(f"  Estimated cost:  ${estimated_cost:.2f}")
    log.info(f"\nResults logged to: {RESULTS_LOG_FILE}")
    log.info(f"Checkpoint saved to: {CHECKPOINT_FILE}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Enrich IV clinic listings with website URLs via Brave Search")
    parser.add_argument("--confirmed-only", action="store_true",
                        help="Only enrich confirmed IV clinics (is_iv_clinic=true)")
    parser.add_argument("--batch-size", type=int, default=100,
                        help="Number of clinics to fetch per batch (default: 100)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Search but don't update Supabase")
    parser.add_argument("--start-from", type=int, default=0,
                        help="Resume from a specific offset")
    args = parser.parse_args()

    validate_env()

    log.info("=" * 60)
    log.info("IVHealthClinics — Brave Search URL Enrichment")
    log.info("=" * 60)

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    enrich_clinics(
        supabase=supabase,
        confirmed_only=args.confirmed_only,
        batch_size=args.batch_size,
        dry_run=args.dry_run,
        start_from=args.start_from,
    )


if __name__ == "__main__":
    main()
