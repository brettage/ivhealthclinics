import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | IVHealthClinics',
  description:
    'Privacy Policy for IVHealthClinics, operated by Ten After Ten Group LLC.',
  alternates: { canonical: '/privacy' },
}

const sections = [
  {
    title: 'Information we collect',
    body: 'When you submit a contact form, claim request, or consultation inquiry, we collect what you provide — typically name, email, phone number, and message content. We also collect standard analytics data (pages visited, general location, device/browser type) through Google Analytics.',
  },
  {
    title: 'Clinic data',
    body: 'Information about clinics listed on this site comes from public business records, clinic websites, and direct submissions from clinic owners through our claim process. This is business information, not personal data about site visitors.',
  },
  {
    title: 'How we use information',
    body: 'We use submitted information to respond to inquiries, route claim/consultation requests to the relevant clinic, and improve the site. We use analytics data in aggregate to understand site usage.',
  },
  {
    title: 'Third parties we use',
    body: 'Supabase (database hosting), Vercel (website hosting), Resend (transactional email delivery), and Google Analytics (usage analytics). These providers process data on our behalf and don\'t use it for their own purposes.',
  },
  {
    title: 'We don\'t sell your information',
    body: 'If you submit an inquiry naming a specific clinic, we may share your contact information with that clinic so they can respond to you. Otherwise, we don\'t sell or rent personal information to third parties.',
  },
  {
    title: 'Cookies',
    body: 'This site uses cookies for analytics purposes via Google Analytics. You can disable cookies in your browser settings, though this may affect site functionality.',
  },
  {
    title: 'Your choices',
    body: 'You can request access to or deletion of information you\'ve submitted by emailing info@ivhealthclinics.com.',
  },
  {
    title: 'Children\'s privacy',
    body: 'This site isn\'t directed at children under 13, and we don\'t knowingly collect information from them.',
  },
  {
    title: 'Changes to this policy',
    body: 'We may update this policy periodically. Material changes will be reflected by updating the "last updated" date above.',
  },
  {
    title: 'Contact',
    body: 'Questions about this policy: info@ivhealthclinics.com',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50">
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-xl text-emerald-100">Last updated: June 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <p className="text-gray-700 text-lg leading-relaxed">
            Ten After Ten Group LLC (&quot;IVHealthClinics,&quot; &quot;we,&quot; &quot;us&quot;)
            operates ivhealthclinics.com. This policy explains what information we collect and how
            we use it.
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
