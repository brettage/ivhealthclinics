import Link from 'next/link'
import { getAllClinics } from '@/app/actions/clinics'
import ClinicCard from '@/components/ClinicCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IV Therapy Clinics Directory | IV Health Clinics',
  description: 'Browse all IV hydration and vitamin drip clinics in our directory. Find verified IV wellness clinics near you across the US.',
  alternates: { canonical: '/clinics' },
}

export default async function ClinicsPage() {
  const clinics = await getAllClinics()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 mb-2 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">IV Therapy Clinics</h1>
        <p className="mt-2 text-gray-500">
          {clinics.length.toLocaleString()} verified IV hydration and vitamin drip clinic{clinics.length !== 1 ? 's' : ''} across the US.
        </p>
      </div>

      {clinics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic: any) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">No clinics found.</p>
          <Link href="/locations" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700">
            Browse by Location
          </Link>
        </div>
      )}
    </div>
  )
}
