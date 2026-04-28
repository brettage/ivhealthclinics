/**
 * Registry of all guide articles. Add a new guide by importing it here
 * and adding it to the GUIDES map.
 *
 * Used by:
 * - /guides/[slug]/page.tsx (when slug routing exists) to look up content
 * - /guides/iv-therapy-cost/page.tsx and similar per-guide page files for now
 * - /guides index page (future) to list all available guides
 */

import type { Guide } from './iv-therapy-cost'
import { ivTherapyCostGuide } from './iv-therapy-cost'

export type { Guide, GuideSection, GuideBlock, GuideLink } from './iv-therapy-cost'

export const GUIDES: Record<string, Guide> = {
  'iv-therapy-cost': ivTherapyCostGuide,
  // Add new guides here:
  // 'types-of-iv-drips': typesOfIvDripsGuide,
  // 'mobile-vs-clinic-iv': mobileVsClinicIvGuide,
}

export function getGuide(slug: string): Guide | null {
  return GUIDES[slug] ?? null
}

export function getAllGuides(): Guide[] {
  return Object.values(GUIDES)
}
