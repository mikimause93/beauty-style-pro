
-- User reports table
CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  reported_content_id uuid,
  content_type text NOT NULL DEFAULT 'profile',
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.user_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON public.user_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- User blocks table
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can block" ON public.user_blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view own blocks" ON public.user_blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" ON public.user_blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- Verification requests table
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  verification_type text NOT NULL DEFAULT 'identity',
  document_type text,
  document_urls text[] DEFAULT '{}',
  full_name text,
  address text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit verification" ON public.verification_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own verifications" ON public.verification_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
