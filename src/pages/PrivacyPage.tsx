import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    title: "1. Titolare del Trattamento",
    content: "Il titolare del trattamento dei dati è Style App (\"Beauty Style Pro\"). Email: support@style.app — Paese: Italia."
  },
  {
    title: "2. Dati Raccolti",
    content: "L'app può raccogliere: nome e cognome, email, numero di telefono, foto profilo, posizione geografica (se condivisa), messaggi chat, dati prenotazioni e servizi, dati di pagamento (gestiti da provider esterni certificati PCI-DSS), ID dispositivo, preferenze notifiche push, dati di utilizzo dell'app e interazioni con contenuti."
  },
  {
    title: "3. Finalità del Trattamento",
    content: "I dati sono utilizzati per: creazione e gestione account, prenotazioni servizi beauty, gestione offerte lavoro e candidature, comunicazioni chat tra utenti e professionisti, elaborazione pagamenti (Stripe, PayPal, Klarna), gestione Wallet e QR Coins, geolocalizzazione di servizi e professionisti vicini, invio notifiche personalizzate, miglioramento dell'esperienza utente tramite AI, sicurezza e prevenzione frodi."
  },
  {
    title: "4. Pagamenti",
    content: "I pagamenti sono elaborati esclusivamente da provider esterni certificati: Stripe, PayPal e Klarna. L'app non memorizza mai dati di carte di credito o debito sui propri server. I QR Coins sono una valuta virtuale interna, non convertibile in denaro reale."
  },
  {
    title: "5. Geolocalizzazione",
    content: "La posizione geografica può essere utilizzata per: mostrare professionisti e servizi nelle vicinanze, offerte e promozioni locali personalizzate, visualizzazione su mappa interattiva. L'utente può disattivare la geolocalizzazione in qualsiasi momento dalle impostazioni del dispositivo."
  },
  {
    title: "6. Chat e Contenuti",
    content: "I messaggi e contenuti (post, foto, video, live streaming) possono essere salvati per il funzionamento dell'app, la sicurezza e il supporto tecnico. I contenuti non vengono venduti a terzi. I contenuti pubblicati restano di proprietà dell'utente. L'integrazione WhatsApp Business è utilizzata per comunicazioni dirette con professionisti."
  },
  {
    title: "7. AI e Suggerimenti Automatici",
    content: "L'app utilizza sistemi di intelligenza artificiale (Stella AI) per: suggerire azioni e funzionalità personalizzate, migliorare l'esperienza utente, consigliare servizi, professionisti e prodotti, analizzare engagement e proporre ottimizzazioni. Nessuna decisione legale o con effetti significativi viene presa in modo automatico. L'utente può disattivare i suggerimenti AI dalle impostazioni."
  },
  {
    title: "8. Conservazione Dati",
    content: "I dati personali sono conservati per tutta la durata dell'account attivo e per il periodo necessario agli obblighi di legge. L'utente può richiedere la cancellazione completa dei propri dati contattando: support@style.app. La cancellazione sarà eseguita entro 30 giorni dalla richiesta."
  },
  {
    title: "9. Diritti dell'Utente (GDPR Art. 15-22)",
    content: "L'utente ha diritto a: accedere ai propri dati personali, rettificare dati inesatti, cancellare i propri dati (diritto all'oblio), limitare il trattamento, portabilità dei dati, opposizione al trattamento, revoca del consenso in qualsiasi momento. Per esercitare questi diritti: support@style.app"
  },
  {
    title: "10. Sicurezza",
    content: "Adottiamo misure di sicurezza tecniche e organizzative: crittografia HTTPS/TLS, autenticazione sicura con token JWT, protezione database con Row Level Security, provider di pagamento certificati PCI-DSS, verifiche KYC per transazioni sensibili, monitoraggio e logging delle attività."
  },
  {
    title: "11. Condivisione con Terzi",
    content: "I dati non vengono venduti a terzi. Condividiamo dati solo con: provider di pagamento (Stripe, PayPal, Klarna), servizi di hosting e infrastruttura cloud, servizi di analisi aggregati (anonimi), autorità competenti se richiesto dalla legge."
  },
  {
    title: "12. Cookie e Tecnologie di Tracciamento",
    content: "Utilizziamo cookie tecnici necessari al funzionamento e cookie analitici anonimi per migliorare il servizio. L'utente può gestire le preferenze cookie dalle impostazioni del browser."
  },
  {
    title: "13. Minori",
    content: "L'app non è destinata a minori di 16 anni. Non raccogliamo consapevolmente dati di minori. Se un genitore/tutore scopre che un minore ha fornito dati personali, può contattarci per la rimozione."
  },
  {
    title: "14. Modifiche alla Privacy Policy",
    content: "La presente privacy policy può essere aggiornata periodicamente. Le modifiche saranno comunicate tramite notifica in-app. Continuando a utilizzare l'app dopo le modifiche, l'utente accetta la versione aggiornata."
  },
  {
    title: "15. Contatti DPO",
    content: "Per qualsiasi domanda relativa alla privacy e al trattamento dei dati: support@style.app"
  }
];

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
        <p className="text-foreground font-medium">
          Style / Beauty Style Pro rispetta la privacy degli utenti e protegge i dati personali in conformità al Regolamento UE 2016/679 (GDPR).
        </p>
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-base font-display font-bold text-foreground mb-2">{s.title}</h2>
            <p>{s.content}</p>
          </section>
        ))}
        <p className="text-[10px] text-center pt-4">Conforme al GDPR (Reg. UE 2016/679) — Ultimo aggiornamento: Marzo 2026</p>
      </div>
    </MobileLayout>
  );
}
