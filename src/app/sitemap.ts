import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://ivhealthclinics.com'

const SERVICE_TYPES = [
  'hydration',
  'vitamin-drips',
  'nad-plus',
  'athletic-recovery',
  'hangover-relief',
  'immune-support',
  'beauty-anti-aging',
  'weight-loss',
  'migraine-relief',
  'b12-shots',
  'glutathione',
]

const US_STATES = [
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga',
  'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md',
  'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj',
  'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc',
  'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy', 'dc',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // ── Static pages ──────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/locations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/compare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/guides`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  // ── State pages (/locations/[state]) ──────────────────────────
  const statePages: MetadataRoute.Sitemap = US_STATES.map((state) => ({
    url: `${BASE_URL}/locations/${state}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── Mobile IV state pages (/mobile-iv/[state]) ────────────────
  const mobileIVPages: MetadataRoute.Sitemap = US_STATES.map((state) => ({
    url: `${BASE_URL}/mobile-iv/${state}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // ── Service type pages (/services/[service]) ──────────────────
  const servicePages: MetadataRoute.Sitemap = SERVICE_TYPES.map((service) => ({
    url: `${BASE_URL}/services/${service}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── Service + state combo pages (/services/[service]/[state]) ─
  const serviceStatePages: MetadataRoute.Sitemap = SERVICE_TYPES.flatMap((service) =>
    US_STATES.map((state) => ({
      url: `${BASE_URL}/services/${service}/${state}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  )

  // ── Guide pages (/guides/[slug]) ──────────────────────────────
  const guidePages: MetadataRoute.Sitemap = [
    'iv-therapy-cost',
    'types-of-iv-drips',
    'mobile-vs-clinic-iv',
    'first-iv-therapy-session',
    'how-to-find-iv-clinic',
  ].map((slug) => ({
    url: `${BASE_URL}/guides/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // ── City pages (from DB) ──────────────────────────────────────
  const { data: cityData } = await supabase
    .from('clinics')
    .select('city, state')
    .not('city', 'is', null)
    .not('state', 'is', null)

  const uniqueCities = new Map<string, { city: string; state: string }>()
  for (const row of cityData ?? []) {
    const key = `${row.state}-${row.city}`
    if (!uniqueCities.has(key)) {
      uniqueCities.set(key, row)
    }
  }

  const cityPages: MetadataRoute.Sitemap = Array.from(uniqueCities.values()).map(
    ({ city, state }) => {
      const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const stateSlug = state.toLowerCase()
      return {
        url: `${BASE_URL}/locations/${stateSlug}/${citySlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }
    }
  )

  // ── Clinic profile pages (from DB) ────────────────────────────
  const { data: clinicData } = await supabase
    .from('clinics')
    .select('slug, updated_at')
    .not('slug', 'is', null)

  const clinicPages: MetadataRoute.Sitemap = (clinicData ?? []).map(({ slug, updated_at }) => ({
    url: `${BASE_URL}/clinics/${slug}`,
    lastModified: updated_at ? new Date(updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...statePages,
    ...mobileIVPages,
    ...servicePages,
    ...serviceStatePages,
    ...guidePages,
    ...cityPages,
    ...clinicPages,
  ]
}
