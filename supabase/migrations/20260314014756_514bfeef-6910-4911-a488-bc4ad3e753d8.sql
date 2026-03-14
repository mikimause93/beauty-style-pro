
-- Add FK from bookings.client_id to profiles.user_id for join support
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_client_id_profiles_fkey 
FOREIGN KEY (client_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
