
-- Tenants table (core multi-tenant entity)
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  cover_url TEXT,
  brand_colors JSONB DEFAULT '{"primary": "#9b87f5", "secondary": "#7E69AB", "accent": "#D6BCFA"}'::jsonb,
  custom_domain TEXT,
  description TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  settings JSONB DEFAULT '{}'::jsonb,
  features_enabled TEXT[] DEFAULT ARRAY['booking', 'shop', 'chat'],
  max_members INTEGER DEFAULT 5,
  country TEXT DEFAULT 'Italia',
  currency TEXT DEFAULT 'EUR',
  language TEXT DEFAULT 'it',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tenants" ON public.tenants
  FOR SELECT USING (status = 'active');

CREATE POLICY "Owner can manage tenant" ON public.tenants
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete tenant" ON public.tenants
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create tenants" ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tenant Members
CREATE TABLE public.tenant_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  permissions TEXT[] DEFAULT ARRAY['view'],
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own membership" ON public.tenant_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tenant owners can view all members" ON public.tenant_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND owner_id = auth.uid())
  );

CREATE POLICY "Tenant owners can manage members" ON public.tenant_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND owner_id = auth.uid())
  );

CREATE POLICY "Tenant owners can update members" ON public.tenant_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND owner_id = auth.uid())
  );

CREATE POLICY "Tenant owners can remove members" ON public.tenant_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND owner_id = auth.uid())
  );

CREATE TRIGGER update_tenant_members_updated_at
  BEFORE UPDATE ON public.tenant_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tenant Invites
CREATE TABLE public.tenant_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant owners can manage invites" ON public.tenant_invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND owner_id = auth.uid())
  );

CREATE POLICY "Invitees can view their invites" ON public.tenant_invites
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Indexes
CREATE INDEX idx_tenants_owner ON public.tenants(owner_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);
CREATE INDEX idx_tenant_invites_email ON public.tenant_invites(email);
CREATE INDEX idx_tenant_invites_token ON public.tenant_invites(token);
