import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Link2, Copy, TrendingUp, Coins, Users, BarChart3, Check, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AffiliatePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) fetchAffiliate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAffiliate = async () => {
    const { data } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (data) {
      setAffiliate(data);
      const { data: salesData } = await supabase
        .from("affiliate_sales")
        .select("*")
        .eq("affiliate_id", data.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setSales(salesData || []);
    }
    setLoading(false);
  };

  const createAffiliate = async () => {
    const code = `STYLE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { data, error } = await supabase
      .from("affiliates")
      .insert({
        user_id: user!.id,
        affiliate_code: code,
        commission_rate: 5,
      })
      .select()
      .single();
    if (error) { toast.error("Errore nella creazione"); return; }
    setAffiliate(data);
    toast.success("Programma affiliazione attivato! 🎉");
  };

  const copyLink = () => {
    const link = `${window.location.origin}?ref=${affiliate.affiliate_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiato!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    const link = `${window.location.origin}?ref=${affiliate.affiliate_code}`;
    if (navigator.share) {
      navigator.share({ title: "STYLE - Beauty & Wellness", text: "Unisciti a STYLE! Usa il mio link per registrarti.", url: link });
    } else {
      copyLink();
    }
  };

  const pendingEarnings = sales.filter(s => s.status === "pending").reduce((sum, s) => sum + Number(s.commission_amount), 0);
  const confirmedEarnings = sales.filter(s => s.status === "confirmed" || s.status === "paid").reduce((sum, s) => sum + Number(s.commission_amount), 0);

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <Link2 className="w-10 h-10 text-primary mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Programma Affiliazione</h2>
          <p className="text-sm text-muted-foreground mb-6">Accedi per iniziare a guadagnare</p>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold">Accedi</button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-display font-bold">Affiliazione</h1>
      </header>

      <div className="p-4 space-y-5">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-card animate-pulse" />)}</div>
        ) : !affiliate ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">Diventa Affiliato</h2>
            <p className="text-sm text-muted-foreground mb-2">Guadagna una commissione del <strong>5%</strong> su ogni vendita generata dal tuo link.</p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-6">
              <li>✅ Condividi il tuo link unico</li>
              <li>✅ Guadagna su ogni acquisto dei tuoi referral</li>
              <li>✅ Preleva i guadagni nel tuo wallet</li>
            </ul>
            <button onClick={createAffiliate}
              className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-bold">
              Attiva Programma Affiliazione
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-card border border-border/50 text-center">
                <Coins className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">€{Number(affiliate.total_earnings).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Guadagni Totali</p>
              </div>
              <div className="p-3 rounded-2xl bg-card border border-border/50 text-center">
                <Users className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="text-lg font-bold">{affiliate.total_sales}</p>
                <p className="text-xs text-muted-foreground">Vendite</p>
              </div>
              <div className="p-3 rounded-2xl bg-card border border-border/50 text-center">
                <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{affiliate.commission_rate}%</p>
                <p className="text-xs text-muted-foreground">Commissione</p>
              </div>
            </div>

            {/* Earnings breakdown */}
            <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-2">
              <h3 className="text-sm font-semibold">Guadagni</h3>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">In attesa</span>
                <span className="font-semibold text-yellow-500">€{pendingEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Confermati</span>
                <span className="font-semibold text-green-500">€{confirmedEarnings.toFixed(2)}</span>
              </div>
            </div>

            {/* Affiliate Link */}
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-3">
              <h3 className="text-sm font-semibold">Il tuo link affiliato</h3>
              <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-2">
                <code className="flex-1 text-[11px] text-muted-foreground truncate">
                  {window.location.origin}?ref={affiliate.affiliate_code}
                </code>
                <button onClick={copyLink} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-primary" />}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={copyLink}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1">
                  <Copy className="w-3.5 h-3.5" /> Copia
                </button>
                <button onClick={shareLink}
                  className="flex-1 py-2 rounded-xl bg-accent/10 text-accent text-xs font-semibold flex items-center justify-center gap-1">
                  <Share2 className="w-3.5 h-3.5" /> Condividi
                </button>
              </div>
            </div>

            {/* Recent sales */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Vendite recenti</h3>
              {sales.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nessuna vendita ancora. Condividi il tuo link!</p>
              ) : (
                <div className="space-y-2">
                  {sales.map(sale => (
                    <div key={sale.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        sale.status === "paid" ? "bg-green-500/10" : sale.status === "confirmed" ? "bg-blue-500/10" : "bg-yellow-500/10"
                      }`}>
                        <Coins className={`w-4 h-4 ${
                          sale.status === "paid" ? "text-green-500" : sale.status === "confirmed" ? "text-blue-500" : "text-yellow-500"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold">Ordine €{Number(sale.order_amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleDateString("it-IT")}</p>
                      </div>
                      <span className="text-sm font-bold text-green-500">+€{Number(sale.commission_amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
