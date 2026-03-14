
-- Add foreign key from professionals.user_id to profiles.user_id so PostgREST can resolve the join
ALTER TABLE public.professionals 
ADD CONSTRAINT professionals_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Also add FK from posts.user_id to profiles.user_id if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_user_id_profiles_fkey' AND table_name = 'posts'
  ) THEN
    ALTER TABLE public.posts 
    ADD CONSTRAINT posts_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;
