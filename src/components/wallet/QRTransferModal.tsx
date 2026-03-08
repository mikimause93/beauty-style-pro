import { useState } from "react";
import { QrCode, Send, Copy, Check, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QRTransferModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function QRTransferModal({ open, onClose, onComplete }: QRTransferModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [mode, setMode] = useState<"menu" | "send" | "receive" | "mycode">("menu");
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  if (!open || !user) return null;

  const myCode = user.id.slice(0, 8).toUpperCase();

  const copyCode = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Codice copiato!");
  };

  const handleSend = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Importo non valido"); return; }
    if (!recipientId.trim()) { toast.error("Inserisci il codice del destinatario"); return; }
    const balance = profile?.qr_coins || 0;
    if (amt > balance) { toast.error("Saldo insufficiente"); return; }

    setSending(true);
    try {
      // Find recipient by code (first 8 chars of user_id)
      const { data: recipients } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .ilike("user_id", `${recipientId.toLowerCase()}%`)
        .limit(1);

      if (!recipients || recipients.length === 0) {
        toast.error("Utente non trovato");
        setSending(false);
        return;
      }

      const recipient = recipients[0];
      if (recipient.user_id === user.id) {
        toast.error("Non puoi inviare a te stesso");
        setSending(false);
        return;
      }

      // Deduct from sender
      await supabase.from("profiles").update({ qr_coins: balance - amt }).eq("user_id", user.id);
      
      // Add to recipient
      const { data: recipientProfile } = await supabase.from("profiles").select("qr_coins").eq("user_id", recipient.user_id).single();
      await supabase.from("profiles").update({ qr_coins: (recipientProfile?.qr_coins || 0) + amt }).eq("user_id", recipient.user_id);

      // Log transactions
      await supabase.from("wallet_transactions").insert([
        { user_id: user.id, type: "transfer_out", amount: -amt, description: `Inviato a ${recipient.display_name || "utente"}`, status: "completed" },
        { user_id: recipient.user_id, type: "transfer_in", amount: amt, description: `Ricevuto da ${profile?.display_name || "utente"}`, status: "completed" },
      ]);

      // Notify recipient
      await supabase.from("notifications").insert({
        user_id: recipient.user_id,
        title: "QR Coins Ricevuti! 🎉",
        message: `${profile?.display_name || "Qualcuno"} ti ha inviato ${amt} QR Coins`,
        type: "transfer",
        data: { sender_id: user.id, amount: amt },
      });

      await refreshProfile();
      onComplete();
      toast.success(`${amt} QR Coins inviati a ${recipient.display_name || "utente"}!`);
      setAmount("");
      setRecipientId("");
      setMode("menu");
    } catch {
      toast.error("Errore durante il trasferimento");
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
      <div className="w-full rounded-t-3xl bg-card p-6 space-y-5 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold">
            {mode === "menu" && "Scambia QR Coins"}
            {mode === "send" && "Invia QR Coins"}
            {mode === "receive" && "Ricevi QR Coins"}
            {mode === "mycode" && "Il tuo Codice"}
          </h3>
          <button onClick={() => { onClose(); setMode("menu"); }} className="p-2 rounded-full bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode === "menu" && (
          <div className="space-y-3">
            <button onClick={() => setMode("send")}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Invia QR Coins</p>
                <p className="text-[11px] text-muted-foreground">Inserisci il codice del destinatario</p>
              </div>
            </button>

            <button onClick={() => setMode("mycode")}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Il mio Codice QR</p>
                <p className="text-[11px] text-muted-foreground">Mostra per ricevere QR Coins</p>
              </div>
            </button>

            <button onClick={() => {
              const shareData = { title: "STYLE Beauty", text: `Scarica STYLE Beauty e usa il mio codice ${myCode} per ricevere QR Coins!`, url: window.location.origin };
              try {
                if (navigator.share && navigator.canShare?.(shareData)) {
                  navigator.share(shareData);
                } else {
                  navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                  toast.success("Messaggio copiato!");
                }
              } catch { navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`); toast.success("Messaggio copiato!"); }
            }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Invita Amici</p>
                <p className="text-[11px] text-muted-foreground">Condividi il tuo codice e guadagna</p>
              </div>
            </button>
          </div>
        )}

        {mode === "send" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Codice destinatario</label>
              <input value={recipientId} onChange={e => setRecipientId(e.target.value.toUpperCase())} placeholder="Es. A1B2C3D4"
                className="w-full px-4 py-3 rounded-xl bg-muted text-sm font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-primary/30" maxLength={8} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Importo QR Coins</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
              <p className="text-[11px] text-muted-foreground mt-1">Saldo: {profile?.qr_coins || 0} QR Coins</p>
            </div>
            <button onClick={handleSend} disabled={sending}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">
              {sending ? "Invio in corso..." : "Invia QR Coins"}
            </button>
            <button onClick={() => setMode("menu")} className="w-full py-2 text-sm text-muted-foreground">Indietro</button>
          </div>
        )}

        {mode === "mycode" && (
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-48 h-48 rounded-2xl bg-foreground flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-20 h-20 text-background mx-auto mb-2" />
                <p className="text-background font-mono font-bold text-xl tracking-widest">{myCode}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">Mostra questo codice a chi vuole inviarti QR Coins</p>
            <button onClick={copyCode}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiato!" : "Copia Codice"}
            </button>
            <button onClick={() => setMode("menu")} className="text-sm text-muted-foreground">Indietro</button>
          </div>
        )}
      </div>
    </div>
  );
}
