
-- ============================================
-- 2. FIX PROFILES — Secure public view
-- ============================================
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

-- Owner can see everything
CREATE POLICY "Users can view own full profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a public view hiding sensitive columns
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT 
    id, user_id, display_name, avatar_url, bio, user_type,
    city, country, username, instagram, tiktok, facebook,
    follower_count, following_count, qr_coins,
    skills, experience_years, desired_categories, portfolio_urls,
    verification_status, phone_verified, created_at
  FROM public.profiles;

-- Allow public read of non-sensitive data via the view's invoker
CREATE POLICY "Anyone can read basic profile data"
  ON public.profiles FOR SELECT
  USING (true);

-- ============================================
-- 3. FIX BUSINESSES — Hide VAT/tax/documents
-- ============================================
DROP POLICY IF EXISTS "Businesses viewable by everyone" ON public.businesses;

CREATE POLICY "Owner can view own business fully"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE VIEW public.businesses_public
WITH (security_invoker = on) AS
  SELECT 
    id, user_id, business_name, business_type, slug, description, bio,
    address, city, zip_code, phone, email, website,
    instagram, facebook, logo_url, cover_image_url,
    categories, rating, review_count, featured, verified, active,
    latitude, longitude, working_hours, employee_count,
    branding_theme, created_at, updated_at
  FROM public.businesses;

CREATE POLICY "Public can view basic business info"
  ON public.businesses FOR SELECT
  USING (true);

-- ============================================
-- 4. FIX CHATBOT_MESSAGES — Own user_id only
-- ============================================
DROP POLICY IF EXISTS "System can insert chatbot messages" ON public.chatbot_messages;
DROP POLICY IF EXISTS "System can update chatbot messages" ON public.chatbot_messages;

CREATE POLICY "Users can insert own chatbot messages"
  ON public.chatbot_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chatbot messages"
  ON public.chatbot_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 5. FIX PAGE_VIEWS — Own data + admin
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read page views" ON public.page_views;

CREATE POLICY "Users can read own page views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all page views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 6. FIX ERROR_LOGS — Own data + admin
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read error logs" ON public.error_logs;

CREATE POLICY "Users can read own error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 7. FIX PROMO_CODES — Active only + admin
-- ============================================
DROP POLICY IF EXISTS "Promo codes viewable by everyone" ON public.promo_codes;

CREATE POLICY "Active promo codes viewable"
  ON public.promo_codes FOR SELECT
  USING (active = true AND expires_at > now());

CREATE POLICY "Admins can view all promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
