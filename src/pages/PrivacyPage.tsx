import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Privacy Policy</h1>
      </header>
      <div className="px-5 py-6 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">1. Dati Raccolti</h2>
          <p>Raccogliamo: nome, email, telefono, foto profilo, posizione (se condivisa), dati di pagamento (gestiti da provider sicuri), contenuti pubblicati, e dati di utilizzo della piattaforma.</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">2. Utilizzo dei Dati</h2>
          <p>I dati vengono utilizzati per: fornire i servizi, personalizzare l'esperienza, processare pagamenti, inviare notifiche, migliorare la piattaforma e garantire la sicurezza.</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">3. Condivisione</h2>
          <p>I dati non vengono venduti a terzi. Condividiamo solo con: provider di pagamento, servizi di hosting, e autorità se richiesto dalla legge.</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">4. Sicurezza</h2>
          <p>Utilizziamo crittografia SSL/TLS, autenticazione sicura, e token per i pagamenti. I dati delle carte non vengono mai memorizzati sui nostri server.</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">5. Diritti dell'Utente</h2>
          <p>Hai diritto a: accedere ai tuoi dati, richiedere la cancellazione, modificare i dati, esportare i dati, e revocare il consenso in qualsiasi momento.</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">6. Cookie</h2>
          <p>Utilizziamo cookie tecnici necessari al funzionamento e cookie analitici per migliorare il servizio.</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">7. Contatti DPO</h2>
          <p>Per questioni relative alla privacy: privacy@style-app.com</p>
        </section>
        <p className="text-[10px] text-center pt-4">Conforme al GDPR — Ultimo aggiornamento: Marzo 2026</p>
      </div>
    </MobileLayout>
  );
}
