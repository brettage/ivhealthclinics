-- verify_merge.sql
-- Phase 3.3 verification queries — run in Supabase Dashboard → SQL Editor
-- Run BEFORE merge (pre-flight) and AFTER merge (audit).

-- ============================================================
-- 1. PRE-FLIGHT: Counts of qualifying rows
-- ============================================================

-- How many places_discovery rows qualify for ENRICH vs DEMOTE
SELECT
  (crawl_result->>'is_iv_clinic')::boolean AS is_iv_clinic,
  COUNT(*) AS row_count
FROM places_discovery
WHERE crawl_status = 'done'
  AND crawl_result IS NOT NULL
  AND merged_into_clinic_id IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC;

-- ============================================================
-- 2. PRE-FLIGHT: Field null rates on to-be-enriched clinics
-- Shows how much each field will be filled by the merge.
-- ============================================================

SELECT
  COUNT(*)                                                    AS total,
  COUNT(*) FILTER (WHERE c.service_types IS NULL)             AS service_types_null,
  COUNT(*) FILTER (WHERE c.care_setting IS NULL)              AS care_setting_null,
  COUNT(*) FILTER (WHERE c.supervision_level IS NULL)         AS supervision_level_null,
  COUNT(*) FILTER (WHERE c.mobile_service_available IS NULL)  AS mobile_null,
  COUNT(*) FILTER (WHERE c.price_range_min IS NULL)           AS price_min_null,
  COUNT(*) FILTER (WHERE c.price_range_max IS NULL)           AS price_max_null,
  COUNT(*) FILTER (WHERE c.walk_ins_accepted IS NULL)         AS walk_ins_null,
  COUNT(*) FILTER (WHERE c.sterile_compounding IS NULL)       AS sterile_null,
  COUNT(*) FILTER (WHERE 'website_crawl' != ALL(COALESCE(c.data_sources, '{}'::text[])))
                                                              AS missing_crawl_source
FROM places_discovery pd
JOIN clinics c ON c.id = pd.merged_into_clinic_id
WHERE pd.crawl_status = 'done'
  AND (pd.crawl_result->>'is_iv_clinic')::boolean = true;

-- ============================================================
-- 3. PRE-FLIGHT: Sample of what the merge would change
-- Shows first 20 clinics with the new values they would receive.
-- ============================================================

SELECT
  c.name,
  c.city,
  c.state,
  -- Current values
  c.service_types                                           AS current_service_types,
  c.care_setting                                            AS current_care_setting,
  c.supervision_level                                       AS current_supervision,
  c.price_range_min                                         AS current_price_min_cents,
  -- Incoming values from crawl
  pd.crawl_result->'service_types'                          AS crawl_service_types,
  pd.crawl_result->>'care_setting'                          AS crawl_care_setting,
  pd.crawl_result->>'supervision_level'                     AS crawl_supervision,
  ((pd.crawl_result->>'price_range_min')::numeric * 100)::int
                                                            AS crawl_price_min_cents,
  ((pd.crawl_result->>'price_range_max')::numeric * 100)::int
                                                            AS crawl_price_max_cents
FROM places_discovery pd
JOIN clinics c ON c.id = pd.merged_into_clinic_id
WHERE pd.crawl_status = 'done'
  AND (pd.crawl_result->>'is_iv_clinic')::boolean = true
  AND (
    c.service_types IS NULL
    OR c.care_setting IS NULL
    OR c.supervision_level IS NULL
    OR c.price_range_min IS NULL
  )
LIMIT 20;

-- ============================================================
-- 4. POST-MERGE: Audit — confirm fields were filled
-- Run after merge_crawl_to_clinics.py --yes completes.
-- ============================================================

SELECT
  COUNT(*)                                                      AS total_enriched,
  COUNT(*) FILTER (WHERE 'website_crawl' = ANY(COALESCE(c.data_sources, '{}'::text[])))
                                                                AS has_crawl_source,
  COUNT(*) FILTER (WHERE c.last_crawled_at IS NOT NULL)         AS has_crawled_at,
  COUNT(*) FILTER (WHERE c.service_types IS NOT NULL)           AS has_service_types,
  COUNT(*) FILTER (WHERE c.care_setting IS NOT NULL)            AS has_care_setting,
  COUNT(*) FILTER (WHERE c.supervision_level IS NOT NULL)       AS has_supervision,
  COUNT(*) FILTER (WHERE c.price_range_min IS NOT NULL)         AS has_price_min,
  COUNT(*) FILTER (WHERE c.mobile_service_available = true)     AS has_mobile_true
FROM places_discovery pd
JOIN clinics c ON c.id = pd.merged_into_clinic_id
WHERE pd.crawl_status = 'done'
  AND (pd.crawl_result->>'is_iv_clinic')::boolean = true;

-- ============================================================
-- 5. POST-MERGE: Demote audit — confirm non-IV clinics are hidden
-- Only relevant if --demote-non-iv was used.
-- ============================================================

SELECT
  c.enrichment_status,
  COUNT(*) AS count
FROM places_discovery pd
JOIN clinics c ON c.id = pd.merged_into_clinic_id
WHERE pd.crawl_status = 'done'
  AND (pd.crawl_result->>'is_iv_clinic')::boolean = false
GROUP BY 1;

-- ============================================================
-- 6. DIRECTORY HEALTH: Visible clinics after merge
-- ============================================================

SELECT
  COUNT(*)                                                AS total_visible,
  COUNT(*) FILTER (WHERE service_types IS NOT NULL)       AS has_service_types,
  COUNT(*) FILTER (WHERE care_setting IS NOT NULL)        AS has_care_setting,
  COUNT(*) FILTER (WHERE price_range_min IS NOT NULL)     AS has_pricing,
  COUNT(*) FILTER (WHERE mobile_service_available = true) AS mobile_available,
  ROUND(AVG(rating_value)::numeric, 2)                    AS avg_rating,
  ROUND(AVG(rating_count)::numeric, 0)                    AS avg_review_count
FROM clinics
WHERE is_iv_clinic = true
  AND enrichment_status = 'enriched'
  AND duplicate_of IS NULL;
