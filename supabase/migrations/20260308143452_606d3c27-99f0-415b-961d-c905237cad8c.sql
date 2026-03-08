
-- Drop existing triggers first, then recreate
DROP TRIGGER IF EXISTS on_post_like ON public.post_likes;
DROP TRIGGER IF EXISTS on_post_unlike ON public.post_likes;
DROP TRIGGER IF EXISTS on_new_comment ON public.comments;
DROP TRIGGER IF EXISTS on_new_booking ON public.bookings;
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
DROP TRIGGER IF EXISTS on_new_follow ON public.follows;
DROP TRIGGER IF EXISTS on_unfollow ON public.follows;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
DROP TRIGGER IF EXISTS update_professionals_updated_at ON public.professionals;
DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate all triggers
CREATE TRIGGER on_post_like AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();
CREATE TRIGGER on_post_unlike AFTER DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.on_unlike();
CREATE TRIGGER on_new_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();
CREATE TRIGGER on_new_booking AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking();
CREATE TRIGGER on_new_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();
CREATE TRIGGER on_new_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();
CREATE TRIGGER on_unfollow AFTER DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_on_unfollow();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
