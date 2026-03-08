-- ===========================================
-- 1. BUSINESSES TABLE (Aziende/Saloni con P.IVA)
-- ===========================================
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Business Info
  business_type TEXT NOT NULL DEFAULT 'center', -- individual, center, barbershop, spa, wellness, distributor, school, brand
  legal_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- Branding
  logo_url TEXT,
  cover_image_url TEXT,
  branding_theme JSONB DEFAULT '{}',
  
  -- Verifica P.IVA
  vat_number TEXT UNIQUE NOT NULL,
  tax_code TEXT,
  verification_status TEXT DEFAULT 'pending', -- pending, in_review, approved, rejected
  verified BOOLEAN DEFAULT false,
  
  -- Documenti
  certifications JSONB DEFAULT '{}',
  documents JSONB DEFAULT '{}',
  
  -- Categories
  categories TEXT[] DEFAULT '{}',
  bio TEXT,
  description TEXT,
  
  -- Location
  address TEXT,
  city TEXT,
  zip_code TEXT,
  latitude FLOAT,
  longitude FLOAT,
  
  -- Stats
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  
  -- Visibility
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  
  -- Contact
  email TEXT,
  phone TEXT,
  instagram TEXT,
  facebook TEXT,
  website TEXT,
  
  -- Working Hours
  working_hours JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_businesses_city ON public.businesses(city);
CREATE INDEX idx_businesses_verified ON public.businesses(verified);
CREATE INDEX idx_businesses_vat ON public.businesses(vat_number);

-- RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses viewable by everyone"
  ON public.businesses FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own business"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 2. TEAM MEMBERS TABLE (Dipendenti/Collaboratori)
-- ===========================================
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Info (per inviti)
  email TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee', -- owner, manager, employee, collaborator
  
  avatar TEXT,
  phone TEXT,
  position TEXT,
  departments TEXT[] DEFAULT '{}',
  
  -- Permissions
  can_manage_bookings BOOLEAN DEFAULT false,
  can_manage_services BOOLEAN DEFAULT false,
  can_manage_team BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  can_manage_hr BOOLEAN DEFAULT false,
  
  -- Activity
  live_call_active BOOLEAN DEFAULT false,
  accepts_bookings BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  invited_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(business_id, email)
);

-- Index
CREATE INDEX idx_team_members_business ON public.team_members(business_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);

-- RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members viewable by business"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = team_members.business_id
      AND businesses.user_id = auth.uid()
    ) OR auth.uid() = user_id
  );

CREATE POLICY "Business owners can manage team"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = team_members.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update team"
  ON public.team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = team_members.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete team"
  ON public.team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = team_members.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Trigger
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 3. JOB POSTS TABLE (Annunci di lavoro)
-- ===========================================
CREATE TABLE public.job_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Owner (Professional OR Business)
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- hair, beauty, nails, massage, etc.
  employment_type TEXT NOT NULL, -- full_time, part_time, freelance, internship, contract
  
  required_skills TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  
  -- Location
  location TEXT NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  
  -- Salary
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'EUR',
  
  -- Dates
  start_date TIMESTAMP WITH TIME ZONE,
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  status TEXT DEFAULT 'active', -- active, paused, expired, closed
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  
  featured BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT job_posts_owner_check CHECK (
    (professional_id IS NOT NULL AND business_id IS NULL) OR
    (professional_id IS NULL AND business_id IS NOT NULL)
  )
);

-- Index
CREATE INDEX idx_job_posts_professional ON public.job_posts(professional_id);
CREATE INDEX idx_job_posts_business ON public.job_posts(business_id);
CREATE INDEX idx_job_posts_category ON public.job_posts(category);
CREATE INDEX idx_job_posts_status ON public.job_posts(status);
CREATE INDEX idx_job_posts_expiration ON public.job_posts(expiration_date);

-- RLS
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job posts viewable by everyone"
  ON public.job_posts FOR SELECT
  USING (true);

CREATE POLICY "Professionals can create job posts"
  ON public.job_posts FOR INSERT
  WITH CHECK (
    (professional_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.id = job_posts.professional_id
      AND professionals.user_id = auth.uid()
    )) OR
    (business_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = job_posts.business_id
      AND businesses.user_id = auth.uid()
    ))
  );

CREATE POLICY "Owners can update job posts"
  ON public.job_posts FOR UPDATE
  USING (
    (professional_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.id = job_posts.professional_id
      AND professionals.user_id = auth.uid()
    )) OR
    (business_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = job_posts.business_id
      AND businesses.user_id = auth.uid()
    ))
  );

CREATE POLICY "Owners can delete job posts"
  ON public.job_posts FOR DELETE
  USING (
    (professional_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.id = job_posts.professional_id
      AND professionals.user_id = auth.uid()
    )) OR
    (business_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = job_posts.business_id
      AND businesses.user_id = auth.uid()
    ))
  );

-- Trigger
CREATE TRIGGER update_job_posts_updated_at
  BEFORE UPDATE ON public.job_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 4. JOB APPLICATIONS TABLE (Candidature)
-- ===========================================
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_post_id UUID REFERENCES public.job_posts(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  cv_url TEXT,
  cover_letter TEXT,
  portfolio_urls TEXT[] DEFAULT '{}',
  
  status TEXT DEFAULT 'sent', -- sent, viewed, in_review, interview_scheduled, contacted, accepted, rejected
  
  -- AI Matching
  ai_match_score NUMERIC,
  ai_recommended BOOLEAN DEFAULT false,
  ai_analysis JSONB DEFAULT '{}',
  
  -- Response
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  interview_date TIMESTAMP WITH TIME ZONE,
  
  employer_notes TEXT,
  rejection_reason TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(job_post_id, applicant_id)
);

-- Index
CREATE INDEX idx_job_applications_post ON public.job_applications(job_post_id);
CREATE INDEX idx_job_applications_applicant ON public.job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_job_applications_score ON public.job_applications(ai_match_score);

-- RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view own applications"
  ON public.job_applications FOR SELECT
  USING (auth.uid() = applicant_id);

CREATE POLICY "Job owners can view applications"
  ON public.job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_posts
      WHERE job_posts.id = job_applications.job_post_id
      AND (
        (job_posts.professional_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.professionals
          WHERE professionals.id = job_posts.professional_id
          AND professionals.user_id = auth.uid()
        )) OR
        (job_posts.business_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.businesses
          WHERE businesses.id = job_posts.business_id
          AND businesses.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can apply to jobs"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can update own applications"
  ON public.job_applications FOR UPDATE
  USING (auth.uid() = applicant_id);

CREATE POLICY "Job owners can update application status"
  ON public.job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.job_posts
      WHERE job_posts.id = job_applications.job_post_id
      AND (
        (job_posts.professional_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.professionals
          WHERE professionals.id = job_posts.professional_id
          AND professionals.user_id = auth.uid()
        )) OR
        (job_posts.business_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.businesses
          WHERE businesses.id = job_posts.business_id
          AND businesses.user_id = auth.uid()
        ))
      )
    )
  );

-- Trigger
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 5. ADD HR FIELDS TO PROFILES
-- ===========================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS cv_url TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS desired_categories TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS portfolio_urls TEXT[] DEFAULT '{}';