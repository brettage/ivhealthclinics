import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClinicBySlug, searchClinics } from '@/app/actions/clinics'
import { careSettingLabel, supervisionLabel, serviceTypeLabel, formatPriceRange } from '@/types/clinic'
import { generateClinicSchema } from '@/lib/schema-org'
import ClinicCard from '@/components/ClinicCard'
import type { Metadata } from 'next'
import ClinicBadges from '@/components/ClinicBadges'
import { stateUrl, stateCityUrl } from '@/lib/state-slugs'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const clinic = await getClinicBySlug(slug)
  if (!clinic) return { title: 'Clinic Not Found' }

  const title = `${clinic.name}${clinic.city && clinic.state ? ` in ${clinic.city}, ${clinic.state}` : ''} | IV Therapy Clinic`
  const description = clinic.description ||
    `Find IV therapy services at ${clinic.name}${clinic.city ? ` in ${clinic.city}, ${clinic.state}` : ''}. View pricing, services, credentials, and more.`

  return {
    title,
    description,
    alternates: { canonical: `/clinics/${slug}` },
    openGraph: { title, description },
  }
}

export default async function ClinicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const clinic = await getClinicBySlug(slug)
  if (!clinic) notFound()

  // Fetch nearby clinics
  let nearbyClinics: typeof clinic[] = []
  if (clinic.city && clinic.state) {
    const results = await searchClinics({ city: clinic.city, state: clinic.state, limit: 4 })
    nearbyClinics = results.filter((c: typeof clinic) => c.id !== clinic.id).slice(0, 3)
  }

  const priceDisplay = formatPriceRange(clinic.price_range_min, clinic.price_range_max)

  const schema = generateClinicSchema(clinic)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link href="/" className="hover:text-white/80">Home</Link>
            <span>/</span>
            {clinic.state && (
              <>
                <Link href={stateUrl(clinic.state) || '#'} className="hover:text-white/80">{clinic.state}</Link>
                <span>/</span>
              </>
            )}
            {clinic.city && clinic.state && (
              <>
                <Link
                  href={stateCityUrl(clinic.state, clinic.city) || '#'}
                  className="hover:text-white/80"
                >
                  {clinic.city}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-white/80 truncate">{clinic.name}</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold text-white">{clinic.name}</h1>
          {clinic.city && clinic.state && (
            <p className="mt-2 text-lg text-white/70 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
              </svg>
              {clinic.city}, {clinic.state}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {clinic.verified && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium bg-green-500/20 text-green-100 rounded-full border border-green-400/30">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verified Clinic
              </span>
            )}
            {clinic.mobile_service_available && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium bg-cyan-500/20 text-cyan-100 rounded-full border border-cyan-400/30">
                🚐 Mobile Service Available
              </span>
            )}
            {clinic.care_setting && (
              <span className="px-3 py-1 text-sm font-medium bg-white/10 text-white/80 rounded-full border border-white/20">
                {careSettingLabel(clinic.care_setting)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Clinic</h2>
              <p className="text-gray-600 leading-relaxed">
                {clinic.description ||
                  `${clinic.name} is an IV therapy provider${clinic.city ? ` located in ${clinic.city}, ${clinic.state}` : ''}. Contact them directly for more information about available services, pricing, and scheduling.`}
              </p>
            </section>

            {/* Services */}
            {clinic.service_types && clinic.service_types.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Services Offered</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clinic.service_types.map((type: string) => (
                    <div
                      key={type}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{serviceTypeLabel(type)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pricing */}
            {clinic.pricing_disclosed && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Pricing</h2>
                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                  <p className="text-2xl font-bold text-emerald-700">{priceDisplay}</p>
                  <p className="text-sm text-emerald-600 mt-1">per infusion</p>
                  {clinic.membership_available && clinic.membership_price_monthly && (
                    <p className="mt-3 text-sm text-gray-600">
                      Membership available: ${(clinic.membership_price_monthly / 100).toFixed(0)}/month
                    </p>
                  )}
                  {clinic.group_discounts && (
                    <p className="mt-1 text-sm text-gray-600">Group discounts available</p>
                  )}
                </div>
              </section>
            )}

            {/* Credentials & Safety */}
            {(clinic.supervision_level || clinic.medical_director_name || clinic.sterile_compounding !== null) && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Credentials & Safety</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clinic.supervision_level && (
                    <InfoCard label="Medical Supervision" value={supervisionLabel(clinic.supervision_level)} />
                  )}
                  {clinic.medical_director_name && (
                    <InfoCard label="Medical Director" value={clinic.medical_director_name} />
                  )}
                  {clinic.administering_credentials && clinic.administering_credentials.length > 0 && (
                    <InfoCard label="Administering Staff" value={clinic.administering_credentials.join(', ')} />
                  )}
                  {clinic.sterile_compounding !== null && (
                    <InfoCard
                      label="Sterile Compounding"
                      value={clinic.sterile_compounding ? 'Yes — 503A/503B pharmacy' : 'Not specified'}
                    />
                  )}
                  {clinic.ingredient_sourcing && (
                    <InfoCard label="Ingredient Sourcing" value={clinic.ingredient_sourcing} />
                  )}
                  {clinic.consent_form_required !== null && (
                    <InfoCard label="Consent Form" value={clinic.consent_form_required ? 'Required' : 'Not required'} />
                  )}
                </div>
              </section>
            )}

            {/* What to Expect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What to Expect</h2>
              <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-6 border border-emerald-100">
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Book Your Session', desc: 'Schedule online, by phone, or walk in (if accepted). Mobile services come to your location.' },
                    { step: '2', title: 'Health Screening', desc: 'A brief intake form and allergy screening to ensure the treatment is safe for you.' },
                    { step: '3', title: 'IV Administration', desc: 'A licensed professional inserts a small IV and your drip begins. Most sessions last 30-60 minutes.' },
                    { step: '4', title: 'Feel the Difference', desc: 'Many patients report feeling better immediately. Stay hydrated and follow any aftercare instructions.' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                {clinic.address && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <p>{clinic.address}</p>
                      {clinic.city && clinic.state && (
                        <p>{clinic.city}, {clinic.state} {clinic.zip}</p>
                      )}
                      <ClinicBadges clinic={clinic} size="md" className="mt-3" />
                    </div>
                  </div>
                )}
                {clinic.phone && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    <a href={`tel:${clinic.phone}`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      {clinic.phone}
                    </a>
                  </div>
                )}
                {clinic.website && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    <a
                      href={clinic.website.startsWith('http') ? clinic.website : `https://${clinic.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium truncate"
                    >
                      Visit Website →
                    </a>
                  </div>
                )}
                {clinic.email && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <a href={`mailto:${clinic.email}`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      {clinic.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Rating */}
              {clinic.rating_value && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold text-gray-900">{Number(clinic.rating_value).toFixed(1)}</span>
                  {clinic.rating_count && (
                    <span className="text-sm text-gray-500">({clinic.rating_count} reviews)</span>
                  )}
                </div>
              )}

              {/* NPI Numbers */}
              {clinic.clinician_npi_numbers && clinic.clinician_npi_numbers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">NPI Number{clinic.clinician_npi_numbers.length > 1 ? 's' : ''}</p>
                  <div className="flex flex-wrap gap-1">
                    {clinic.clinician_npi_numbers.map((npi: string) => (
                      <span key={npi} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded font-mono">
                        {npi}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-sm text-gray-600">
            Are you the owner of {clinic.name}?{' '}
            <Link
              href={`/claim/${clinic.slug}`}
              className="text-emerald-600 hover:text-emerald-700 font-medium underline"
            >
              Claim this listing
            </Link>
          </p>
        </div>

        {/* Nearby Clinics */}
        {nearbyClinics.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Similar Clinics in {clinic.city}
              </h2>
              {clinic.city && clinic.state && (
                <Link
                  href={`/locations/${clinic.state.toLowerCase()}/${clinic.city.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  View all →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {nearbyClinics.map((c) => (
                <ClinicCard key={c.id} clinic={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
    </>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}
