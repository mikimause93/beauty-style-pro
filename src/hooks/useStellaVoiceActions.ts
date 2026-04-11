import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useStellaVoiceActions() {
  const navigate = useNavigate();

  const processVoiceCommand = useCallback((transcript: string): { matched: boolean; response: string; action?: string } => {
    const text = transcript.toLowerCase().trim();

    // ═══════════════════════════════════════════════════════════════
    // 1. BACK / SCROLL — hands-free essentials
    // ═══════════════════════════════════════════════════════════════
    if (text.includes("torna indietro") || text.includes("vai indietro") || text.includes("pagina precedente") || text === "indietro") {
      window.history.back();
      return { matched: true, response: "Torno alla pagina precedente!" };
    }
    if (text.includes("scorri su") || text.includes("vai su") || text.includes("scroll su")) {
      window.scrollBy({ top: -400, behavior: "smooth" });
      return { matched: true, response: "Scorro verso l'alto!" };
    }
    if (text.includes("scorri giù") || text.includes("vai giù") || text.includes("scroll giù") || text.includes("scorri in basso")) {
      window.scrollBy({ top: 400, behavior: "smooth" });
      return { matched: true, response: "Scorro verso il basso!" };
    }
    if (text.includes("vai in cima") || text.includes("torna su") || text.includes("inizio pagina")) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return { matched: true, response: "Torno all'inizio della pagina!" };
    }
    if (text.includes("vai in fondo") || text.includes("fine pagina")) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      return { matched: true, response: "Scorro fino in fondo!" };
    }
    if (text.includes("ricarica") || text.includes("aggiorna pagina") || text.includes("refresh")) {
      window.location.reload();
      return { matched: true, response: "Ricarico la pagina!" };
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. MESSAGING — must be checked before nav (contains "messaggi")
    // ═══════════════════════════════════════════════════════════════
    const messageMatch = text.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+([^:,]+?)(?:\s*[,:]\s*|\s+(?:che|dicendo|scrivendo)\s+)(.+)/);
    if (messageMatch) {
      navigate("/chat");
      toast.info(`Cerco "${messageMatch[1].trim()}" e preparo: "${messageMatch[2].trim()}"`);
      return { matched: true, response: `Cerco ${messageMatch[1].trim()} per inviare il messaggio!` };
    }
    const messageMatchSimple = text.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+(.+)/);
    if (messageMatchSimple) {
      navigate("/chat");
      return { matched: true, response: `Cerco ${messageMatchSimple[1]} per inviargli un messaggio!` };
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. CORE NAVIGATION
    // ═══════════════════════════════════════════════════════════════
    const navCommands: Array<{ patterns: string[]; path: string; response: string }> = [
      // Main tabs
      { patterns: ["vai alla home", "apri home", "torna alla home", "pagina principale"], path: "/", response: "Ti porto alla home!" },
      { patterns: ["apri chat", "vai alla chat", "messaggi", "conversazioni"], path: "/chat", response: "Apro la chat!" },
      { patterns: ["apri notifiche", "vai alle notifiche", "le notifiche"], path: "/notifications", response: "Ecco le tue notifiche!" },
      { patterns: ["apri profilo", "vai al profilo", "il mio profilo", "mostra profilo"], path: "/profile", response: "Ecco il tuo profilo!" },
      { patterns: ["modifica profilo", "cambia profilo", "edit profile", "aggiorna profilo"], path: "/profile/edit", response: "Apro la modifica del profilo!" },
      { patterns: ["apri esplora", "esplora", "scopri"], path: "/explore", response: "Apro la sezione esplora!" },
      { patterns: ["vai allo shop", "apri shop", "negozio", "prodotti"], path: "/shop", response: "Apro lo shop!" },
      { patterns: ["vai in live", "apri live", "streaming", "dirette"], path: "/live", response: "Ti porto nella sezione live!" },
      { patterns: ["apri radio", "musica", "ascolta musica"], path: "/radio", response: "Apro la radio!" },
      { patterns: ["apri shorts", "shorts", "video brevi", "reel"], path: "/shorts", response: "Apro i video shorts!" },

      // Booking & Services
      { patterns: ["prenota", "prenotazione", "fissa appuntamento", "prenota servizio"], path: "/stylists", response: "Ti mostro i professionisti disponibili!" },
      { patterns: ["le mie prenotazioni", "mostra prenotazioni", "miei appuntamenti", "appuntamenti"], path: "/my-bookings", response: "Ecco le tue prenotazioni!" },
      { patterns: ["conferma prenotazione", "conferma appuntamento"], path: "/my-bookings", response: "Ti mostro le prenotazioni da confermare!" },
      { patterns: ["cerca stilista", "trova parrucchiere", "cerca professionista"], path: "/stylists", response: "Cerco professionisti per te!" },

      // Map & Location
      { patterns: ["apri mappa", "cerca sulla mappa", "mappa", "dove sono"], path: "/map-search", response: "Apro la mappa!" },

      // Wallet & Payments
      { patterns: ["apri wallet", "vai al wallet", "portafoglio", "saldo", "il mio saldo"], path: "/wallet", response: "Apro il tuo wallet!" },
      { patterns: ["qr coin", "i miei coin", "coin", "monete"], path: "/qr-coins", response: "Ecco i tuoi QR Coins!" },
      { patterns: ["ricevute", "le mie ricevute", "fatture", "storico pagamenti"], path: "/receipts", response: "Ecco le tue ricevute!" },
      { patterns: ["acquisti", "storico acquisti", "i miei acquisti", "ordini"], path: "/purchases", response: "Ecco il tuo storico acquisti!" },
      { patterns: ["rate", "pagamenti rateali", "installments", "rateizzazione"], path: "/installments", response: "Ecco i tuoi pagamenti rateali!" },
      { patterns: ["checkout", "paga", "procedi al pagamento"], path: "/checkout", response: "Apro il checkout!" },

      // Social
      { patterns: ["crea post", "pubblica", "nuovo post", "scrivi post"], path: "/create-post", response: "Apro la creazione di un nuovo post!" },
      { patterns: ["before after", "prima e dopo", "trasformazioni"], path: "/before-after", response: "Apro le trasformazioni Prima & Dopo!" },

      // Gamification
      { patterns: ["missioni", "apri missioni", "le missioni"], path: "/missions", response: "Ecco le tue missioni!" },
      { patterns: ["sfide", "challenge", "le sfide"], path: "/challenges", response: "Ecco le sfide attive!" },
      { patterns: ["gira la ruota", "ruota della fortuna", "spin"], path: "/spin", response: "Apro la ruota della fortuna!" },
      { patterns: ["classifica", "leaderboard", "graduatoria"], path: "/leaderboard", response: "Apro la classifica!" },
      { patterns: ["promemoria", "i miei promemoria", "reminders"], path: "/reminders", response: "Ecco i tuoi promemoria!" },

      // Live & Entertainment
      { patterns: ["vai in diretta", "inizia live", "go live", "avvia live"], path: "/go-live", response: "Ti preparo per la diretta!" },
      { patterns: ["battle live", "sfida live", "live battle"], path: "/live-battle", response: "Apro le battle live!" },
      { patterns: ["quiz live", "gioca al quiz"], path: "/quiz-live", response: "Apro il Quiz Live!" },
      { patterns: ["talent game", "gioco talent"], path: "/talent-game", response: "Apro il Talent Game!" },

      // Business & Professional
      { patterns: ["dashboard business", "apri business", "gestione business", "il mio business"], path: "/business", response: "Apro la dashboard business!" },
      { patterns: ["gestisci team", "team", "dipendenti", "staff"], path: "/business/team", response: "Apro la gestione del team!" },
      { patterns: ["turni", "gestisci turni", "orari staff"], path: "/business/team/shifts", response: "Apro la gestione turni!" },
      { patterns: ["attività dipendenti", "log attività", "activity log"], path: "/business/team/activity", response: "Apro il log attività!" },
      { patterns: ["dashboard professionale", "pannello pro", "i miei guadagni"], path: "/professional-dashboard", response: "Apro la tua dashboard professionale!" },
      { patterns: ["gestisci prodotti", "i miei prodotti", "inventario"], path: "/manage-products", response: "Apro la gestione prodotti!" },

      // HR & Jobs
      { patterns: ["risorse umane", "apri hr", "lavoro", "offerte lavoro"], path: "/hr", response: "Apro la sezione lavoro!" },
      { patterns: ["crea annuncio lavoro", "pubblica offerta lavoro", "nuovo lavoro"], path: "/hr/create-job", response: "Creo un nuovo annuncio di lavoro!" },

      // Marketplace
      { patterns: ["marketplace", "apri marketplace"], path: "/marketplace", response: "Apro il marketplace!" },
      { patterns: ["crea richiesta servizio", "richiesta servizio"], path: "/marketplace/create-request", response: "Creo una richiesta di servizio!" },
      { patterns: ["crea casting", "nuovo casting", "pubblica casting"], path: "/marketplace/create-casting", response: "Creo un nuovo casting!" },

      // AI Features
      { patterns: ["assistente", "apri assistente", "ai assistant", "stella assistente"], path: "/ai-assistant", response: "Apro l'assistente AI!" },
      { patterns: ["genera look", "ai look", "nuovo look", "crea look"], path: "/ai-look", response: "Apro il generatore di look AI!" },

      // Subscriptions & Premium
      { patterns: ["abbonamento", "abbonamenti", "piano premium", "vai premium", "sottoscrizione"], path: "/subscriptions", response: "Ti mostro i piani disponibili!" },
      { patterns: ["boost profilo", "potenzia profilo", "promuovi profilo"], path: "/boost", response: "Apro il boost del profilo!" },
      { patterns: ["diventa creator", "programma creator", "candidatura creator"], path: "/become-creator", response: "Apro la candidatura creator!" },

      // Referral & Affiliate
      { patterns: ["referral", "invita amici", "invita un amico", "programma inviti"], path: "/referral", response: "Apro il programma referral!" },
      { patterns: ["affiliato", "affiliazione", "programma affiliati"], path: "/affiliate", response: "Apro il programma affiliati!" },

      // Analytics & Admin
      { patterns: ["analytics", "statistiche", "apri analytics"], path: "/analytics", response: "Apro le statistiche!" },
      { patterns: ["admin", "pannello admin", "amministrazione"], path: "/admin", response: "Apro il pannello admin!" },

      // Account & Settings
      { patterns: ["impostazioni", "apri impostazioni", "settings"], path: "/settings", response: "Apro le impostazioni!" },
      { patterns: ["verifica account", "verificami", "verifica identità"], path: "/verify-account", response: "Apro la verifica dell'account!" },

      // Events & Spa
      { patterns: ["eventi", "apri eventi", "prossimi eventi"], path: "/events", response: "Ecco gli eventi!" },
      { patterns: ["spa", "terme", "benessere", "centri spa"], path: "/spa-terme", response: "Ecco le Spa e Terme!" },

      // Offers & Auctions
      { patterns: ["offerte", "promozioni", "sconti"], path: "/offers", response: "Ecco le offerte!" },
      { patterns: ["aste", "asta", "auction"], path: "/auctions", response: "Apro le aste!" },

      // Tenant / Platform V6
      { patterns: ["tenant", "gestione tenant", "apri tenant", "il mio tenant", "piattaforma"], path: "/tenant", response: "Apro la dashboard tenant!" },

      // V7 Modules
      { patterns: ["calendario contenuti", "content calendar", "pianifica social", "piano editoriale"], path: "/content-calendar", response: "Apro il calendario contenuti!" },
      { patterns: ["previsioni", "predictive", "analisi predittiva", "ai predittiva", "previsione revenue"], path: "/predictive-analytics", response: "Apro le analisi predittive AI!" },
      { patterns: ["social automation", "automazione social", "gestisci social", "automatizza social"], path: "/social-automation", response: "Apro la gestione social automation!" },
      { patterns: ["genera sito", "website generator", "crea sito", "il mio sito", "landing page"], path: "/website-generator", response: "Apro il generatore di siti web!" },
      { patterns: ["white label", "whitelabel", "rivendi", "agenzia", "reseller"], path: "/white-label", response: "Apro il pannello white-label!" },
    ];

    for (const cmd of navCommands) {
      if (cmd.patterns.some(p => text.includes(p))) {
        navigate(cmd.path);
        return { matched: true, response: cmd.response };
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. AI PREVIEW — sector detection
    // ═══════════════════════════════════════════════════════════════
    if (text.includes("anteprima") || text.includes("preview") || text.includes("prova look") || text.includes("provare")) {
      const sector = text.match(/(?:capelli|hair)/i) ? "hair"
        : text.match(/(?:barba|barber)/i) ? "barber"
        : text.match(/(?:tattoo|tatuaggio)/i) ? "tattoo"
        : text.match(/(?:makeup|trucco)/i) ? "makeup"
        : text.match(/(?:unghie|nails)/i) ? "nails"
        : null;
      navigate(sector ? `/ai-preview/${sector}` : "/ai-preview");
      return { matched: true, response: `Apro l'anteprima AI${sector ? ` per ${sector}` : ""}!` };
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. SMART ACTIONS (non-navigation)
    // ═══════════════════════════════════════════════════════════════

    // Reminder creation
    const reminderMatch = text.match(/(?:ricordami|promemoria|ricorda)\s+(?:di\s+)?(.+?)(?:\s+(?:tra|per|domani|alle)\s+(.+))?$/);
    if (reminderMatch) {
      const what = reminderMatch[1];
      const when = reminderMatch[2] || "più tardi";
      navigate("/reminders");
      toast.info(`Promemoria: "${what}" per ${when}`);
      return { matched: true, response: `Creo un promemoria: "${what}" per ${when}!` };
    }

    // Call commands
    const callMatch = text.match(/(?:chiama|telefona|videochiama)\s+(.+)/);
    if (callMatch) {
      navigate("/chat");
      toast.info(`Cerco "${callMatch[1]}" per la chiamata...`);
      return { matched: true, response: `Cerco ${callMatch[1]} per la chiamata!` };
    }

    // Follow/Add friend
    const addMatch = text.match(/(?:aggiungi|segui)\s+(.+)/);
    if (addMatch) {
      navigate("/search");
      toast.info(`Cerco "${addMatch[1]}"...`);
      return { matched: true, response: `Cerco ${addMatch[1]} per seguirlo!` };
    }

    // Search
    const searchMatch = text.match(/^cerca\s+(.+)$/);
    if (searchMatch) {
      navigate(`/search?q=${encodeURIComponent(searchMatch[1].trim())}`);
      return { matched: true, response: `Cerco "${searchMatch[1].trim()}"!` };
    }

    // Map search with distance
    const matchDistanceMatch = text.match(/cerca\s+(?:match|amici|persone|stilisti|saloni)\s+(?:a|entro|vicino|nel\s+raggio\s+di)\s*(\d+)\s*km/);
    if (matchDistanceMatch) {
      navigate(`/map-search?radius=${matchDistanceMatch[1]}`);
      return { matched: true, response: `Cerco risultati entro ${matchDistanceMatch[1]} km!` };
    }
    if (text.includes("cerca match") || text.includes("trova match") || text.includes("match vicini") || text.includes("chi c'è vicino")) {
      navigate("/map-search");
      return { matched: true, response: "Apro la mappa dei risultati vicino a te!" };
    }

    // Like
    if (text.match(/metti\s+like|dai\s+like|mi\s+piace/)) {
      toast.success("❤️ Like aggiunto!");
      return { matched: true, response: "Ho messo like!" };
    }

    // Share
    if (text.includes("condividi") || text.includes("share")) {
      if (navigator.share) {
        navigator.share({ title: "STYLE", url: window.location.href }).catch(() => {});
      }
      return { matched: true, response: "Apro la condivisione!" };
    }

    // Logout
    if (text.includes("esci") || text.includes("logout") || text.includes("disconnetti")) {
      return { matched: true, response: "Per sicurezza, vai nelle impostazioni per uscire.", action: "navigate:/settings" };
    }

    // V7 PHASE 3 — Global & Enterprise
    if (text.includes("impostazioni globali") || text.includes("multi lingua") || text.includes("multi country") || text.includes("lingue e valute")) {
      navigate("/global-settings");
      return { matched: true, response: "Apro le impostazioni globali!" };
    }
    if (text.includes("enterprise api") || text.includes("api key") || text.includes("webhook") || text.includes("chiavi api")) {
      navigate("/enterprise-api");
      return { matched: true, response: "Apro la dashboard Enterprise API!" };
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. THEME CONTROLS
    // ═══════════════════════════════════════════════════════════════
    if (text.includes("tema chiaro") || text.includes("modalità chiara") || text.includes("light mode")) {
      return { matched: true, response: "Attivo il tema chiaro!", action: "theme:light" };
    }
    if (text.includes("tema scuro") || text.includes("modalità scura") || text.includes("dark mode")) {
      return { matched: true, response: "Attivo il tema scuro!", action: "theme:dark" };
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. HELP — list available commands
    // ═══════════════════════════════════════════════════════════════
    if (text.includes("aiuto") || text.includes("help") || text.includes("cosa puoi fare") || text.includes("comandi")) {
      return {
        matched: true,
        response: "Posso fare tutto! Navigazione: 'apri home', 'vai allo shop', 'apri chat'. " +
          "Azioni: 'prenota', 'crea post', 'cerca sulla mappa'. " +
          "Messaggi: 'invia messaggio a Mario'. " +
          "AI: 'prova look capelli', 'genera look'. " +
          "Business: 'dashboard business', 'gestisci team'. " +
          "E molto altro! Prova a chiedere qualsiasi cosa."
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // NOT MATCHED — fallback to AI
    // ═══════════════════════════════════════════════════════════════
    return {
      matched: false,
      response: "Non ho riconosciuto un comando diretto. Lascio che Stella AI ti risponda con intelligenza artificiale..."
    };
  }, [navigate]);

  return { processVoiceCommand };
}
