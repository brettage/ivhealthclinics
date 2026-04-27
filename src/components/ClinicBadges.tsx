import { Droplet, Truck, DollarSign } from 'lucide-react'

type Clinic = {
  service_types?: string[] | null
  mobile_service_available?: boolean | null
  price_range_min?: number | null
}

type ClinicBadgesProps = {
  clinic: Clinic
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Displays differentiator badges for an IV clinic:
 *   💧 Services Listed   — when service_types is non-empty
 *   🚐 Mobile IV         — when mobile_service_available is true
 *   💲 Pricing Available — when price_range_min is not null
 *
 * Used on ClinicCard (sm) and clinic detail page (md).
 * Renders nothing if no badges qualify.
 */
export default function ClinicBadges({
  clinic,
  size = 'sm',
  className = '',
}: ClinicBadgesProps) {
  const hasServices =
    Array.isArray(clinic.service_types) && clinic.service_types.length > 0
  const hasMobile = clinic.mobile_service_available === true
  const hasPricing =
    clinic.price_range_min !== null && clinic.price_range_min !== undefined

  if (!hasServices && !hasMobile && !hasPricing) return null

  const sizeClasses =
    size === 'md'
      ? 'text-sm px-3 py-1.5 gap-1.5'
      : 'text-xs px-2 py-1 gap-1'

  const iconSize = size === 'md' ? 14 : 12

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {hasServices && (
        <span
          className={`inline-flex items-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-600/20 font-medium ${sizeClasses}`}
          title="This clinic has listed their service menu"
        >
          <Droplet size={iconSize} className="shrink-0" />
          Services
        </span>
      )}
      {hasMobile && (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 font-medium ${sizeClasses}`}
          title="This clinic offers mobile / at-home IV service"
        >
          <Truck size={iconSize} className="shrink-0" />
          Mobile IV
        </span>
      )}
      {hasPricing && (
        <span
          className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 font-medium ${sizeClasses}`}
          title="This clinic has disclosed pricing"
        >
          <DollarSign size={iconSize} className="shrink-0" />
          Pricing
        </span>
      )}
    </div>
  )
}
