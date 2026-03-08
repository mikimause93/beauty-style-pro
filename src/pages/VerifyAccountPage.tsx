import { useState } from "react";
import { ArrowLeft, Upload, ShieldCheck, Camera, CreditCard, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MobileLayout from "@/components/layout/MobileLayout";

const DOC_TYPES = [
  { key: "id_card", label: "Carta d'Identità", Icon: CreditCard },
  { key: "passport", label: "Passaporto", Icon: FileText },
  { key: "selfie", label: "Selfie con Documento", Icon: Camera },
];

export default function VerifyAccountPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [docType, setDocType] = useState("id_card");
  const [fullName, setFullName] = useState(profile?.display_name || "");
  const [address, setAddress] = useState(profile?.city || "");
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!fullName.trim()) { toast.error("Inserisci il nome completo"); return; }
    if (files.length === 0) { toast.error("Carica almeno un documento"); return; }

    setSubmitting(true);
    const urls: string[] = [];

    for (const file of files) {
      const path = `${user.id}/verify/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (!error) urls.push(path);
    }

    const { error } = await supabase.from("verification_requests").insert({
      user_id: user.id,
      verification_type: profile?.user_type === "business" ? "business" : "identity",
      document_type: docType,
      document_urls: urls,
      full_name: fullName,
      address: address || null,
    });

    setSubmitting(false);
    if (error) { toast.error("Errore nell'invio"); return; }
    toast.success("Richiesta inviata! Verrà verificata entro 24-48h.");
    navigate(-1);
  };

  const isVerified = profile?.verification_status === "verified";

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Verifica Account</h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        {isVerified ? (
          <div className="text-center py-12">
            <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold mb-2">Account Verificato ✓</h2>
            <p className="text-sm text-muted-foreground">Il tuo account è stato verificato con successo.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl gradient-primary p-5 text-primary-foreground">
              <ShieldCheck className="w-8 h-8 mb-2" />
              <h2 className="font-display font-bold text-lg">Verifica KYC</h2>
              <p className="text-sm opacity-80 mt-1">Verifica la tua identità per sbloccare tutte le funzionalità: prelievi, pagamenti e badge verificato.</p>
            </div>

            {/* Document Type */}
            <div>
              <p className="text-xs font-semibold mb-3">Tipo di documento</p>
              <div className="grid grid-cols-3 gap-2">
                {DOC_TYPES.map(d => (
                  <button key={d.key} onClick={() => setDocType(d.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      docType === d.key ? "bg-primary/10 border-primary text-primary" : "bg-card border-border/50 text-muted-foreground"
                    }`}>
                    <d.Icon className="w-5 h-5" />
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Nome completo</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full h-12 rounded-xl bg-card border border-border/50 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Indirizzo (opzionale)</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                className="w-full h-12 rounded-xl bg-card border border-border/50 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>

            {/* Upload */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Carica documenti</label>
              <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-2xl border-2 border-dashed border-border/50 cursor-pointer hover:border-primary/30 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{files.length > 0 ? `${files.length} file selezionati` : "Tocca per caricare"}</span>
                <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
              {submitting ? "Invio in corso..." : "Invia Verifica"}
            </button>

            <p className="text-[10px] text-center text-muted-foreground">
              I tuoi documenti sono protetti con crittografia e verranno utilizzati solo per la verifica dell'identità.
            </p>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
