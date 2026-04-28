import Link from 'next/link'
import type { Guide, GuideBlock, GuideLink } from '@/lib/seo-content/guides'

/**
 * Renders a guide article from a Guide content object.
 *
 * Layout: title → meta (date + reading time) → table of contents → lead →
 * sections (each H2 + body blocks). Internal links from the content render
 * as Next.js <Link> components for client-side routing.
 *
 * Designed for a single typography pass that works for all guides — change
 * styling here and every guide updates uniformly.
 */
export default function GuideArticle({ guide }: { guide: Guide }) {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
          {guide.title}
        </h1>
        <p className="mt-3 text-lg text-gray-500">{guide.description}</p>
        <div className="mt-4 flex items-center gap-3 text-sm text-gray-400">
          <time dateTime={guide.updatedAt}>
            Updated {formatDate(guide.updatedAt)}
          </time>
          <span>•</span>
          <span>{guide.readingMinutes} min read</span>
        </div>
      </header>

      {/* Table of contents */}
      {guide.sections.length > 3 && (
        <nav
          aria-label="Table of contents"
          className="mb-10 p-5 rounded-xl bg-emerald-50/50 border border-emerald-100"
        >
          <p className="text-sm font-semibold text-emerald-900 mb-2">In this guide</p>
          <ol className="space-y-1.5 text-sm">
            {guide.sections.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-emerald-700 hover:text-emerald-900 hover:underline"
                >
                  {i + 1}. {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Lead paragraph */}
      <p className="text-lg text-gray-700 leading-relaxed mb-10">{guide.lead}</p>

      {/* Sections */}
      <div className="space-y-10">
        {guide.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
              {section.heading}
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              {section.blocks.map((block, i) => (
                <BlockRenderer key={i} block={block} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer CTA */}
      <footer className="mt-16 pt-8 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Ready to find a clinic?
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Browse nearly 3,000 verified IV therapy clinics nationwide.
            </p>
          </div>
          <Link
            href="/clinics"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
          >
            Browse the directory →
          </Link>
        </div>
      </footer>
    </article>
  )
}

function BlockRenderer({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'p':
      return <p>{block.text.map((part, i) => <InlineText key={i} part={part} />)}</p>
    case 'ul':
      return (
        <ul className="list-disc list-outside ml-6 space-y-2">
          {block.items.map((parts, i) => (
            <li key={i}>
              {parts.map((part, j) => <InlineText key={j} part={part} />)}
            </li>
          ))}
        </ul>
      )
    case 'callout':
      return (
        <aside className="my-2 p-4 rounded-lg bg-cyan-50 border-l-4 border-cyan-400">
          <p className="text-sm font-semibold text-cyan-900 mb-1">{block.title}</p>
          <p className="text-sm text-cyan-800">{block.text}</p>
        </aside>
      )
  }
}

function InlineText({ part }: { part: string | GuideLink }) {
  if (typeof part === 'string') return <>{part}</>
  return (
    <Link
      href={part.href}
      className="text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-700"
    >
      {part.text}
    </Link>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
