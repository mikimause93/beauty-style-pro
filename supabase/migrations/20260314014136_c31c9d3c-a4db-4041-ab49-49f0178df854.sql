
-- Special Offers table
CREATE TABLE public.special_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  original_price NUMERIC NOT NULL,
  offer_price NUMERIC NOT NULL,
  discount_percentage NUMERIC GENERATED ALWAYS AS (ROUND(((original_price - offer_price) / original_price) * 100, 0)) STORED,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  offer_type TEXT DEFAULT 'discount' CHECK (offer_type IN ('discount', 'flash_sale', 'bundle', 'seasonal')),
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  max_claims INTEGER,
  current_claims INTEGER DEFAULT 0,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auctions table
CREATE TABLE public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  starting_price NUMERIC NOT NULL DEFAULT 1,
  current_price NUMERIC NOT NULL DEFAULT 1,
  reserve_price NUMERIC,
  buy_now_price NUMERIC,
  bid_count INTEGER DEFAULT 0,
  highest_bidder_id UUID,
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'sold', 'cancelled')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auction bids
CREATE TABLE public.auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Affiliate/commission system
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  affiliate_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC DEFAULT 5,
  total_earnings NUMERIC DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Affiliate sales tracking
CREATE TABLE public.affiliate_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID NOT NULL,
  order_amount NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  product_id UUID,
  service_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Platform commissions tracking
CREATE TABLE public.platform_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID,
  seller_id UUID NOT NULL,
  buyer_id UUID,
  order_amount NUMERIC NOT NULL,
  commission_rate NUMERIC DEFAULT 5,
  commission_amount NUMERIC NOT NULL,
  commission_type TEXT DEFAULT 'booking' CHECK (commission_type IN ('booking', 'product', 'service', 'subscription')),
  status TEXT DEFAULT 'collected' CHECK (status IN ('collected', 'pending', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_commissions ENABLE ROW LEVEL SECURITY;

-- Special offers: public read, owner manage
CREATE POLICY "Anyone can view active offers" ON public.special_offers FOR SELECT USING (active = true);
CREATE POLICY "Sellers manage own offers" ON public.special_offers FOR ALL TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

-- Auctions: public read, owner manage
CREATE POLICY "Anyone can view active auctions" ON public.auctions FOR SELECT USING (status IN ('active', 'ended', 'sold'));
CREATE POLICY "Sellers manage own auctions" ON public.auctions FOR ALL TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

-- Auction bids: authenticated can bid, view own
CREATE POLICY "Anyone can view bids" ON public.auction_bids FOR SELECT USING (true);
CREATE POLICY "Authenticated users can bid" ON public.auction_bids FOR INSERT TO authenticated WITH CHECK (bidder_id = auth.uid());

-- Affiliates: owner can view/manage
CREATE POLICY "Users view own affiliate" ON public.affiliates FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create own affiliate" ON public.affiliates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own affiliate" ON public.affiliates FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Affiliate sales: affiliate owner can view
CREATE POLICY "Affiliates view own sales" ON public.affiliate_sales FOR SELECT TO authenticated USING (
  affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
);
CREATE POLICY "System inserts affiliate sales" ON public.affiliate_sales FOR INSERT TO authenticated WITH CHECK (true);

-- Platform commissions: admin only via has_role, sellers see own
CREATE POLICY "Sellers view own commissions" ON public.platform_commissions FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "System inserts commissions" ON public.platform_commissions FOR INSERT TO authenticated WITH CHECK (true);
