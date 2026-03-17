import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

/**
 * Route guard: only users with an active subscription (or admins) may proceed.
 * Users without a subscription are redirected to the subscriptions page.
 */
export default function PaidRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { loading, hasActiveSubscription, isAdmin } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasActiveSubscription && !isAdmin) return <Navigate to="/subscriptions" replace />;

  return <>{children}</>;
}
