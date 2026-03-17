import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

/**
 * Route guard: only users with user_type === 'business' (or admins) may proceed.
 * Everyone else is redirected to the home page.
 */
export default function BusinessRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { loading, isBusiness, isAdmin } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isBusiness && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
