import { formatClinicName } from '@/lib/format-clinic-name'

const BASE_URL = 'https://ivhealthclinics.com'

interface HoursEntry {
  day: string
  opens: string
  closes: string
}

/**
 * Generates schema.org JSON-LD structured data for an IV therapy clinic.
 * Uses HealthAndBeautyBusiness + LocalBusiness (not MedicalBusiness — IV clinics are wellness businesses).
 */
export function generateClinicSchema(clinic: Record<string, any>) {
  // Address
  const address =
    clinic.address || clinic.city || clinic.state
      ? {
          '@type': 'PostalAddress',
          ...(clinic.address && { streetAddress: clinic.address }),
          ...(clinic.city && { addressLocality: clinic.city }),
          ...(clinic.state && { addressRegion: clinic.state }),
          ...(clinic.zip && { postalCode: clinic.zip }),
          addressCountry: 'US',
        }
      : undefined

  // Geo coordinates
  const geo =
    clinic.latitude && clinic.longitude
      ? {
          '@type': 'GeoCoordinates',
          latitude: Number(clinic.latitude),
          longitude: Number(clinic.longitude),
        }
      : undefined

  // Opening hours
  let openingHoursSpecification: any = undefined
  if (clinic.hours_of_operation) {
    try {
      const hours = clinic.hours_of_operation as unknown as HoursEntry[]
      if (Array.isArray(hours) && hours.length > 0) {
        openingHoursSpecification = hours.map((entry) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: entry.day,
          opens: entry.opens,
          closes: entry.closes,
        }))
      }
    } catch {
      // Invalid hours format, skip
    }
  }

  // Aggregate rating
  const aggregateRating =
    clinic.rating_value && clinic.rating_count
      ? {
          '@type': 'AggregateRating',
          ratingValue: Number(clinic.rating_value),
          reviewCount: Number(clinic.rating_count),
          bestRating: 5,
          worstRating: 1,
        }
      : undefined

  // Price range (stored in cents)
  let priceRange: string | undefined
  if (clinic.price_range_min || clinic.price_range_max) {
    const min = clinic.price_range_min
      ? `$${(clinic.price_range_min / 100).toFixed(0)}`
      : ''
    const max = clinic.price_range_max
      ? `$${(clinic.price_range_max / 100).toFixed(0)}`
      : ''
    if (min && max) {
      priceRange = `${min}-${max}`
    } else if (min) {
      priceRange = `${min}+`
    } else if (max) {
      priceRange = `Up to ${max}`
    }
  }

  // Service type labels for structured data
  const SERVICE_LABELS: Record<string, string> = {
    hydration: 'IV Hydration Therapy',
    vitamin_drips: 'Vitamin Drip Therapy',
    nad_plus: 'NAD+ IV Therapy',
    athletic_recovery: 'Athletic Recovery IV',
    hangover_relief: 'Hangover Relief IV',
    immune_support: 'Immune Support IV',
    beauty_anti_aging: 'Beauty & Anti-Aging IV',
    weight_loss: 'Weight Loss IV',
    migraine_relief: 'Migraine Relief IV',
    detox: 'Detox IV Therapy',
    custom_blends: 'Custom IV Blends',
    b12_shots: 'B12 Injections',
    glutathione: 'Glutathione IV Therapy',
  }

  // Available services
  const availableService =
    clinic.service_types && clinic.service_types.length > 0
      ? clinic.service_types.map((type: string) => ({
          '@type': 'Service',
          name: SERVICE_LABELS[type] || type,
        }))
      : undefined

  // Mobile service area
  const areaServed =
    clinic.mobile_service_areas && clinic.mobile_service_areas.length > 0
      ? clinic.mobile_service_areas.map((area: string) => ({
          '@type': 'Place',
          name: area,
        }))
      : undefined

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': ['HealthAndBeautyBusiness', 'LocalBusiness'],
    '@id': `${BASE_URL}/clinics/${clinic.slug}`,
    name: formatClinicName(clinic.name),
    url: `${BASE_URL}/clinics/${clinic.slug}`,
    ...(clinic.description && { description: clinic.description }),
    ...(clinic.logo_url && { image: clinic.logo_url }),
    ...(address && { address }),
    ...(geo && { geo }),
    ...(clinic.phone && { telephone: clinic.phone }),
    ...(clinic.website && { sameAs: clinic.website }),
    ...(openingHoursSpecification && { openingHoursSpecification }),
    ...(aggregateRating && { aggregateRating }),
    ...(priceRange && { priceRange }),
    ...(availableService && { hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'IV Therapy Services',
      itemListElement: availableService,
    }}),
    ...(areaServed && { areaServed }),

    // Medical director
    ...(clinic.medical_director_name && {
      employee: {
        '@type': 'Person',
        name: clinic.medical_director_name,
        jobTitle: 'Medical Director',
      },
    }),

    // Care setting description
    ...(clinic.care_setting === 'mobile_only' && {
      additionalType: 'https://schema.org/MobileApplication',
    }),

    paymentAccepted: 'Cash, Credit Card',
  }

  return schema
}
