import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/**
 * Hook to check if a business/professional user is verified before allowing
 * product sales, service creation, booking acceptance, etc.
 */
export function useVerificationGuard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const isProOrBusiness = profile?.user_type === "professional" || profile?.user_type === "business";
  const isVerified = profile?.verification_status === "verified";

  /** Returns true if action is BLOCKED (user not verified) */
  const guardAction = (actionLabel?: string): boolean => {
    if (!user) {
      navigate("/auth");
      return true;
    }
    if (isProOrBusiness && !isVerified) {
      toast.error("Account non verificato", {
        description: `Per ${actionLabel || "questa azione"} devi prima verificare il tuo account.`,
        action: {
          label: "Verifica ora",
          onClick: () => navigate("/verify-account"),
        },
      });
      return true;
    }
    return false;
  };

  return { guardAction, isVerified, isProOrBusiness };
}
