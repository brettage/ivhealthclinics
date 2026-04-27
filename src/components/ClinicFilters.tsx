'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Droplet, Truck, DollarSign } from 'lucide-react'

/**
 * Filter chips for clinic listings.
 *
 * Each chip toggles a URL query param (?services=1, ?mobile=1, ?pricing=1).
 * Active chips get a colored background; inactive chips are gray outlines.
 * State is owned by the URL — back button works, refreshing preserves filters,
 * and filtered views are shareable + SEO-indexable.
 *
 * Used on /clinics for now. Will be ported to /locations/[state],
 * /locations/[state]/[city], and /services/[type] next.
 */
export default function ClinicFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (key: string) => searchParams.get(key) === '1'

  const toggle = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get(key) === '1') {
      params.delete(key)
    } else {
      params.set(key, '1')
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const clearAll = () => {
    router.push(pathname, { scroll: false })
  }

  const hasAnyFilter =
    isActive('services') || isActive('mobile') || isActive('pricing')

  const chipBase =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors cursor-pointer'

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm text-gray-500 mr-1">Filter:</span>

      <button
        type="button"
        onClick={() => toggle('services')}
        className={
          isActive('services')
            ? `${chipBase} bg-cyan-50 text-cyan-700 ring-cyan-600/20`
            : `${chipBase} bg-white text-gray-600 ring-gray-300 hover:bg-gray-50`
        }
        aria-pressed={isActive('services')}
      >
        <Droplet size={14} className="shrink-0" />
        Services Listed
      </button>

      <button
        type="button"
        onClick={() => toggle('mobile')}
        className={
          isActive('mobile')
            ? `${chipBase} bg-emerald-50 text-emerald-700 ring-emerald-600/20`
            : `${chipBase} bg-white text-gray-600 ring-gray-300 hover:bg-gray-50`
        }
        aria-pressed={isActive('mobile')}
      >
        <Truck size={14} className="shrink-0" />
        Mobile Only
      </button>

      <button
        type="button"
        onClick={() => toggle('pricing')}
        className={
          isActive('pricing')
            ? `${chipBase} bg-amber-50 text-amber-700 ring-amber-600/20`
            : `${chipBase} bg-white text-gray-600 ring-gray-300 hover:bg-gray-50`
        }
        aria-pressed={isActive('pricing')}
      >
        <DollarSign size={14} className="shrink-0" />
        Pricing Available
      </button>

      {hasAnyFilter && (
        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
