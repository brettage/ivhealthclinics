import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClinicsByServiceType } from '@/app/actions/clinics'
import ClinicCard from '@/components/ClinicCard'
import { slugToServiceType, serviceTypeLabel } from '@/types/clinic'
import type { Metadata } from 'next'

const VALID_SERVICE_SLUGS = [
  'hydration', 'vitamin-drips', 'nad-plus', 'athletic-recovery',
  'hangover-relief', 'immune-support', 'beauty-anti-aging', 'weight-loss',
  'migraine-relief', 'b12-shots', 'glutathione', 'detox', 'custom-blends',
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>
}): Promise<Metadata> {
  const { service } = await params
  if (!VALID_SERVICE_SLUGS.includes(service)) return { title: 'Service Not Found' }
  const label = serviceTypeLabel(slugToServiceType(service))
  return {
    title: `${label} Clinics | IV Health Clinics`,
    description: `Find ${label.toLowerCase()} providers near you. Browse IV therapy clinics offering ${label.toLowerCase()} across the US.`,
    alternates: { canonical: `/services/${service}` },
  }
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ service: string }>
}) {
  const { service } = await params
  if (!VALID_SERVICE_SLUGS.includes(service)) notFound()

  const serviceType = slugToServiceType(service)
  const label = serviceTypeLabel(serviceType)
  const clinics = await getClinicsByServiceType(serviceType)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        <span>/</span>
        <Link href="/services" className="hover:text-emerald-600">Services</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{label}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900">{label} Clinics</h1>
      <p className="mt-2 text-gray-500">
        {clinics.length.toLocaleString()} clinic{clinics.length !== 1 ? 's' : ''} offering {label.toLowerCase()}
      </p>

      {clinics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {clinics.map((clinic: any) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">No clinics found for {label} yet.</p>
          <Link href="/services" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700">
            ← Browse other services
          </Link>
        </div>
      )}
    </div>
  )
}
