
-- Function to create notifications automatically
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'info',
  _data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, data)
  VALUES (_user_id, _title, _message, _type, _data);
END;
$$;

-- Trigger: notify on new follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name text;
BEGIN
  SELECT display_name INTO follower_name FROM public.profiles WHERE user_id = NEW.follower_id LIMIT 1;
  PERFORM public.create_notification(
    NEW.following_id,
    'Nuovo Follower',
    COALESCE(follower_name, 'Qualcuno') || ' ha iniziato a seguirti',
    'follow',
    jsonb_build_object('follower_id', NEW.follower_id)
  );
  -- Update follower counts
  UPDATE public.profiles SET follower_count = follower_count + 1 WHERE user_id = NEW.following_id;
  UPDATE public.profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- Trigger: update counts on unfollow
CREATE OR REPLACE FUNCTION public.notify_on_unfollow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE user_id = OLD.following_id;
  UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = OLD.follower_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_unfollow
  AFTER DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_unfollow();

-- Trigger: notify on new like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  liker_name text;
  post_owner uuid;
BEGIN
  SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    SELECT display_name INTO liker_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    PERFORM public.create_notification(
      post_owner,
      'Nuovo Like ❤️',
      COALESCE(liker_name, 'Qualcuno') || ' ha messo like al tuo post',
      'like',
      jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id)
    );
  END IF;
  -- Update like count
  UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- Trigger: decrement like count on unlike
CREATE OR REPLACE FUNCTION public.on_unlike()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_unlike
  AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.on_unlike();

-- Trigger: notify on new comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  commenter_name text;
  post_owner uuid;
BEGIN
  SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    SELECT display_name INTO commenter_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    PERFORM public.create_notification(
      post_owner,
      'Nuovo Commento 💬',
      COALESCE(commenter_name, 'Qualcuno') || ': "' || LEFT(NEW.message, 50) || '"',
      'comment',
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
    );
  END IF;
  UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- Trigger: notify on new booking
CREATE OR REPLACE FUNCTION public.notify_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_name text;
  pro_user_id uuid;
BEGIN
  SELECT display_name INTO client_name FROM public.profiles WHERE user_id = NEW.client_id LIMIT 1;
  SELECT user_id INTO pro_user_id FROM public.professionals WHERE id = NEW.professional_id LIMIT 1;
  IF pro_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      pro_user_id,
      'Nuova Prenotazione 📅',
      COALESCE(client_name, 'Un cliente') || ' ha prenotato per il ' || NEW.booking_date,
      'booking',
      jsonb_build_object('booking_id', NEW.id, 'client_id', NEW.client_id)
    );
  END IF;
  -- Also notify client
  PERFORM public.create_notification(
    NEW.client_id,
    'Prenotazione Confermata ✅',
    'Il tuo appuntamento per il ' || NEW.booking_date || ' è confermato',
    'booking',
    jsonb_build_object('booking_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking();

-- Trigger: notify on new message
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  other_user uuid;
  p1 uuid;
  p2 uuid;
BEGIN
  SELECT participant_1, participant_2 INTO p1, p2 FROM public.conversations WHERE id = NEW.conversation_id;
  IF p1 = NEW.sender_id THEN other_user := p2; ELSE other_user := p1; END IF;
  
  SELECT display_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id LIMIT 1;
  
  IF other_user IS NOT NULL THEN
    PERFORM public.create_notification(
      other_user,
      'Nuovo Messaggio 💬',
      COALESCE(sender_name, 'Qualcuno') || ': "' || LEFT(NEW.content, 50) || '"',
      'message',
      jsonb_build_object('conversation_id', NEW.conversation_id, 'sender_id', NEW.sender_id)
    );
  END IF;
  
  -- Update conversation last message
  UPDATE public.conversations SET last_message = LEFT(NEW.content, 100), last_message_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- Allow users to insert notifications (for system use)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for notifications and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
