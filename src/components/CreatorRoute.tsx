import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

/**
 * Route guard: only professional / creator users (or admins) may proceed.
 * Everyone else is redirected to the creator application page.
 */
export default function CreatorRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { loading, isCreator, isAdmin } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isCreator && !isAdmin) return <Navigate to="/become-creator" replace />;

  return <>{children}</>;
}
