import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Share2, Users, Gift, Coins, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";

export default function ReferralPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalReferred: 0, totalEarned: 0 });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: codes } = await supabase
      .from("referral_codes").select("*").eq("user_id", user.id).eq("active", true).limit(1);

    if (codes && codes.length > 0) {
      setReferralCode(codes[0].code);
    } else {
      const code = Array.from({ length: 8 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("");
      const { data: newCode } = await supabase
        .from("referral_codes").insert({ user_id: user.id, code, reward_qr_coin: 20 }).select().single();
      if (newCode) setReferralCode(newCode.code);
    }

    const { data: refs } = await supabase
      .from("referrals").select("*, referral_codes!inner(user_id)")
      .eq("referral_codes.user_id", user.id).order("created_at", { ascending: false });

    if (refs) {
      setReferrals(refs);
      setStats({ totalReferred: refs.length, totalEarned: refs.filter(r => r.reward_claimed).length * 20 });
    }
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Codice copiato!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Unisciti a STYLE Beauty!",
        text: `Unisciti a STYLE Beauty con il mio codice ${referralCode} e ricevi 20 QR Coin bonus! 🎁`,
        url: window.location.origin,
      });
    } else {
      copyCode();
    }
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <Gift className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Accesso richiesto</h2>
          <p className="text-muted-foreground mb-4">Accedi per utilizzare il programma referral</p>
          <button onClick={() => navigate("/auth")} className="px-6 py-3 rounded-full gradient-primary text-primary-foreground font-bold">
            Accedi
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Invita & Guadagna</h1>
        </div>
      </header>

      <div className="p-4 space-y-5">
        {/* Hero */}
        <div className="rounded-2xl gradient-primary p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-display font-bold text-primary-foreground mb-2">Guadagna 20 QR Coin</h2>
          <p className="text-primary-foreground/80 text-sm">Per ogni amico che inviti su STYLE Beauty!</p>
        </div>

        {/* Code */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <p className="text-sm text-muted-foreground mb-3">Il tuo codice referral</p>
          <div className="flex items-center gap-3 bg-muted rounded-xl p-4 border-2 border-dashed border-primary/30 mb-4">
            <span className="flex-1 text-2xl font-display font-bold tracking-[0.3em] text-center">{referralCode || "..."}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={copyCode} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors font-semibold text-sm">
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiato!" : "Copia"}
            </button>
            <button onClick={shareCode} className="flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">
              <Share2 className="w-4 h-4" /> Condividi
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card border border-border p-5 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalReferred}</p>
            <p className="text-xs text-muted-foreground">Amici invitati</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-5 text-center">
            <Coins className="w-6 h-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold text-gold">{stats.totalEarned}</p>
            <p className="text-xs text-muted-foreground">QRC guadagnati</p>
          </div>
        </div>

        {/* Referrals */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">I tuoi referral</h3>
          {referrals.length === 0 ? (
            <div className="text-center py-10 rounded-xl bg-card">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nessun referral ancora. Inizia ad invitare!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Amico #{ref.referred_id.slice(0, 6)}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(ref.created_at).toLocaleDateString("it-IT")}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${ref.reward_claimed ? "bg-success/20 text-success" : "bg-gold/20 text-gold"}`}>
                    {ref.reward_claimed ? "✓ +20 QRC" : "In attesa"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-xl bg-card p-5">
          <h3 className="font-semibold mb-3">Come funziona</h3>
          <div className="space-y-3">
            {[
              { icon: "1", text: "Condividi il tuo codice referral unico" },
              { icon: "2", text: "Il tuo amico si registra con il tuo codice" },
              { icon: "3", text: "Entrambi guadagnate 20 QR Coin!" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{step.icon}</span>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
