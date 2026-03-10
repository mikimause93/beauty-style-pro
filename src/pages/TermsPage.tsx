import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    title: "1. Accettazione dei Termini",
    content: "Utilizzando Stayle / Beauty Style Pro, accetti i presenti Termini di Servizio. Se non accetti, non utilizzare la piattaforma. L'uso continuato dopo eventuali modifiche costituisce accettazione della versione aggiornata."
  },
  {
    title: "2. Account Utente",
    content: "L'utente è responsabile della sicurezza del proprio account e delle credenziali di accesso. È necessario fornire informazioni accurate e aggiornate durante la registrazione. Ogni persona può avere un solo account. Non è consentito cedere o condividere l'accesso al proprio account."
  },
  {
    title: "3. Tipologie di Account",
    content: "La piattaforma supporta tre tipi di account: Cliente (prenotazioni, acquisti, interazioni social), Professionista (offerta servizi, gestione prenotazioni, portfolio, analytics) e Business (gestione attività, team, marketing, HR). Ogni tipo ha funzionalità e responsabilità specifiche."
  },
  {
    title: "4. Contenuti e Condotta",
    content: "I contenuti pubblicati (post, foto, video, live streaming, commenti) devono rispettare le linee guida della community. È vietato pubblicare: contenuti illegali, offensivi o discriminatori, spam o contenuti fraudolenti, materiale che viola diritti di terzi, contenuti violenti o sessualmente espliciti. Ci riserviamo il diritto di rimuovere contenuti inappropriati senza preavviso."
  },
  {
    title: "5. Servizi e Prenotazioni",
    content: "Stayle è una piattaforma che connette clienti con professionisti del settore beauty & wellness. Le prenotazioni costituiscono accordi diretti tra utente e professionista. La piattaforma facilita il contatto ma non è responsabile per la qualità, puntualità o esecuzione dei servizi forniti dai professionisti."
  },
  {
    title: "6. Pagamenti e Commissioni",
    content: "Le transazioni sono elaborate da provider esterni certificati (Stripe, PayPal, Klarna). Le commissioni applicabili sono indicate prima della conferma del pagamento. I rimborsi seguono la politica del provider di pagamento utilizzato. Klarna permette il pagamento rateale (3 rate senza interessi) secondo i propri termini."
  },
  {
    title: "7. Wallet e QR Coins",
    content: "I QR Coins sono una valuta virtuale interna alla piattaforma. Non costituiscono moneta reale e non sono convertibili in denaro. Possono essere utilizzati esclusivamente all'interno dell'app per: tips durante live streaming, acquisti e servizi interni, trasferimenti P2P tra utenti. Il saldo QR Coins non è rimborsabile. La piattaforma si riserva il diritto di modificare il valore e le modalità di utilizzo dei QR Coins."
  },
  {
    title: "8. Live Streaming",
    content: "I contenuti trasmessi in live streaming sono responsabilità esclusiva dell'utente che trasmette. È vietato trasmettere contenuti illegali, offensivi o che violano diritti di terzi. Le tips e donazioni ricevute durante le live sono gestite tramite il sistema QR Coins. I replay possono essere salvati e resi disponibili sulla piattaforma."
  },
  {
    title: "9. Offerte Lavoro (HR)",
    content: "Le offerte lavoro sono pubblicate dagli utenti (professionisti e business). La piattaforma non garantisce assunzione né verifica l'accuratezza di ogni annuncio. Il matching AI è uno strumento di suggerimento, non una garanzia di compatibilità. L'utente è responsabile della veridicità delle informazioni nel proprio CV/portfolio."
  },
  {
    title: "10. Chat e Comunicazioni",
    content: "Le comunicazioni in-app (chat, messaggi, WhatsApp Business) sono strumenti per facilitare il contatto tra utenti. È vietato utilizzare la chat per spam, molestie o attività fraudolente. I messaggi possono essere conservati per finalità di sicurezza e supporto."
  },
  {
    title: "11. Abbonamenti Premium",
    content: "Gli abbonamenti (Pro, Business, Premium) offrono funzionalità aggiuntive. Il rinnovo è automatico salvo disdetta. La disdetta può essere effettuata dalle impostazioni dell'app. Non sono previsti rimborsi per periodi parziali."
  },
  {
    title: "12. Proprietà Intellettuale",
    content: "I contenuti pubblicati restano di proprietà dell'utente, che concede alla piattaforma una licenza non esclusiva per la visualizzazione e distribuzione all'interno dell'app. Il brand Stayle, il logo e l'interfaccia sono proprietà esclusiva della piattaforma."
  },
  {
    title: "13. Sospensione e Chiusura Account",
    content: "Ci riserviamo il diritto di sospendere o chiudere account che violano i presenti termini, senza preavviso in caso di violazioni gravi. L'utente può richiedere la chiusura del proprio account in qualsiasi momento dalle impostazioni o contattando support@stayle.app."
  },
  {
    title: "14. Limitazione di Responsabilità",
    content: "Stayle non è responsabile per: danni indiretti derivanti dall'uso della piattaforma, interruzioni temporanee del servizio, azioni o omissioni di utenti terzi, perdite derivanti da servizi di professionisti. Il servizio viene fornito \"così com'è\" (as is)."
  },
  {
    title: "15. Legge Applicabile",
    content: "I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente il Foro di Milano, salvo diversa disposizione di legge."
  },
  {
    title: "16. Contatti",
    content: "Per domande sui termini di servizio: support@stayle.app"
  }
];

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
        <p className="text-foreground font-medium">
          Utilizzando Stayle / Beauty Style Pro accetti le seguenti condizioni d'uso.
        </p>
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-base font-display font-bold text-foreground mb-2">{s.title}</h2>
            <p>{s.content}</p>
          </section>
        ))}
        <p className="text-[10px] text-center pt-4">Ultimo aggiornamento: Marzo 2026</p>
      </div>
    </MobileLayout>
  );
}
