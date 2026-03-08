
-- Service Requests table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_date DATE,
  preferred_time TEXT,
  urgency TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  response_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service requests viewable by everyone" ON public.service_requests FOR SELECT USING (true);
CREATE POLICY "Users can create own requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own requests" ON public.service_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own requests" ON public.service_requests FOR DELETE USING (auth.uid() = user_id);

-- Service request responses
CREATE TABLE public.service_request_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL,
  message TEXT NOT NULL,
  proposed_price NUMERIC,
  proposed_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_request_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Responses viewable by request owner and responder" ON public.service_request_responses FOR SELECT USING (
  auth.uid() = professional_id OR EXISTS (SELECT 1 FROM public.service_requests WHERE id = request_id AND user_id = auth.uid())
);
CREATE POLICY "Professionals can respond" ON public.service_request_responses FOR INSERT WITH CHECK (auth.uid() = professional_id);
CREATE POLICY "Professionals can update own response" ON public.service_request_responses FOR UPDATE USING (auth.uid() = professional_id);

-- Casting posts table
CREATE TABLE public.casting_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'model',
  casting_type TEXT NOT NULL DEFAULT 'casting',
  location TEXT,
  compensation TEXT,
  requirements TEXT,
  images TEXT[] DEFAULT '{}',
  event_date DATE,
  status TEXT NOT NULL DEFAULT 'open',
  application_count INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.casting_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Casting posts viewable by everyone" ON public.casting_posts FOR SELECT USING (true);
CREATE POLICY "Users can create casting posts" ON public.casting_posts FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own casting posts" ON public.casting_posts FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own casting posts" ON public.casting_posts FOR DELETE USING (auth.uid() = creator_id);

-- Casting applications
CREATE TABLE public.casting_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  casting_id UUID NOT NULL REFERENCES public.casting_posts(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  message TEXT,
  portfolio_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.casting_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applications viewable by casting owner and applicant" ON public.casting_applications FOR SELECT USING (
  auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM public.casting_posts WHERE id = casting_id AND creator_id = auth.uid())
);
CREATE POLICY "Users can apply to casting" ON public.casting_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Casting owners can update applications" ON public.casting_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.casting_posts WHERE id = casting_id AND creator_id = auth.uid())
);
