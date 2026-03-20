# Quick Start Guide — IVHealthClinics

Get IVHealthClinics running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A code editor (PyCharm recommended)

## Step 1: Clone & Install (1 min)

```bash
cd ivhealthclinics
npm install
```

## Step 2: Set Up Supabase (2 min)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (separate from HormoneMap)
3. Wait for it to initialize (~2 minutes)
4. Go to **SQL Editor** in the left sidebar
5. Copy the contents of `supabase/schema.sql`
6. Paste and click **Run**
7. Copy the contents of `supabase/seed.sql`
8. Paste and click **Run**

## Step 3: Configure Environment (1 min)

1. Go to **Settings** → **API** in Supabase
2. Copy your **Project URL**, **anon public** key, and **service_role** key
3. Create `.env.local` in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
RESEND_API_KEY=your-resend-api-key-here
```

> ⚠️ **Anon key vs Service Role key**: The anon key is for read operations. The service role key (long JWT, ~200 chars) is required for write operations like inserting leads. Without it, form submissions will silently fail.

> ⚠️ **Python scripts** use slightly different variable names — see Python Scripts section below.

## Step 4: Run Development Server (1 min)

```bash
npm run dev
```

Visit http://localhost:3000

## You Should See

✅ Homepage with hero section
✅ Clinic listings in the grid
✅ Search bar and quick filters
✅ Navigation header

## Deploy to Production

```bash
git add .
git commit -m "Your message"
git push
# Vercel auto-deploys on push to main
```

Make sure these env vars are set in Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `RESEND_API_KEY`

---

## Python Scripts Setup

### Install dependencies
```bash
pip install python-dotenv crawl4ai supabase anthropic --break-system-packages
```

### env var names for Python scripts
```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### dotenv pattern — add to top of every new Python script
```python
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(Path(__file__).parent.parent / '.env.local')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
```

---

## Common Issues

### "Module not found" errors
```bash
rm -rf .next
npm run dev
```

### Supabase writes silently failing / RLS errors
Use `createServiceClient()` in server actions. Make sure `SUPABASE_SERVICE_KEY` is set.

### Forms not submitting
- Check browser console for errors
- Verify `SUPABASE_SERVICE_KEY` is set (not just anon key)
- Test in private/incognito window

### No clinics showing
- Verify you ran both `schema.sql` AND `seed.sql`
- Check Supabase table editor to confirm data exists

### Vercel build failing
- Check that `tsconfig.json` `"include"` is scoped to `src/**` only
- The `scripts/` folder must be excluded

---

## Development Workflow

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Lint
git add . && git commit -m "message" && git push  # Deploy
```

## Key URLs

```
http://localhost:3000                         → Homepage
http://localhost:3000/locations               → All states
http://localhost:3000/locations/fl            → Florida cities
http://localhost:3000/locations/fl/miami      → Miami clinics
http://localhost:3000/search                  → Search page
http://localhost:3000/compare                 → Comparison tool
http://localhost:3000/services                → All IV service types
http://localhost:3000/services/nad-plus       → NAD+ IV clinics
http://localhost:3000/mobile-iv               → Mobile IV services
http://localhost:3000/guides                  → Guide articles
```

## File Structure Quick Reference

```
src/app/          → Pages and routes
src/components/   → Reusable UI components
src/lib/          → Utilities and configs
src/types/        → TypeScript types
scripts/          → Python + TypeScript data pipeline scripts
supabase/         → Database schema and seeds
```

---

**Full documentation**: See [IVHEALTHCLINICS.md](./IVHEALTHCLINICS.md)
