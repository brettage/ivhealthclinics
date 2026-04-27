import Link from 'next/link'
import { Clinic, formatPriceRange, careSettingLabel, serviceTypeLabel } from '@/types/clinic'
import ClinicBadges from '@/components/ClinicBadges'

export default function ClinicCard({ clinic }: { clinic: Clinic }) {
  const priceDisplay = formatPriceRange(clinic.price_range_min, clinic.price_range_max)
  const settingDisplay = careSettingLabel(clinic.care_setting)

  return (
    <Link href={`/clinics/${clinic.slug}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 h-full flex flex-col">
        {/* Top accent bar */}
        <div className="h-1 w-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full mb-4 group-hover:w-full transition-all duration-300" />

        {/* Name & Location */}
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
          {clinic.name}
        </h3>
        {clinic.city && clinic.state && (
          <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
            </svg>
            {clinic.city}, {clinic.state}
          </p>
        )}

        <ClinicBadges clinic={clinic} size="sm" className="mt-2" />
        <div className="flex flex-wrap gap-1.5 mt-3">
          {clinic.verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded-full border border-green-200">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified
            </span>
          )}

          {clinic.care_setting && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-600 rounded-full border border-gray-200">
              {settingDisplay}
            </span>
          )}
        </div>

        {/* Services */}
        {clinic.service_types && clinic.service_types.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {clinic.service_types.slice(0, 3).map((type) => (
              <span key={type} className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 rounded-md">
                {serviceTypeLabel(type)}
              </span>
            ))}
            {clinic.service_types.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-500">
                +{clinic.service_types.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Spacer to push bottom content down */}
        <div className="flex-1" />

        {/* Bottom row: rating + price */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1">
            {clinic.rating_value ? (
              <>
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{Number(clinic.rating_value).toFixed(1)}</span>
                {clinic.rating_count && (
                  <span className="text-xs text-gray-400">({clinic.rating_count})</span>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-400">No reviews yet</span>
            )}
          </div>
          {clinic.pricing_disclosed && (
            <span className="text-sm font-medium text-emerald-600">{priceDisplay}</span>
          )}
        </div>

        {/* View Details CTA */}
        <div className="mt-3 flex items-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
          View Details
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
