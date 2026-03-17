import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface UserPermissions {
  /** True while permissions are being resolved */
  loading: boolean;
  /** User has the admin role in user_roles table */
  isAdmin: boolean;
  /** User has the moderator role in user_roles table */
  isModerator: boolean;
  /** Profile user_type === 'business' */
  isBusiness: boolean;
  /** Profile user_type === 'professional' */
  isProfessional: boolean;
  /** Profile user_type === 'professional' or 'creator' */
  isCreator: boolean;
  /** verification_status === 'verified' */
  isVerified: boolean;
  /** Has at least one active user_subscription */
  hasActiveSubscription: boolean;
}

/**
 * Resolves the current user's role-based permissions.
 * Combines profile data (user_type, verification_status) from AuthContext
 * with async lookups for user_roles and user_subscriptions.
 */
export function usePermissions(): UserPermissions {
  const { user, profile, loading: authLoading } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [permLoading, setPermLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setIsModerator(false);
      setHasActiveSubscription(false);
      setPermLoading(false);
      return;
    }

    let cancelled = false;
    setPermLoading(true);

    Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id),
      supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1),
    ]).then(([rolesRes, subsRes]) => {
      if (cancelled) return;

      const roles = rolesRes.data ?? [];
      setIsAdmin(roles.some((r) => r.role === "admin"));
      setIsModerator(roles.some((r) => r.role === "moderator"));
      setHasActiveSubscription((subsRes.data ?? []).length > 0);
      setPermLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setIsAdmin(false);
      setIsModerator(false);
      setHasActiveSubscription(false);
      setPermLoading(false);
    });

    return () => { cancelled = true; };
  }, [user, authLoading]);

  const userType = profile?.user_type ?? "";
  const verificationStatus = profile?.verification_status ?? "";

  return {
    loading: authLoading || permLoading,
    isAdmin,
    isModerator,
    isBusiness: userType === "business",
    isProfessional: userType === "professional",
    isCreator: userType === "professional" || userType === "creator",
    isVerified: verificationStatus === "verified",
    hasActiveSubscription,
  };
}
