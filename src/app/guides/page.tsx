import Link from 'next/link'
import { getAllGuides } from '@/lib/seo-content/guides'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IV Therapy Guides | IV Health Clinics',
  description:
    'Educational guides on IV therapy — how much it costs, types of IV drips, mobile vs. clinic-based IV, and more. Written to help you compare providers and make informed decisions.',
  alternates: { canonical: '/guides' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function GuidesIndexPage() {
  const guides = getAllGuides()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 mb-2 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">IV Therapy Guides</h1>
        <p className="mt-2 text-gray-500 max-w-2xl">
          Practical guides to help you understand IV therapy options, compare providers, and make informed decisions.
          All content is educational — not medical advice. For a specific health concern, consult a licensed provider.
        </p>
      </div>

      <div className="mb-10 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-sm text-gray-600 leading-relaxed">
          Looking for a clinic rather than an article?{' '}
          <Link href="/clinics" className="text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-700">
            Browse all IV therapy clinics
          </Link>
          {', '}
          <Link href="/services" className="text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-700">
            search by service type
          </Link>
          {', or find '}
          <Link href="/mobile-iv" className="text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-700">
            mobile IV providers near you
          </Link>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="group flex flex-col p-6 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors leading-snug">
              {guide.title}
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">
              {guide.description}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <time dateTime={guide.updatedAt}>{formatDate(guide.updatedAt)}</time>
                <span>·</span>
                <span>{guide.readingMinutes} min read</span>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                Read
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
