import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

/**
 * Route guard: only users with verification_status === 'verified' (or admins) may proceed.
 * Unverified users are redirected to the account verification page.
 */
export default function VerifiedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { loading, isVerified, isAdmin } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isVerified && !isAdmin) return <Navigate to="/verify-account" replace />;

  return <>{children}</>;
}
