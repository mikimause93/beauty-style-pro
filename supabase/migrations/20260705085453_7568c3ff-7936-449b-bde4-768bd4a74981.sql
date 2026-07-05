
-- 1. Professionals: revoke sensitive columns from anon
REVOKE SELECT (whatsapp, latitude, longitude) ON public.professionals FROM anon;

-- 2. Profiles: restrict authenticated blanket SELECT to own row only.
-- Other users must be read via public.profiles_public view (already used by app).
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
CREATE POLICY "Authenticated can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. business_employees: split ALL policy, prevent user_id tampering on UPDATE
DROP POLICY IF EXISTS "Business owner manages own employees" ON public.business_employees;

CREATE POLICY "Business owner can select employees"
  ON public.business_employees FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Business owner can insert employees"
  ON public.business_employees FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Business owner can update employees"
  ON public.business_employees FOR UPDATE TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    AND user_id IS NOT DISTINCT FROM (
      SELECT be.user_id FROM public.business_employees be WHERE be.id = business_employees.id
    )
  );

CREATE POLICY "Business owner can delete employees"
  ON public.business_employees FOR DELETE TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 4. team_members: revoke phone/email from authenticated; owner reads via RPC
REVOKE SELECT (phone, email) ON public.team_members FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_team_member_contact(_member_id uuid)
RETURNS TABLE(phone text, email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT tm.phone, tm.email
  FROM public.team_members tm
  JOIN public.businesses b ON b.id = tm.business_id
  WHERE tm.id = _member_id
    AND (b.user_id = auth.uid() OR tm.user_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.get_team_member_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_team_member_contact(uuid) TO authenticated;

-- 5. Lock down SECURITY DEFINER functions: revoke from anon+public, re-grant selectively
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef=true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon', r.proname, r.args);
  END LOOP;
END $$;

-- Re-grant the user-callable ones to authenticated
GRANT EXECUTE ON FUNCTION public.apply_shipping_promo(text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_stream_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_user_action(uuid, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chatbot_suggestions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stella_check_rate_limit(uuid, text) TO authenticated;
