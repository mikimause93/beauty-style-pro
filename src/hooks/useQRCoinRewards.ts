import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type RewardAction = "watch_live" | "react_live" | "comment_live" | "share" | "listen_radio" | "daily_login" | "complete_mission" | "referral";

const REWARD_MAP: Record<RewardAction, { amount: number; label: string; cooldownMs: number }> = {
  watch_live: { amount: 2, label: "Live guardato", cooldownMs: 60_000 },
  react_live: { amount: 1, label: "Reazione live", cooldownMs: 10_000 },
  comment_live: { amount: 1, label: "Commento live", cooldownMs: 15_000 },
  share: { amount: 3, label: "Condivisione", cooldownMs: 30_000 },
  listen_radio: { amount: 1, label: "Radio ascoltata", cooldownMs: 120_000 },
  daily_login: { amount: 5, label: "Login giornaliero", cooldownMs: 86_400_000 },
  complete_mission: { amount: 10, label: "Missione completata", cooldownMs: 0 },
  referral: { amount: 20, label: "Referral", cooldownMs: 0 },
};

export function useQRCoinRewards() {
  const { user, profile, refreshProfile } = useAuth();
  const cooldowns = useRef<Record<string, number>>({});

  const awardCoins = useCallback(async (action: RewardAction, silent = false) => {
    if (!user || !profile) return false;

    const reward = REWARD_MAP[action];
    const now = Date.now();
    const lastUsed = cooldowns.current[action] || 0;

    if (reward.cooldownMs > 0 && now - lastUsed < reward.cooldownMs) return false;

    cooldowns.current[action] = now;

    const newBalance = (profile.qr_coins || 0) + reward.amount;
    const { error } = await supabase
      .from("profiles")
      .update({ qr_coins: newBalance })
      .eq("user_id", user.id);

    if (error) return false;

    // Log transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      amount: reward.amount,
      type: "earn",
      description: reward.label,
      reference_type: action,
    });

    if (!silent) {
      toast.success(`+${reward.amount} QRCoin 🪙`, { description: reward.label, duration: 2000 });
    }

    refreshProfile();
    return true;
  }, [user, profile, refreshProfile]);

  return { awardCoins };
}
