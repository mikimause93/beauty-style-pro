import { ArrowLeft, Receipt, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";

export default function ReceiptsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<any[]>([]);

  useEffect(() => {
    if (user) loadReceipts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadReceipts = async () => {
    const { data } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setReceipts(data);
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-display font-bold">Ricevute</h1>
      </header>

      <div className="px-5 py-6 space-y-3">
        {receipts.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nessuna ricevuta</p>
          </div>
        ) : (
          receipts.map(r => (
            <div key={r.id} className="p-4 rounded-2xl bg-card border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-primary">{r.receipt_type}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("it-IT")}</span>
              </div>
              <p className="text-sm font-medium">{r.service_name || "Pagamento"}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-display font-bold">€{Number(r.amount).toFixed(2)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  r.status === "paid" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                }`}>{r.status === "paid" ? "Pagato" : r.status}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                <span>Metodo: {r.payment_method || "—"}</span>
                <span>ID: {r.id.slice(0, 8)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </MobileLayout>
  );
}
