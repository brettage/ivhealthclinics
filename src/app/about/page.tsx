import type { Metadata } from 'next'

export function generateMetadata(): Metadata {
  return {
    title: 'About IVHealthClinics | Compare IV Therapy Clinics',
    description:
      'Learn how IVHealthClinics helps people compare IV hydration and wellness clinics by pricing, mobile availability, medical supervision, and safety disclosures.',
    alternates: { canonical: '/about' },
  }
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50">
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">About IVHealthClinics</h1>
          <p className="mt-4 text-xl text-emerald-100 max-w-3xl">
            A comparison-first directory for IV hydration, vitamin drip, and wellness clinics.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <p className="text-gray-700 text-lg leading-relaxed">
            IVHealthClinics is a directory built to make IV hydration and wellness clinics easy
            to compare — not just find. Most directories list a name, an address, and a phone
            number. We go further: per-drip pricing where it&apos;s disclosed, whether a clinic offers
            mobile service or in-clinic visits (or both), the level of medical supervision (MD, NP,
            or RN), and safety practices like sterile compounding and ingredient sourcing.
          </p>
          <p className="mt-4 text-gray-700 text-lg leading-relaxed">
            Our goal is to give you the information you&apos;d actually want before booking an IV
            session, not just a place to find one.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How we build our data</h2>
          <p className="text-gray-700 leading-relaxed">
            Clinic listings start from public business and licensing records, then get supplemented
            with information gathered directly from clinic websites — service menus, pricing,
            supervision details, and safety disclosures. Every clinic can claim its own listing to
            verify, correct, or expand its information directly.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">We&apos;re neutral</h2>
          <p className="text-gray-700 leading-relaxed">
            IVHealthClinics doesn&apos;t accept payment to rank a clinic higher in search results or
            comparisons. Our listings reflect the data we have, not who paid for placement.
          </p>
        </section>

        <section className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <h2 className="text-xl font-semibold text-amber-900 mb-3">A note on medical information</h2>
          <p className="text-amber-800 text-sm leading-relaxed">
            IVHealthClinics is a directory, not a medical provider. The information on this site is
            for general informational purposes and isn&apos;t medical advice. IV hydration and vitamin
            therapy should be administered by qualified medical professionals — always verify a
            clinic&apos;s credentials and consult a licensed physician before starting any treatment,
            especially if you have underlying health conditions.
          </p>
        </section>

        <section className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <p className="text-gray-700 leading-relaxed">
            IVHealthClinics is operated by <strong>Ten After Ten Group LLC</strong>, which also
            operates HormoneMap, a directory for TRT clinics. Questions, corrections, or feedback:{' '}
            <a
              href="mailto:info@ivhealthclinics.com"
              className="text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-700"
            >
              info@ivhealthclinics.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
