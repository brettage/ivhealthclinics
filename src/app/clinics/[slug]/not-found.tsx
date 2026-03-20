import Link from 'next/link'

export default function ClinicNotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h1 className="text-4xl font-bold text-gray-900">Clinic Not Found</h1>
      <p className="mt-4 text-gray-500 max-w-md mx-auto">
        The clinic you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <div className="flex justify-center gap-3 mt-8">
        <Link href="/" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg">
          Go Home
        </Link>
        <Link href="/search" className="px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50">
          Search Clinics
        </Link>
      </div>
    </div>
  )
}
