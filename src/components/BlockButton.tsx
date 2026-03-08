import { useState, useEffect } from "react";
import { Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BlockButtonProps {
  targetUserId: string;
  size?: "sm" | "md";
}

export default function BlockButton({ targetUserId, size = "sm" }: BlockButtonProps) {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_blocks").select("id").eq("blocker_id", user.id).eq("blocked_id", targetUserId).maybeSingle()
      .then(({ data }) => setBlocked(!!data));
  }, [user, targetUserId]);

  const toggle = async () => {
    if (!user) { toast.error("Devi accedere"); return; }
    setLoading(true);
    if (blocked) {
      await supabase.from("user_blocks").delete().eq("blocker_id", user.id).eq("blocked_id", targetUserId);
      setBlocked(false);
      toast.success("Utente sbloccato");
    } else {
      await supabase.from("user_blocks").insert({ blocker_id: user.id, blocked_id: targetUserId });
      setBlocked(true);
      toast.success("Utente bloccato");
    }
    setLoading(false);
  };

  if (!user || user.id === targetUserId) return null;

  return (
    <button onClick={toggle} disabled={loading}
      className={`flex items-center gap-1.5 rounded-xl font-semibold transition-all ${
        blocked ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground"
      } ${size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs"}`}>
      <Ban className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {blocked ? "Sbloccato" : "Blocca"}
    </button>
  );
}
