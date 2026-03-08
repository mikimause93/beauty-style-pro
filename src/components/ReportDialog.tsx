import { useState } from "react";
import { Flag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetContentId?: string;
  contentType: "profile" | "post" | "message" | "job" | "product";
}

const REASONS = [
  "Spam o contenuto ingannevole",
  "Comportamento inappropriato",
  "Contenuto offensivo",
  "Profilo falso",
  "Truffa / Frode",
  "Violenza o minacce",
  "Contenuto per adulti",
  "Altro",
];

export default function ReportDialog({ open, onClose, targetUserId, targetContentId, contentType }: ReportDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!user || !reason) { toast.error("Seleziona un motivo"); return; }
    setLoading(true);
    const { error } = await supabase.from("user_reports").insert({
      reporter_id: user.id,
      reported_user_id: targetUserId || null,
      reported_content_id: targetContentId || null,
      content_type: contentType,
      reason,
      description: description || null,
    });
    setLoading(false);
    if (error) { toast.error("Errore nell'invio"); return; }
    toast.success("Segnalazione inviata. Grazie!");
    onClose();
    setReason("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            <h3 className="font-display font-bold">Segnala</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="space-y-2">
          {REASONS.map(r => (
            <button key={r} onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                reason === r ? "bg-primary/10 border-primary text-primary font-semibold" : "bg-muted/30 border-border/50"
              }`}>
              {r}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Descrivi il problema (opzionale)..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full h-20 rounded-xl bg-muted/30 border border-border/50 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
        />

        <button onClick={handleSubmit} disabled={loading || !reason}
          className="w-full h-12 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm disabled:opacity-50">
          {loading ? "Invio..." : "Invia Segnalazione"}
        </button>
      </div>
    </div>
  );
}
