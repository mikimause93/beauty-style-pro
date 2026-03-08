import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-5 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Termini e Condizioni</h1>
      </header>
      <div className="px-5 py-6 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">1. Accettazione dei Termini</h2>
          <p>Utilizzando STYLE, accetti i presenti Termini di Servizio. Se non accetti, non utilizzare la piattaforma. L'uso continuato costituisce accettazione delle modifiche.</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">2. Account Utente</h2>
          <p>Devi fornire informazioni accurate durante la registrazione. Sei responsabile della sicurezza del tuo account. Non condividere le tue credenziali. Ogni utente può avere un solo account.</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">3. Servizi della Piattaforma</h2>
          <p>STYLE è una piattaforma che connette clienti con professionisti del settore beauty. Non siamo responsabili per la qualità dei servizi forniti dai professionisti. I pagamenti sono gestiti tramite provider sicuri.</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">4. Contenuti</h2>
          <p>I contenuti pubblicati devono rispettare le linee guida della community. Ci riserviamo il diritto di rimuovere contenuti inappropriati. I contenuti pubblicati restano di proprietà dell'utente.</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">5. Pagamenti e Commissioni</h2>
          <p>Le transazioni sono soggette a commissioni. I rimborsi seguono la nostra politica dedicata. I pagamenti sono elaborati da provider terzi certificati PCI-DSS.</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">6. Limitazioni di Responsabilità</h2>
          <p>STYLE non è responsabile per danni indiretti derivanti dall'uso della piattaforma. Il servizio viene fornito "così com'è".</p>
        </section>
        <section>
          <h2 className="text-base font-display font-bold text-foreground mb-2">7. Contatti</h2>
          <p>Per domande sui termini, contattaci a: legal@style-app.com</p>
        </section>
        <p className="text-[10px] text-center pt-4">Ultimo aggiornamento: Marzo 2026</p>
      </div>
    </MobileLayout>
  );
}
