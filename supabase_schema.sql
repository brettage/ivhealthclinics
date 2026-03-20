-- IVHealthClinics Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- ============================================
-- CLINICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  verified BOOLEAN DEFAULT false,
  mobile_service_available BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Care Setting
  care_setting TEXT CHECK (care_setting IN ('in_clinic', 'mobile_only', 'both')),
  mobile_service_radius TEXT,
  mobile_service_areas TEXT[],

  -- Service Menu
  service_types TEXT[],
  drip_menu_available BOOLEAN DEFAULT false,

  -- Pricing (stored in cents)
  price_range_min INTEGER,
  price_range_max INTEGER,
  membership_available BOOLEAN DEFAULT false,
  membership_price_monthly INTEGER,
  pricing_disclosed BOOLEAN DEFAULT false,
  group_discounts BOOLEAN DEFAULT false,
  event_services BOOLEAN DEFAULT false,

  -- Medical Supervision & Credentials
  supervision_level TEXT CHECK (supervision_level IN ('md_onsite', 'md_oversight', 'np_supervised', 'rn_administered')),
  medical_director_name TEXT,
  administering_credentials TEXT[],
  license_states TEXT[],
  clinician_npi_numbers TEXT[],

  -- Safety & Compliance
  sterile_compounding BOOLEAN,
  ingredient_sourcing TEXT,
  adverse_event_policy BOOLEAN,
  consent_form_required BOOLEAN,
  allergy_screening BOOLEAN,
  safety_disclosures TEXT,

  -- Booking & Access
  walk_ins_accepted BOOLEAN,
  appointment_required BOOLEAN,
  online_booking_url TEXT,
  hours_of_operation JSONB,
  after_hours_available BOOLEAN DEFAULT false,

  -- Data Quality
  is_iv_clinic BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  email TEXT,
  last_crawled_at TIMESTAMPTZ,
  crawl_skipped BOOLEAN DEFAULT false,
  last_verified_date TIMESTAMPTZ,
  data_sources TEXT[],

  -- SEO / Schema.org
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating_value DECIMAL(3, 2),
  rating_count INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics (slug);
CREATE INDEX IF NOT EXISTS idx_clinics_city_state ON clinics (city, state);
CREATE INDEX IF NOT EXISTS idx_clinics_verified ON clinics (verified);
CREATE INDEX IF NOT EXISTS idx_clinics_care_setting ON clinics (care_setting);
CREATE INDEX IF NOT EXISTS idx_clinics_pricing_disclosed ON clinics (pricing_disclosed);
CREATE INDEX IF NOT EXISTS idx_clinics_is_iv_clinic ON clinics (is_iv_clinic);
CREATE INDEX IF NOT EXISTS idx_clinics_mobile_service ON clinics (mobile_service_available);
CREATE INDEX IF NOT EXISTS idx_clinics_last_verified ON clinics (last_verified_date DESC);
CREATE INDEX IF NOT EXISTS idx_clinics_service_types ON clinics USING GIN (service_types);
CREATE INDEX IF NOT EXISTS idx_clinics_license_states ON clinics USING GIN (license_states);
CREATE INDEX IF NOT EXISTS idx_clinics_administering_credentials ON clinics USING GIN (administering_credentials);
CREATE INDEX IF NOT EXISTS idx_clinics_geo ON clinics (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CLINIC_SERVICES TABLE (detailed drip menu)
-- ============================================
CREATE TABLE IF NOT EXISTS clinic_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  price_cents INTEGER,
  duration_minutes INTEGER,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, service_type)
);

CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic ON clinic_services (clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_services_type ON clinic_services (service_type);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_clinic ON leads (clinic_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Clinics: public read, service role write
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinics are publicly readable" ON clinics FOR SELECT USING (true);
CREATE POLICY "Service role can manage clinics" ON clinics FOR ALL USING (true) WITH CHECK (true);

-- Clinic Services: public read
ALTER TABLE clinic_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic services are publicly readable" ON clinic_services FOR SELECT USING (true);
CREATE POLICY "Service role can manage clinic services" ON clinic_services FOR ALL USING (true) WITH CHECK (true);

-- Leads: insert allowed for anyone, read/update for authenticated
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous inserts" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Leads are viewable by authenticated users" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update leads" ON leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete leads" ON leads FOR DELETE TO authenticated USING (true);
