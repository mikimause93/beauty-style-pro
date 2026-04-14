
-- Remove duplicate triggers on post_likes that cause double notifications
DROP TRIGGER IF EXISTS on_post_like ON public.post_likes;
DROP TRIGGER IF EXISTS on_post_unlike ON public.post_likes;
