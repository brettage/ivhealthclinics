import { Metadata } from 'next'
import ClaimForm from './ClaimForm'

export const metadata: Metadata = {
  title: 'Claim Your Listing | IV Health Clinics',
  description:
    'Are you an IV therapy clinic owner? Claim your free listing on IV Health Clinics to manage your profile, add services and pricing, and connect with patients.',
  alternates: { canonical: '/claim' },
}

export default function ClaimPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Claim Your Listing</h1>
          <p className="mt-4 text-xl text-emerald-100 max-w-2xl">
            Is your IV therapy clinic listed on IV Health Clinics? Claim your free profile to add
            services, pricing, mobile availability, and connect with patients searching for care.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="lg:grid lg:grid-cols-5 lg:gap-12">
          {/* Benefits */}
          <div className="lg:col-span-2 mb-10 lg:mb-0">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Why claim your listing?</h2>
            <ul className="space-y-5">
              {[
                {
                  icon: '✅',
                  title: 'Verified Badge',
                  desc: 'Stand out with a verified clinic badge on your profile.',
                },
                {
                  icon: '💧',
                  title: 'Add Services & Pricing',
                  desc: 'List your drip menu, pricing, mobile availability, and credentials.',
                },
                {
                  icon: '📍',
                  title: 'Accurate Info',
                  desc: 'Keep your address, phone, hours, and service area current.',
                },
                {
                  icon: '📋',
                  title: 'Receive Leads',
                  desc: 'Get inquiry requests directly from patients searching in your area.',
                },
                {
                  icon: '🆓',
                  title: 'Free to Start',
                  desc: 'Basic listing claim is completely free.',
                },
              ].map(({ icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{title}</div>
                    <div className="text-sm text-gray-600">{desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Get started</h2>
              <ClaimForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
