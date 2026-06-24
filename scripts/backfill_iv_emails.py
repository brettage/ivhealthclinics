#!/usr/bin/env python3
"""
backfill_iv_emails.py

One-time email backfill for IVHealthClinics.

Finds visible-directory IV clinics with a website and no email, fetches raw HTML
from the stored website URL plus /contact and /contact-us on the same origin,
extracts email addresses with regex, filters obvious junk/placeholders, and
writes the best candidate directly to clinics.email.

No Claude/LLM calls are made.

Usage:
  python scripts/backfill_iv_emails.py --dry-run
  python scripts/backfill_iv_emails.py --limit 25 --dry-run
  python scripts/backfill_iv_emails.py --yes

Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

import argparse
import asyncio
import html
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from supabase import create_client


load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("ERROR: Missing env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
    sys.exit(1)

CHECKPOINT_PATH = Path(__file__).parent / 'backfill_iv_emails_checkpoint.json'
CHECKPOINT_EVERY = 10
CONCURRENCY = 3
REQUEST_DELAY_SEC = 1.0
REQUEST_TIMEOUT_SEC = 20

EMAIL_RE = re.compile(
    r'(?<![A-Z0-9._%+-])([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})(?![A-Z0-9._%+-])',
    re.IGNORECASE,
)
MAILTO_RE = re.compile(r'href=["\']\s*mailto:([^"\'?#>\s]+)', re.IGNORECASE)

JUNK_PREFIXES = (
    'noreply@',
    'no-reply@',
    'donotreply@',
    'do-not-reply@',
    'webmaster@',
)

JUNK_DOMAIN_PARTS = (
    'sentry.io',
    'wixpress.com',
    'godaddy.com',
    'secureserver.net',
    'domainsbyproxy.com',
)

PLACEHOLDER_DOMAINS = {
    'example.com',
    'example.net',
    'example.org',
    'example.co',
    'yourdomain.com',
    'yourdomain.net',
    'yourdomain.org',
    'domain.com',
    'domain.net',
    'domain.org',
    'placeholder.com',
    'template.com',
    'test.com',
    'test.net',
    'test.org',
    'localhost.com',
}

NON_EMAIL_FILE_EXTENSIONS = {
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'svg',
    'ico',
    'bmp',
    'css',
    'js',
    'woff',
    'woff2',
    'ttf',
    'eot',
    'pdf',
    'mp4',
    'webm',
}


def load_checkpoint() -> dict:
    if not CHECKPOINT_PATH.exists():
        return {
            'processed_ids': [],
            'emails_found': 0,
            'filtered_candidates': 0,
            'updated_at': None,
        }
    with open(CHECKPOINT_PATH) as f:
        return json.load(f)


def save_checkpoint(checkpoint: dict):
    checkpoint['updated_at'] = datetime.now(timezone.utc).isoformat()
    tmp = CHECKPOINT_PATH.with_suffix('.tmp')
    with open(tmp, 'w') as f:
        json.dump(checkpoint, f, indent=2, sort_keys=True)
    tmp.replace(CHECKPOINT_PATH)


def normalize_url(url: str) -> str | None:
    url = (url or '').strip()
    if not url:
        return None
    if not re.match(r'^https?://', url, re.IGNORECASE):
        url = 'https://' + url
    parsed = urlparse(url)
    if not parsed.netloc:
        return None
    return urlunparse((parsed.scheme or 'https', parsed.netloc, parsed.path or '/', '', '', ''))


def website_root(url: str) -> str | None:
    normalized = normalize_url(url)
    if not normalized:
        return None
    parsed = urlparse(normalized)
    return urlunparse((parsed.scheme, parsed.netloc, '/', '', '', ''))


def candidate_urls(website: str) -> list[str]:
    homepage = normalize_url(website)
    root = website_root(website)
    urls = []
    if homepage:
        urls.append(homepage)
    if root:
        urls.extend([urljoin(root, '/contact'), urljoin(root, '/contact-us')])
    seen = set()
    unique = []
    for url in urls:
        key = url.rstrip('/')
        if key not in seen:
            seen.add(key)
            unique.append(url)
    return unique


def base_domain(url: str) -> str:
    parsed = urlparse(normalize_url(url) or '')
    host = parsed.netloc.lower().split('@')[-1].split(':')[0]
    if host.startswith('www.'):
        host = host[4:]
    parts = [p for p in host.split('.') if p]
    if len(parts) >= 2:
        return '.'.join(parts[-2:])
    return host


def clean_email(raw: str) -> str:
    decoded = html.unescape(unquote(raw or '')).strip()
    decoded = decoded.split('?')[0].split('&')[0]
    decoded = decoded.strip(' \t\r\n<>()[]{}.,;:"\'')
    return decoded.lower()


def is_placeholder_domain(domain: str) -> bool:
    domain = domain.lower().strip('.')
    if domain in PLACEHOLDER_DOMAINS:
        return True
    return any(domain.endswith('.' + d) for d in PLACEHOLDER_DOMAINS)


def is_junk_email(email: str) -> bool:
    email = clean_email(email)
    if '@' not in email:
        return True
    local, domain = email.rsplit('@', 1)
    if not local or not domain or '..' in domain:
        return True
    if domain.rsplit('.', 1)[-1] in NON_EMAIL_FILE_EXTENSIONS:
        return True
    if any(email.startswith(prefix) for prefix in JUNK_PREFIXES):
        return True
    if any(part in domain for part in JUNK_DOMAIN_PARTS):
        return True
    if local == 'info' and domain.startswith('example.'):
        return True
    if is_placeholder_domain(domain):
        return True
    return False


def extract_email_candidates(raw_html: str) -> list[str]:
    candidates: list[str] = []
    for match in MAILTO_RE.finditer(raw_html or ''):
        candidates.append(clean_email(match.group(1)))
    decoded_html = html.unescape(raw_html or '')
    for match in EMAIL_RE.finditer(decoded_html):
        candidates.append(clean_email(match.group(1)))

    unique = []
    seen = set()
    for email in candidates:
        if email and email not in seen:
            seen.add(email)
            unique.append(email)
    return unique


def choose_best_email(candidates: Iterable[str], website: str) -> tuple[str | None, int]:
    website_domain = base_domain(website)
    valid = []
    filtered = 0
    for candidate in candidates:
        email = clean_email(candidate)
        if is_junk_email(email):
            filtered += 1
            continue
        valid.append(email)

    if not valid:
        return None, filtered

    def score(email: str) -> tuple[int, int]:
        domain = email.rsplit('@', 1)[1]
        domain_score = 1 if website_domain and (domain == website_domain or domain.endswith('.' + website_domain)) else 0
        local = email.split('@', 1)[0]
        role_score = 1 if local in {'info', 'hello', 'contact', 'office', 'admin', 'support'} else 0
        return (domain_score, role_score)

    return sorted(valid, key=score, reverse=True)[0], filtered


def fetch_raw_html_sync(url: str) -> tuple[str, str | None, int | None]:
    request = Request(
        url,
        headers={
            'User-Agent': 'IVHealthClinics email backfill (+https://ivhealthclinics.com)',
            'Accept': 'text/html,application/xhtml+xml',
        },
    )
    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_SEC) as response:
            content_type = response.headers.get('content-type', '')
            status = getattr(response, 'status', None)
            if status and status >= 400:
                return '', f'http_{status}', status
            if 'text/html' not in content_type and 'application/xhtml+xml' not in content_type:
                return '', f'non_html:{content_type[:60]}', status
            raw = response.read(2_000_000)
            charset = response.headers.get_content_charset() or 'utf-8'
            return raw.decode(charset, errors='replace'), None, status
    except HTTPError as e:
        return '', f'http_{e.code}', e.code
    except URLError as e:
        return '', str(e.reason)[:120], None
    except Exception as e:
        return '', str(e)[:120], None


class RateLimiter:
    def __init__(self, delay_sec: float):
        self.delay_sec = delay_sec
        self._lock = asyncio.Lock()
        self._last_request = 0.0

    async def wait(self):
        async with self._lock:
            now = time.monotonic()
            wait_for = self.delay_sec - (now - self._last_request)
            if wait_for > 0:
                await asyncio.sleep(wait_for)
            self._last_request = time.monotonic()


async def fetch_url(url: str, limiter: RateLimiter, semaphore: asyncio.Semaphore) -> tuple[str, str, str | None]:
    async with semaphore:
        await limiter.wait()
        raw_html, error, _status = await asyncio.to_thread(fetch_raw_html_sync, url)
        return url, raw_html, error


async def fetch_clinic_pages(website: str) -> list[tuple[str, str, str | None]]:
    limiter = RateLimiter(REQUEST_DELAY_SEC)
    semaphore = asyncio.Semaphore(CONCURRENCY)
    tasks = [fetch_url(url, limiter, semaphore) for url in candidate_urls(website)]
    return await asyncio.gather(*tasks)


def fetch_target_clinics(supabase, limit: int | None) -> list[dict]:
    page_size = 1000
    offset = 0
    rows: list[dict] = []
    while True:
        batch = (
            supabase.table('clinics')
            .select('id, name, website, email')
            .not_.is_('website', 'null')
            .is_('email', 'null')
            .eq('is_iv_clinic', True)
            .eq('enrichment_status', 'enriched')
            .is_('duplicate_of', 'null')
            .range(offset, offset + page_size - 1)
            .execute()
            .data or []
        )
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
        if limit and len(rows) >= limit:
            break
    return rows[:limit] if limit else rows


async def process_clinic(supabase, clinic: dict, dry_run: bool) -> tuple[str | None, int]:
    all_candidates: list[str] = []
    pages = await fetch_clinic_pages(clinic['website'])
    for _url, raw_html, error in pages:
        if error or not raw_html:
            continue
        all_candidates.extend(extract_email_candidates(raw_html))

    email, filtered = choose_best_email(all_candidates, clinic['website'])
    if email and not dry_run:
        (
            supabase.table('clinics')
            .update({'email': email})
            .eq('id', clinic['id'])
            .is_('email', 'null')
            .execute()
        )
    return email, filtered


async def main_async():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, help='Cap number of clinics to process')
    parser.add_argument('--dry-run', action='store_true', help='Fetch and extract but skip DB writes')
    parser.add_argument('--yes', '-y', action='store_true', help='Execute without confirmation')
    parser.add_argument('--reset-checkpoint', action='store_true', help='Ignore and replace existing checkpoint')
    args = parser.parse_args()

    if args.reset_checkpoint and CHECKPOINT_PATH.exists():
        CHECKPOINT_PATH.unlink()

    checkpoint = load_checkpoint()
    processed_ids = set(checkpoint.get('processed_ids') or [])

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    clinics = fetch_target_clinics(supabase, args.limit)
    clinics = [clinic for clinic in clinics if clinic['id'] not in processed_ids]

    print('\nEmail Backfill')
    print(f"  Remaining clinics: {len(clinics)}")
    print(f"  Dry run:           {args.dry_run}")
    print(f"  Checkpoint:        {CHECKPOINT_PATH}")

    if clinics and not args.dry_run and not args.yes:
        try:
            resp = input(f"\nWrite emails for up to {len(clinics)} clinics? [y/N]: ").strip().lower()
        except EOFError:
            resp = ''
        if resp not in ('y', 'yes'):
            print('Aborted.')
            return

    stats = {
        'processed': 0,
        'emails_found': 0,
        'filtered_candidates': 0,
        'errors': 0,
    }

    for index, clinic in enumerate(clinics, start=1):
        label = clinic.get('name') or clinic['id']
        try:
            email, filtered = await process_clinic(supabase, clinic, args.dry_run)
            stats['processed'] += 1
            stats['filtered_candidates'] += filtered
            checkpoint.setdefault('processed_ids', []).append(clinic['id'])
            if email:
                stats['emails_found'] += 1
                checkpoint['emails_found'] = int(checkpoint.get('emails_found') or 0) + 1
                print(f"[{index}/{len(clinics)}] {label[:48]:<48} -> {email}")
            else:
                print(f"[{index}/{len(clinics)}] {label[:48]:<48} -> no email")
        except Exception as e:
            stats['errors'] += 1
            print(f"[{index}/{len(clinics)}] {label[:48]:<48} -> error: {str(e)[:100]}")

        checkpoint['filtered_candidates'] = int(checkpoint.get('filtered_candidates') or 0) + filtered
        if stats['processed'] % CHECKPOINT_EVERY == 0:
            save_checkpoint(checkpoint)
            print(f"  checkpoint saved after {stats['processed']} processed")

    save_checkpoint(checkpoint)

    print('\n========== FINAL ==========')
    print(f"Total processed:             {stats['processed']}")
    print(f"Total emails found:          {stats['emails_found']}")
    print(f"Total placeholder-filtered:  {stats['filtered_candidates']}")
    print(f"Errors:                      {stats['errors']}")
    if args.dry_run:
        print('(dry run - no rows were written)')


def main():
    asyncio.run(main_async())


if __name__ == '__main__':
    main()
