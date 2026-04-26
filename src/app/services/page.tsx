import Link from 'next/link'
import type { Metadata } from 'next'
import { serviceTypeSlug, serviceTypeLabel } from '@/types/clinic'

export const metadata: Metadata = {
  title: 'IV Therapy Services | IV Health Clinics',
  description: 'Browse IV therapy services including hydration drips, NAD+ therapy, vitamin infusions, hangover relief, athletic recovery, and more. Find clinics near you.',
  alternates: { canonical: '/services' },
}

const SERVICE_TYPES = [
  {
    type: 'hydration',
    description: 'Replenish fluids and electrolytes to combat dehydration from illness, heat, or strenuous activity.',
  },
  {
    type: 'vitamin_drips',
    description: 'High-dose vitamin infusions—Vitamin C, B-complex, magnesium, zinc—delivered directly to your bloodstream.',
  },
  {
    type: 'nad_plus',
    description: 'NAD+ therapy to support cellular energy production, cognitive function, and healthy aging.',
  },
  {
    type: 'athletic_recovery',
    description: 'Targeted IV drips to accelerate muscle recovery, reduce soreness, and restore peak performance.',
  },
  {
    type: 'hangover_relief',
    description: 'Fast-acting IV hydration with anti-nausea medication and vitamins—feel better in under an hour.',
  },
  {
    type: 'immune_support',
    description: 'Immune-boosting infusions with high-dose Vitamin C, zinc, and antioxidants to help fight illness.',
  },
  {
    type: 'beauty_anti_aging',
    description: 'Glutathione, biotin, and collagen-supporting nutrients delivered intravenously for skin and hair health.',
  },
  {
    type: 'weight_loss',
    description: 'MIC injections, lipotropic drips, and metabolism-supporting vitamin blends.',
  },
  {
    type: 'migraine_relief',
    description: 'IV magnesium, anti-inflammatory, and anti-nausea medications for fast migraine and headache relief.',
  },
  {
    type: 'b12_shots',
    description: 'Quick intramuscular B12 injections for energy, metabolism support, and neurological health.',
  },
  {
    type: 'glutathione',
    description: "The master antioxidant—IV glutathione for detox, skin brightening, and cellular health.",
  },
  {
    type: 'detox',
    description: 'IV formulas with liver-supporting nutrients to help flush toxins and support recovery.',
  },
  {
    type: 'custom_blends',
    description: 'Custom IV cocktails tailored to your specific health goals, symptoms, or lab results.',
  },
]

export default function ServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 mb-2 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">IV Therapy Services</h1>
        <p className="mt-2 text-gray-500">
          Browse clinics by the IV therapy service you need.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICE_TYPES.map(({ type, description }) => {
          const slug = serviceTypeSlug(type)
          const label = serviceTypeLabel(type)
          return (
            <Link
              key={type}
              href={`/services/${slug}`}
              className="group p-5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
            >
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                {label}
              </h2>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {description}
              </p>
              <span className="mt-3 inline-flex items-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                Browse clinics
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
