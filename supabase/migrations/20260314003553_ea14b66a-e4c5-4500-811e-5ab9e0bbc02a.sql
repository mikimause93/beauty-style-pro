-- Fix stress_test_results INSERT - require auth
DROP POLICY IF EXISTS "Anyone can insert test results" ON public.stress_test_results;
CREATE POLICY "Authenticated can insert test results" ON public.stress_test_results
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Fix error_logs INSERT - allow authenticated only  
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;
CREATE POLICY "Authenticated can insert error logs" ON public.error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Keep page_views open for analytics (anon tracking is intentional)