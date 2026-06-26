import type { Metadata } from 'next'

export function generateMetadata(): Metadata {
  return {
    title: 'Terms of Service | IVHealthClinics',
    description:
      'Terms of Service for IVHealthClinics, operated by Ten After Ten Group LLC.',
    alternates: { canonical: '/terms' },
  }
}

const sections = [
  {
    title: 'What we are',
    body: 'IVHealthClinics is an independent directory of IV hydration and wellness clinics. We are not a medical provider, do not administer treatment, and do not book appointments on behalf of any clinic. We don\'t endorse or guarantee the quality of any listed clinic.',
  },
  {
    title: 'Not medical advice',
    body: 'Content on this Site, including guide articles and clinic listings, is for general informational purposes only and is not a substitute for professional medical advice. Always consult a qualified healthcare provider regarding any treatment.',
  },
  {
    title: 'Accuracy of information',
    body: 'Clinic information is gathered from public records, clinic websites, and direct submissions from clinic owners. We make reasonable efforts to keep listings current but can\'t guarantee accuracy or completeness. Always confirm pricing, services, and credentials directly with the clinic before booking.',
  },
  {
    title: 'Claiming a listing',
    body: 'Clinic owners may claim and update their own listing through our claim process. By submitting a claim, you confirm you\'re authorized to represent the clinic and that the information you provide is accurate. We reserve the right to review, reject, or remove claimed content that appears false or misleading.',
  },
  {
    title: 'Acceptable use',
    body: 'You agree not to scrape, copy, or republish Site data in bulk, misuse the contact or claim forms, or use the Site for any unlawful purpose.',
  },
  {
    title: 'Intellectual property',
    body: 'The Site\'s design, original written content, and compiled data are owned by Ten After Ten Group LLC. Clinic names and trademarks belong to their respective owners.',
  },
  {
    title: 'Third-party links',
    body: 'The Site may link to clinic websites or other third-party resources. We aren\'t responsible for the content or practices of sites we don\'t operate.',
  },
  {
    title: 'Disclaimer of warranties',
    body: 'The Site is provided "as is" without warranties of any kind, express or implied.',
  },
  {
    title: 'Limitation of liability',
    body: 'To the fullest extent permitted by law, Ten After Ten Group LLC isn\'t liable for any damages arising from your use of the Site or reliance on information found on it.',
  },
  {
    title: 'Governing law',
    body: 'These terms are governed by the laws of the State of Florida.',
  },
  {
    title: 'Changes to these terms',
    body: 'We may update these terms periodically; continued use of the Site after changes constitutes acceptance.',
  },
  {
    title: 'Contact',
    body: 'Questions about these terms: info@ivhealthclinics.com',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50">
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Terms of Service</h1>
          <p className="mt-4 text-xl text-emerald-100">Last updated: June 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <p className="text-gray-700 text-lg leading-relaxed">
            By using ivhealthclinics.com (the &quot;Site&quot;), operated by Ten After Ten Group LLC,
            you agree to these terms.
          </p>
        </section>

        {sections.map((section) => (
          <section key={section.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
            <p className="text-gray-700 leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
