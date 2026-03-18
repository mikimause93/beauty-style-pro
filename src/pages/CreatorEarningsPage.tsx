import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Send,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import { toast } from "sonner";

export default function CreatorEarningsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"earnings" | "payouts">("earnings");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutIban, setPayoutIban] = useState("");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  const { data: creatorProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["creator-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from("creator_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings-list", creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile) return [];
      const { data } = await (supabase as any)
        .from("creator_earnings")
        .select("*")
        .eq("creator_id", creatorProfile.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!creatorProfile,
  });

  const { data: payouts } = useQuery({
    queryKey: ["creator-payouts-list", creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile) return [];
      const { data } = await (supabase as any)
        .from("creator_payouts")
        .select("*")
        .eq("creator_id", creatorProfile.id)
        .order("requested_at", { ascending: false });
      return data || [];
    },
    enabled: !!creatorProfile,
  });

  const totalEarnings =
    earnings?.reduce((s: number, e: any) => s + Number(e.amount), 0) || 0;
  const pendingPayouts =
    payouts
      ?.filter((p: any) => p.status === "pending")
      .reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
  const paidOut =
    payouts
      ?.filter((p: any) => p.status === "paid")
      .reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
  const available = totalEarnings - pendingPayouts - paidOut;

  const requestPayout = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(payoutAmount);
      if (!amount || amount <= 0) throw new Error("Inserisci un importo valido");
      if (amount > available) throw new Error("Importo superiore al saldo disponibile");
      if (!payoutIban.trim() && !payoutEmail.trim())
        throw new Error("Inserisci IBAN o email PayPal");
      const { error } = await (supabase as any).from("creator_payouts").insert({
        creator_id: creatorProfile.id,
        amount,
        bank_iban: payoutIban.trim() || null,
        paypal_email: payoutEmail.trim() || null,
        notes: payoutNotes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Richiesta di pagamento inviata!");
      setShowPayoutForm(false);
      setPayoutAmount("");
      setPayoutIban("");
      setPayoutEmail("");
      setPayoutNotes("");
      qc.invalidateQueries({ queryKey: ["creator-payouts-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Errore nella richiesta");
    },
  });

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <Sparkles className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Area Creator</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Accedi per visualizzare i tuoi guadagni
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-3 rounded-full gradient-primary text-primary-foreground font-bold"
          >
            Accedi
          </button>
        </div>
      </MobileLayout>
    );
  }

  if (loadingProfile) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (!creatorProfile) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <Sparkles className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Non sei ancora un creator</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Candidati per diventare un creator e iniziare a monetizzare.
          </p>
          <button
            onClick={() => navigate("/become-creator")}
            className="px-8 py-3 rounded-full gradient-primary text-primary-foreground font-bold"
          >
            Diventa Creator
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold">Guadagni & Pagamenti</h1>
        </div>
        <div className="flex gap-2">
          {(["earnings", "payouts"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                tab === t
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {t === "earnings" ? "Entrate" : "Pagamenti"}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Balance summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <DollarSign className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-base font-bold text-primary">€{totalEarnings.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground">Totale Guadagni</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <Clock className="w-4 h-4 text-gold mx-auto mb-1" />
            <p className="text-base font-bold text-gold">€{pendingPayouts.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground">In Attesa</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <CheckCircle className="w-4 h-4 text-success mx-auto mb-1" />
            <p className="text-base font-bold text-success">€{available.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground">Disponibile</p>
          </div>
        </div>

        {tab === "earnings" && (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm">Storico Entrate</h3>
            </div>
            {!earnings || earnings.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nessuna entrata ancora</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {earnings.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{sourceLabel(e.source)}</p>
                      {e.description && (
                        <p className="text-[11px] text-muted-foreground">{e.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(e.created_at).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-success">+€{Number(e.amount).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "payouts" && (
          <div className="space-y-4">
            {/* Request payout */}
            {!showPayoutForm ? (
              <button
                onClick={() => setShowPayoutForm(true)}
                disabled={available <= 0}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Richiedi Pagamento
              </button>
            ) : (
              <div className="rounded-xl bg-card border border-border p-5 space-y-4">
                <h3 className="font-semibold">Nuova Richiesta</h3>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                    Importo (€) *
                  </label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    className="w-full rounded-xl bg-muted border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={`Max €${available.toFixed(2)}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                    IBAN Bancario
                  </label>
                  <input
                    value={payoutIban}
                    onChange={e => setPayoutIban(e.target.value)}
                    className="w-full rounded-xl bg-muted border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="IT00 X000 0000 0000 0000 0000 000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                    Email PayPal
                  </label>
                  <input
                    type="email"
                    value={payoutEmail}
                    onChange={e => setPayoutEmail(e.target.value)}
                    className="w-full rounded-xl bg-muted border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                    Note
                  </label>
                  <textarea
                    value={payoutNotes}
                    onChange={e => setPayoutNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl bg-muted border border-border p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Eventuali note..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPayoutForm(false)}
                    className="flex-1 py-3 rounded-xl bg-muted font-semibold text-sm"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={() => requestPayout.mutate()}
                    disabled={requestPayout.isPending}
                    className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {requestPayout.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Invio...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Invia</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Payout history */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm">Storico Pagamenti</h3>
              </div>
              {!payouts || payouts.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nessuna richiesta ancora</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {payouts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold">€{Number(p.amount).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(p.requested_at).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
    pending: { label: "In Attesa", className: "text-gold bg-gold/10", Icon: Clock },
    approved: { label: "Approvato", className: "text-primary bg-primary/10", Icon: CheckCircle },
    paid: { label: "Pagato", className: "text-success bg-success/10", Icon: CheckCircle },
    rejected: { label: "Rifiutato", className: "text-destructive bg-destructive/10", Icon: XCircle },
  };
  const c = config[status] || config.pending;
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${c.className}`}>
      <c.Icon className="w-3 h-3" />
      {c.label}
    </div>
  );
}

function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    subscription: "Abbonamento",
    tip: "Tip",
    booking: "Prenotazione",
    partnership: "Partnership",
    other: "Altro",
  };
  return map[source] || source;
}
