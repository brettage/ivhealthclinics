#!/usr/bin/env python3
"""
IVHealthClinics — Review Brave Search Results
==============================================
Reads brave_enrich_results.jsonl and outputs a simple CSV
for manual review. After reviewing, you can clear bad URLs.

Usage:
  # Step 1: Generate review CSV
  python scripts/review_brave_results.py --export

  # Step 2: Open brave_review.csv, mark bad URLs by putting "bad" in the status column

  # Step 3: Clear bad URLs from Supabase
  python scripts/review_brave_results.py --clear-bad
"""

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

RESULTS_FILE = "brave_enrich_results.jsonl"
REVIEW_FILE = "brave_review.csv"


def export_review():
    """Export found URLs to CSV for review."""
    if not os.path.exists(RESULTS_FILE):
        print(f"No results file found: {RESULTS_FILE}")
        sys.exit(1)

    rows = []
    with open(RESULTS_FILE, "r") as f:
        for line in f:
            entry = json.loads(line.strip())
            if entry.get("url_found"):
                rows.append({
                    "clinic_id": entry["clinic_id"],
                    "clinic_name": entry["clinic_name"],
                    "url_found": entry["url_found"],
                    "status": "",  # Fill in "bad" for wrong URLs
                })

    with open(REVIEW_FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["clinic_id", "clinic_name", "url_found", "status"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Exported {len(rows)} URLs to {REVIEW_FILE}")
    print(f"Open in Excel/Sheets, put 'bad' in the status column for wrong URLs, then run:")
    print(f"  python scripts/review_brave_results.py --clear-bad")


def clear_bad():
    """Read review CSV and clear URLs marked as 'bad' from Supabase."""
    if not os.path.exists(REVIEW_FILE):
        print(f"No review file found: {REVIEW_FILE}")
        print(f"Run --export first.")
        sys.exit(1)

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    bad_ids = []
    with open(REVIEW_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("status", "").strip().lower() == "bad":
                bad_ids.append((row["clinic_id"], row["clinic_name"], row["url_found"]))

    if not bad_ids:
        print("No URLs marked as 'bad'. Nothing to clear.")
        return

    print(f"Clearing {len(bad_ids)} bad URLs from Supabase:")
    cleared = 0
    for clinic_id, name, url in bad_ids:
        try:
            supabase.table("clinics").update({
                "website": None,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", clinic_id).execute()
            print(f"  ✅ Cleared: {name} (was: {url})")
            cleared += 1
        except Exception as e:
            print(f"  ❌ Failed: {name} — {e}")

    print(f"\nDone. Cleared {cleared}/{len(bad_ids)} bad URLs.")


def main():
    parser = argparse.ArgumentParser(description="Review Brave Search enrichment results")
    parser.add_argument("--export", action="store_true", help="Export found URLs to CSV for review")
    parser.add_argument("--clear-bad", action="store_true", help="Clear URLs marked 'bad' in CSV from Supabase")
    args = parser.parse_args()

    if args.export:
        export_review()
    elif args.clear_bad:
        clear_bad()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
