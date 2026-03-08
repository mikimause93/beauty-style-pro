
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_comments;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
