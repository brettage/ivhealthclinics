import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import { getFeaturedClinics, getClinicCount } from '@/app/actions/clinics'
import ClinicCard from '@/components/ClinicCard'

export default async function HomePage() {
  const [clinics, clinicCount] = await Promise.all([
    getFeaturedClinics(6),
    getClinicCount(),
  ])

  const serviceTypes = [
    { name: 'IV Hydration', slug: 'hydration', icon: '💧', desc: 'Rehydrate and restore with saline & electrolytes' },
    { name: 'Vitamin Drips', slug: 'vitamin-drips', icon: '🍊', desc: 'Myers\' cocktail, vitamin C, B-complex blends' },
    { name: 'NAD+ Therapy', slug: 'nad-plus', icon: '⚡', desc: 'Cellular repair and anti-aging NAD+ infusions' },
    { name: 'Athletic Recovery', slug: 'athletic-recovery', icon: '🏃', desc: 'Post-workout recovery and performance drips' },
    { name: 'Immune Support', slug: 'immune-support', icon: '🛡️', desc: 'High-dose vitamin C and zinc immune blends' },
    { name: 'Hangover Relief', slug: 'hangover-relief', icon: '🌅', desc: 'Fast relief with fluids, vitamins, and anti-nausea' },
  ]

  const topCities = [
    { name: 'Miami', state: 'FL', slug: 'fl/miami' },
    { name: 'Los Angeles', state: 'CA', slug: 'ca/los-angeles' },
    { name: 'New York', state: 'NY', slug: 'ny/new-york' },
    { name: 'Las Vegas', state: 'NV', slug: 'nv/las-vegas' },
    { name: 'Houston', state: 'TX', slug: 'tx/houston' },
    { name: 'Scottsdale', state: 'AZ', slug: 'az/scottsdale' },
    { name: 'Austin', state: 'TX', slug: 'tx/austin' },
    { name: 'Nashville', state: 'TN', slug: 'tn/nashville' },
    { name: 'Denver', state: 'CO', slug: 'co/denver' },
    { name: 'Atlanta', state: 'GA', slug: 'ga/atlanta' },
    { name: 'Dallas', state: 'TX', slug: 'tx/dallas' },
    { name: 'San Diego', state: 'CA', slug: 'ca/san-diego' },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Find Your IV Therapy Clinic
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Compare pricing, services, and credentials for IV hydration, vitamin drips, and NAD+ therapy clinics near you.
          </p>

          <div className="mt-8">
            <SearchBar />
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{clinicCount > 0 ? clinicCount.toLocaleString() : '—'}</p>
              <p className="text-sm text-white/60">Clinics Listed</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">50</p>
              <p className="text-sm text-white/60">States Covered</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">11+</p>
              <p className="text-sm text-white/60">Service Types</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Types */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Browse by Service Type</h2>
          <p className="mt-2 text-gray-500">Find clinics that offer exactly what you need</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceTypes.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group flex items-start gap-4 p-5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
            >
              <span className="text-3xl">{service.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{service.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link href="/services" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            View all service types →
          </Link>
        </div>
      </section>

      {/* Featured Clinics */}
      {clinics.length > 0 && (
        <section className="bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Featured Clinics</h2>
              <p className="mt-2 text-gray-500">Top-rated IV therapy providers across the country</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/search"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-sm hover:shadow-md"
              >
                Browse All Clinics
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
              Find clinics by location, service type, mobile availability, or price range.
            </p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-cyan-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Compare Side-by-Side</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
              Compare pricing, services, credentials, and safety information across clinics.
            </p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Book Your Session</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
              Contact your chosen clinic directly or request a consultation through our platform.
            </p>
          </div>
        </div>
      </section>

      {/* Why IVHealthClinics */}
      <section className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">Why IVHealthClinics?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Transparent Pricing</h3>
              <p className="mt-2 text-sm text-white/70">
                See per-infusion pricing, membership costs, and what&apos;s included — no surprises.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Safety First</h3>
              <p className="mt-2 text-sm text-white/70">
                We surface credentials, supervision levels, and sterile compounding status so you can choose confidently.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-2.25h7.5m-7.5 0v2.25m0-2.25H7.5" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Mobile & In-Clinic</h3>
              <p className="mt-2 text-sm text-white/70">
                Filter by mobile IV services that come to you or find the best brick-and-mortar clinics nearby.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Cities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Popular Cities</h2>
          <p className="mt-2 text-gray-500">Find IV therapy clinics in top metro areas</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {topCities.map((city) => (
            <Link
              key={city.slug}
              href={`/locations/${city.slug}`}
              className="group text-center p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">{city.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{city.state}</p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link href="/locations" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            View all states →
          </Link>
        </div>
      </section>
    </div>
  )
}
