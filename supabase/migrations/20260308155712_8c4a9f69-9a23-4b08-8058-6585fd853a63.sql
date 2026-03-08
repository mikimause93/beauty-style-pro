
CREATE TABLE IF NOT EXISTS public.product_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'wallet',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.product_purchases
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create purchases" ON public.product_purchases
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
