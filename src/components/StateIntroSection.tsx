import type { StateIntro } from '@/lib/seo-content/states'

/**
 * Renders the structured SEO intro for a state page.
 *
 * Layout: lead paragraph followed by 2–3 H2 sections. Designed to provide
 * unique, scannable content above the city grid so the page has substance
 * for Google to index beyond just the H1 + city links.
 *
 * Returns null if no intro is provided — the calling page falls back to
 * its generic description in that case.
 */
export default function StateIntroSection({ intro }: { intro: StateIntro | null }) {
  if (!intro) return null

  return (
    <section className="mt-6 mb-10 max-w-3xl">
      <p className="text-gray-700 leading-relaxed">{intro.lead}</p>

      <div className="mt-8 space-y-6">
        {intro.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {section.heading}
            </h2>
            <p className="text-gray-700 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
