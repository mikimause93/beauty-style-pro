import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Tenant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  brand_colors: { primary: string; secondary: string; accent: string };
  custom_domain: string | null;
  description: string | null;
  plan: string;
  status: string;
  settings: Record<string, any>;
  features_enabled: string[];
  max_members: number;
  country: string;
  currency: string;
  language: string;
  created_at: string;
}

interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  permissions: string[];
}

interface TenantContextType {
  currentTenant: Tenant | null;
  myTenants: Tenant[];
  myMemberships: TenantMember[];
  isLoading: boolean;
  setCurrentTenant: (tenant: Tenant | null) => void;
  createTenant: (data: { name: string; slug: string; description?: string }) => Promise<Tenant | null>;
  updateTenant: (id: string, data: Partial<Tenant>) => Promise<boolean>;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [myTenants, setMyTenants] = useState<Tenant[]>([]);
  const [myMemberships, setMyMemberships] = useState<TenantMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshTenants = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [ownedRes, memberRes] = await Promise.all([
        supabase.from("tenants").select("*").eq("owner_id", user.id),
        supabase.from("tenant_members").select("*").eq("user_id", user.id),
      ]);

      const owned = (ownedRes.data as any[] || []) as Tenant[];
      setMyTenants(owned);
      setMyMemberships((memberRes.data as any[] || []) as TenantMember[]);

      if (!currentTenant && owned.length > 0) {
        setCurrentTenant(owned[0]);
      }
    } catch (err) {
      console.error("Error loading tenants:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTenants();
  }, [user]);

  const createTenant = async (data: { name: string; slug: string; description?: string }): Promise<Tenant | null> => {
    if (!user) return null;
    const { data: tenant, error } = await supabase
      .from("tenants")
      .insert({ ...data, owner_id: user.id } as any)
      .select()
      .single();
    if (error) {
      console.error("Error creating tenant:", error);
      return null;
    }
    const t = tenant as any as Tenant;
    await refreshTenants();
    setCurrentTenant(t);
    return t;
  };

  const updateTenant = async (id: string, data: Partial<Tenant>): Promise<boolean> => {
    const { error } = await supabase.from("tenants").update(data as any).eq("id", id);
    if (error) {
      console.error("Error updating tenant:", error);
      return false;
    }
    await refreshTenants();
    return true;
  };

  return (
    <TenantContext.Provider value={{
      currentTenant, myTenants, myMemberships, isLoading,
      setCurrentTenant, createTenant, updateTenant, refreshTenants,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
