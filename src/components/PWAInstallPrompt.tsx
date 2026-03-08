import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { X, Download, Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function PWAInstallPrompt() {
  const { canInstall, isInstalled, isOnline, updateAvailable, installApp, updateApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show prompt after 30 seconds if can install and not dismissed
    if (canInstall && !dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, dismissed]);

  const handleInstall = async () => {
    try {
      const success = await installApp();
      if (success) {
        setShowPrompt(false);
      }
    } catch (err) {
      console.error("Install failed:", err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  // Offline banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-warning text-warning-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="w-4 h-4" />
        <span>Sei offline - Alcune funzionalità potrebbero non essere disponibili</span>
      </div>
    );
  }

  // Update available banner
  if (updateAvailable) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] gradient-primary text-white py-2 px-4 flex items-center justify-center gap-3 text-sm">
        <RefreshCw className="w-4 h-4" />
        <span>Nuova versione disponibile!</span>
        <button
          onClick={updateApp}
          className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold hover:bg-white/30 transition-colors"
        >
          Aggiorna ora
        </button>
      </div>
    );
  }

  // Install prompt
  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative gradient-primary p-6 text-center">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          
          <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-1">Installa STYLE</h2>
          <p className="text-white/80 text-sm">Aggiungi alla schermata home</p>
        </div>
        
        {/* Benefits */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Accesso rapido</p>
              <p className="text-xs text-muted-foreground">Apri l'app direttamente dalla home</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Wifi className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Funziona offline</p>
              <p className="text-xs text-muted-foreground">Consulta i tuoi appuntamenti anche senza connessione</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🔔</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Notifiche push</p>
              <p className="text-xs text-muted-foreground">Ricevi promemoria per i tuoi appuntamenti</p>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 pt-0 space-y-2">
          <button
            onClick={handleInstall}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Download className="w-5 h-5" />
            Installa App
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full h-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Non ora
          </button>
        </div>
      </div>
    </div>
  );
}
