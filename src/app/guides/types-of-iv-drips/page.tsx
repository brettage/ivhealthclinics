import { notFound } from 'next/navigation'
import { getGuide } from '@/lib/seo-content/guides'
import GuideArticle from '@/components/GuideArticle'
import type { Metadata } from 'next'

const SLUG = 'types-of-iv-drips'

export async function generateMetadata(): Promise<Metadata> {
  const guide = getGuide(SLUG)
  if (!guide) return { title: 'Guide Not Found' }

  return {
    title: `${guide.title} | IV Health Clinics`,
    description: guide.description,
    alternates: { canonical: `/guides/${SLUG}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
    },
  }
}

export default function TypesOfIvDripsGuidePage() {
  const guide = getGuide(SLUG)
  if (!guide) notFound()

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: { '@type': 'Organization', name: 'IV Health Clinics' },
    publisher: {
      '@type': 'Organization',
      name: 'IV Health Clinics',
      url: 'https://ivhealthclinics.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://ivhealthclinics.com/guides/${SLUG}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <GuideArticle guide={guide} />
    </>
  )
}
