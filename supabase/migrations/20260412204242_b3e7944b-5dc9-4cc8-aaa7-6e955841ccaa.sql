
-- 1. Restrict profiles to authenticated only
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- Update existing profiles_public view with additional safe fields
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
  SELECT user_id, display_name, avatar_url, bio, user_type, country, city,
         verification_status, follower_count, following_count,
         instagram, tiktok, facebook, sector, username, skills, qr_coins,
         color_theme, gender, created_at
  FROM public.profiles;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 2. Businesses: owner-only full access
DROP POLICY IF EXISTS "Authenticated users can read businesses" ON public.businesses;
CREATE POLICY "Business owners can read own business"
  ON public.businesses FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 3. business_employees: scope to own business
DROP POLICY IF EXISTS "Business owner full access" ON public.business_employees;
CREATE POLICY "Business owner manages own employees"
  ON public.business_employees FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 4. tenant_invites: authenticated only
DROP POLICY IF EXISTS "Invitees can view their invites" ON public.tenant_invites;
CREATE POLICY "Authenticated invitees can view their invites"
  ON public.tenant_invites FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 5. ad_campaigns: hide financials from public
DROP POLICY IF EXISTS "Active ads viewable by everyone" ON public.ad_campaigns;
CREATE POLICY "Active ads viewable by authenticated"
  ON public.ad_campaigns FOR SELECT TO authenticated
  USING (active = true);
DROP POLICY IF EXISTS "Advertisers manage own campaigns" ON public.ad_campaigns;
CREATE POLICY "Advertisers manage own campaigns"
  ON public.ad_campaigns FOR ALL TO authenticated
  USING (advertiser_id = auth.uid())
  WITH CHECK (advertiser_id = auth.uid());

-- 6. platform_commissions: server-only inserts
DROP POLICY IF EXISTS "Only system inserts commissions" ON public.platform_commissions;
CREATE POLICY "No client commission inserts"
  ON public.platform_commissions FOR INSERT TO authenticated
  WITH CHECK (false);
DROP POLICY IF EXISTS "Users can read own commissions" ON public.platform_commissions;
CREATE POLICY "Users can read own commissions"
  ON public.platform_commissions FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- 7. wallet_transactions: server-only inserts
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;
CREATE POLICY "No client wallet transaction inserts"
  ON public.wallet_transactions FOR INSERT TO authenticated
  WITH CHECK (false);

-- 8. transactions (QR coins): server-only inserts
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "No client transaction inserts"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (false);

-- 9. ai_credits: block client updates
DROP POLICY IF EXISTS "Users can update own credits" ON public.ai_credits;
CREATE POLICY "No client AI credit updates"
  ON public.ai_credits FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "Users can read own credits" ON public.ai_credits;
CREATE POLICY "Users can read own AI credits"
  ON public.ai_credits FOR SELECT TO authenticated
  USING (user_id = auth.uid());
