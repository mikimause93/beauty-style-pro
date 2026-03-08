import { X, Download, Share2, Smartphone, Globe } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { toast } from "sonner";

interface ShareAppModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ShareAppModal({ open, onClose }: ShareAppModalProps) {
  const { canInstall, installApp, isInstalled } = usePWA();

  if (!open) return null;

  const handleInstall = async () => {
    if (canInstall) {
      const ok = await installApp();
      if (ok) toast.success("App installata!");
    } else {
      toast.info("Usa 'Aggiungi a Home' dal menu del browser");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "STYLE Beauty",
        text: "Scopri STYLE Beauty – la piattaforma beauty per professionisti e clienti!",
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success("Link copiato!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
      <div className="w-full rounded-t-3xl bg-card p-6 space-y-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold">Scarica e Condividi</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          {/* Install PWA */}
          <button onClick={handleInstall}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold">
                {isInstalled ? "App Installata ✓" : "Installa App"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isInstalled ? "L'app è già sulla tua home" : "Aggiungi alla schermata Home"}
              </p>
            </div>
          </button>

          {/* Share Link */}
          <button onClick={handleShare}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Condividi Link</p>
              <p className="text-[11px] text-muted-foreground">Invia il link dell'app ai tuoi amici</p>
            </div>
          </button>

          {/* iOS instructions */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold">Come installare</p>
            </div>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <p><strong>iPhone:</strong> Safari → Condividi (↑) → "Aggiungi a Home"</p>
              <p><strong>Android:</strong> Chrome → Menu (⋮) → "Installa app"</p>
              <p><strong>Desktop:</strong> Chrome → Barra URL → Icona installa</p>
            </div>
          </div>

          {/* Web access */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Accesso web</p>
              <p className="text-[11px] font-mono text-muted-foreground truncate">{window.location.origin}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
