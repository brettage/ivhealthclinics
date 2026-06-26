import Link from 'next/link'
import type { Metadata } from 'next'
import ContactForm from './ContactForm'

export function generateMetadata(): Metadata {
  return {
    title: 'Contact IVHealthClinics | Questions, Corrections, and Clinic Updates',
    description:
      'Contact IVHealthClinics with listing questions, corrections, clinic owner requests, or general feedback.',
    alternates: { canonical: '/contact' },
  }
}

const faqItems = [
  {
    q: 'Is IVHealthClinics a medical provider?',
    a: 'No. We\'re an independent directory. We don\'t provide IV therapy, schedule appointments, or offer medical advice — we help you compare clinics so you can make an informed choice.',
  },
  {
    q: 'How do you verify clinic information?',
    a: 'Listings are built from public business records and information gathered from each clinic\'s own website. Clinics can also claim their listing to confirm or update details directly.',
  },
  {
    q: 'Is IV therapy safe?',
    a: 'IV hydration and vitamin therapy carry the same general risks as any medical infusion. Safety depends heavily on who\'s administering it and how. Always check a clinic\'s medical supervision level and ask about their safety practices before booking.',
  },
  {
    q: 'Do clinics pay to be listed or ranked higher?',
    a: 'No. Listing on IVHealthClinics is free, and we don\'t accept payment for placement in search results or comparisons.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c'),
        }}
      />

      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Get in Touch</h1>
          <p className="mt-4 text-xl text-emerald-100 max-w-3xl">
            Whether you have a question about a listing, found something that needs correcting, or
            you&apos;re a clinic owner who wants to claim or update your profile, we&apos;d like to
            hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              <strong className="text-gray-900">General questions or feedback:</strong>{' '}
              <a
                href="mailto:info@ivhealthclinics.com"
                className="text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-700"
              >
                info@ivhealthclinics.com
              </a>
            </p>
            <p>
              <strong className="text-gray-900">Clinic owners:</strong> Visit{' '}
              <Link
                href="/claim"
                className="text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-700"
              >
                Claim Your Listing
              </Link>{' '}
              to verify ownership and update your clinic&apos;s information directly.
            </p>
            <p>
              <strong className="text-gray-900">Found incorrect information?</strong> Email us the
              clinic name and what needs to be corrected — we review every report.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h2>
          <ContactForm />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqItems.map((item) => (
              <div key={item.q} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
