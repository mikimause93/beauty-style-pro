
-- Live Guests table for co-host functionality
CREATE TABLE public.live_guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stream_id, user_id)
);

ALTER TABLE public.live_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests viewable by stream participants" ON public.live_guests FOR SELECT USING (true);
CREATE POLICY "Users can request to join" ON public.live_guests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Stream owners and guests can update" ON public.live_guests FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM live_streams ls JOIN professionals p ON p.id = ls.professional_id
    WHERE ls.id = live_guests.stream_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete own requests" ON public.live_guests FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for live_guests
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_guests;
