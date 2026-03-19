import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useStella, STELLA_LIMITS } from "@/contexts/StellaContext";

export function useStellaVoiceActions() {
  const navigate = useNavigate();
  const { canPerformAction, recordAction, requestConfirmation, getRemainingActions } = useStella();

  const processVoiceCommand = useCallback((transcript: string): { matched: boolean; response: string; action?: string } => {
    const text = transcript.toLowerCase().trim();

    // ─── Back navigation (hands-free essential) ────────────────────────────
    if (text.includes("torna indietro") || text.includes("vai indietro") || text.includes("pagina precedente") || text === "indietro") {
      window.history.back();
      return { matched: true, response: "Torno alla pagina precedente!" };
    }

    // ─── Scroll commands ────────────────────────────────────────────────────
    if (text.includes("scorri su") || text.includes("vai su") || text.includes("scroll su")) {
      window.scrollBy({ top: -300, behavior: "smooth" });
      return { matched: true, response: "Scorro verso l'alto!" };
    }
    if (text.includes("scorri giù") || text.includes("vai giù") || text.includes("scroll giù") || text.includes("scorri in basso")) {
      window.scrollBy({ top: 300, behavior: "smooth" });
      return { matched: true, response: "Scorro verso il basso!" };
    }

    // Message commands must be checked first (before navigation) because "messaggio" contains "messaggi"
    const messageMatch = text.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+([^:,]+?)(?:\s*[,:]\s*|\s+(?:che|dicendo|scrivendo)\s+)(.+)/);
    if (messageMatch) {
      const recipient = messageMatch[1].trim();
      const content = messageMatch[2].trim();
      const msgCheck = canPerformAction("message");
      if (!msgCheck.allowed) {
        toast.error(msgCheck.reason ?? "Limite messaggi raggiunto");
        return { matched: true, response: msgCheck.reason ?? "Limite messaggi orario raggiunto!" };
      }
      requestConfirmation(
        "Invia messaggio",
        `Invia a ${recipient}: "${content}"?`,
        () => {
          recordAction("message");
          navigate("/chat");
          toast.success(`Messaggio preparato per ${recipient}`);
        }
      );
      return { matched: true, response: `Vuoi inviare a ${recipient}: "${content}"? Conferma per procedere.` };
    }
    const messageMatchSimple = text.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+(.+)/);
    if (messageMatchSimple) {
      const recipient = messageMatchSimple[1];
      const msgCheck2 = canPerformAction("message");
      if (!msgCheck2.allowed) {
        toast.error(msgCheck2.reason ?? "Limite messaggi raggiunto");
        return { matched: true, response: msgCheck2.reason ?? "Limite messaggi orario raggiunto!" };
      }
      requestConfirmation(
        "Invia messaggio",
        `Apri chat con ${recipient}?`,
        () => {
          recordAction("message");
          navigate("/chat");
          toast.info(`Cerco "${recipient}" nella chat...`);
        }
      );
      return { matched: true, response: `Vuoi aprire la chat con ${recipient}? Conferma per procedere.` };
    }

    // Navigation commands
    if (text.includes("vai alla home") || text.includes("apri home")) {
      navigate("/");
      return { matched: true, response: "Ti porto alla home!" };
    }
    if (text.includes("apri chat") || text.includes("vai alla chat") || text.includes("messaggi")) {
      navigate("/chat");
      return { matched: true, response: "Apro la chat!" };
    }
    if (text.includes("apri notifiche") || text.includes("dimmi le notifiche") || text.includes("tutte le notifiche")) {
      navigate("/notifications");
      return { matched: true, response: "Ecco le tue notifiche!" };
    }
    if (text.includes("apri profilo") || text.includes("vai al profilo")) {
      navigate("/profile");
      return { matched: true, response: "Ecco il tuo profilo!" };
    }
    if (text.includes("apri wallet") || text.includes("vai al wallet") || text.includes("portafoglio")) {
      navigate("/wallet");
      return { matched: true, response: "Apro il tuo wallet!" };
    }
    if (text.includes("prenota") || text.includes("prenotazione")) {
      requestConfirmation(
        "Prenota appuntamento",
        "Apro la selezione professionisti per la prenotazione. Confermi?",
        () => { navigate("/stylists"); }
      );
      return { matched: true, response: "Vuoi aprire la sezione prenotazioni? Conferma per procedere." };
    }
    if (text.includes("apri mappa") || text.includes("cerca sulla mappa")) {
      navigate("/map-search");
      return { matched: true, response: "Apro la mappa!" };
    }
    if (text.includes("vai allo shop") || text.includes("apri shop") || text.includes("negozio")) {
      navigate("/shop");
      return { matched: true, response: "Apro lo shop!" };
    }
    if (text.includes("vai alle missioni") || text.includes("apri missioni")) {
      navigate("/missions");
      return { matched: true, response: "Ecco le tue missioni!" };
    }
    if (text.includes("gira la ruota") || text.includes("ruota della fortuna")) {
      navigate("/spin");
      return { matched: true, response: "Apro la ruota della fortuna!" };
    }
    if (text.includes("vai in live") || text.includes("apri live")) {
      navigate("/live");
      return { matched: true, response: "Ti porto nella sezione live!" };
    }
    if (text.includes("apri radio") || text.includes("musica")) {
      navigate("/radio");
      return { matched: true, response: "Apro la radio!" };
    }
    if (text.includes("impostazioni") || text.includes("apri impostazioni")) {
      navigate("/settings");
      return { matched: true, response: "Apro le impostazioni!" };
    }
    if (text.includes("esplora")) {
      navigate("/explore");
      return { matched: true, response: "Apro la sezione esplora!" };
    }
    if (text.includes("crea post") || text.includes("pubblica")) {
      navigate("/create-post");
      return { matched: true, response: "Apro la creazione di un nuovo post!" };
    }
    if (text.includes("le mie prenotazioni") || text.includes("mostra prenotazioni")) {
      navigate("/my-bookings");
      return { matched: true, response: "Ecco le tue prenotazioni!" };
    }
    if (text.includes("classifica") || text.includes("leaderboard")) {
      navigate("/leaderboard");
      return { matched: true, response: "Apro la classifica!" };
    }
    if (text.includes("sfide") || text.includes("challenge")) {
      navigate("/challenges");
      return { matched: true, response: "Ecco le sfide attive!" };
    }
    if (text.includes("shorts") || text.includes("video brevi")) {
      navigate("/shorts");
      return { matched: true, response: "Apro i video shorts!" };
    }
    if (text.includes("eventi") || text.includes("apri eventi")) {
      navigate("/events");
      return { matched: true, response: "Ecco gli eventi!" };
    }
    if (text.includes("marketplace") || text.includes("apri marketplace")) {
      navigate("/marketplace");
      return { matched: true, response: "Apro il marketplace!" };
    }
    if (text.includes("apri tema") || text.includes("cambia tema") || text.includes("tema chiaro") || text.includes("tema scuro")) {
      navigate("/settings");
      return { matched: true, response: "Apro le impostazioni per cambiare tema!" };
    }
    if (text.includes("spa") || text.includes("terme") || text.includes("benessere")) {
      navigate("/spa-terme");
      return { matched: true, response: "Ecco le Spa e Terme!" };
    }
    if (text.includes("quiz") || text.includes("gioca al quiz")) {
      navigate("/quiz-live");
      return { matched: true, response: "Apro il Quiz Live!" };
    }
    if (text.includes("talent") || text.includes("gioco talent")) {
      navigate("/talent-game");
      return { matched: true, response: "Apro il Talent Game!" };
    }
    if (text.includes("referral") || text.includes("invita amici")) {
      navigate("/referral");
      return { matched: true, response: "Apro il programma referral!" };
    }

    // Call commands
    const callMatch = text.match(/(?:chiama|telefona|videochiama)\s+(.+)/);
    if (callMatch) {
      navigate("/chat");
      toast.info(`Cerco "${callMatch[1]}" per la chiamata...`);
      return { matched: true, response: `Cerco ${callMatch[1]} per la chiamata!` };
    }

    // Booking confirmation
    if (text.includes("conferma prenotazione") || text.includes("conferma appuntamento")) {
      navigate("/my-bookings");
      return { matched: true, response: "Ti mostro le prenotazioni da confermare!" };
    }

    // Read notifications
    if (text.includes("leggi notifiche") || text.includes("dimmi le notifiche") || text.includes("tutte le notifiche")) {
      navigate("/notifications");
      return { matched: true, response: "Ecco le tue notifiche! Le leggo per te." };
    }

    // Add friend / follow - rate limited
    const addMatch = text.match(/(?:aggiungi|segui)\s+(.+)/);
    if (addMatch) {
      const followResult = canPerformAction("follow");
      if (!followResult.allowed) {
        toast.error(followResult.reason ?? "Limite follow raggiunto");
        return { matched: true, response: followResult.reason ?? "Limite follow giornaliero raggiunto!" };
      }
      const target = addMatch[1].trim();
      requestConfirmation(
        "Segui utente",
        `Vuoi seguire "${target}"?`,
        () => {
          recordAction("follow");
          navigate("/search");
          toast.info(`Cerco "${target}"...`);
        }
      );
      return { matched: true, response: `Vuoi seguire ${target}? Conferma per procedere.` };
    }

    // Generic search — navigate to search page with query
    const searchMatch = text.match(/^cerca\s+(.+)$/);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      navigate(`/search?q=${encodeURIComponent(query)}`);
      return { matched: true, response: `Cerco "${query}"!` };
    }

    // Like commands - rate limited to STELLA_LIMITS.likes_per_day per day
    if (text.match(/metti\s+like|dai\s+like|aggiungi\s+like|mi\s+piace/)) {
      const result = canPerformAction("like");
      if (!result.allowed) {
        toast.error(result.reason ?? "Limite like raggiunto");
        return { matched: true, response: result.reason ?? `Limite di ${STELLA_LIMITS.likes_per_day} like al giorno raggiunto!` };
      }
      recordAction("like");
      const remaining = getRemainingActions("like");
      navigate("/");
      toast.success(`Like aggiunto! (${remaining} rimasti oggi)`);
      return { matched: true, response: `Ho messo like al post! Ti restano ${remaining} like oggi.` };
    }

    // Search match on map
    const matchDistanceMatch = text.match(/cerca\s+(?:match|amici|persone|stilisti)\s+(?:a|entro|vicino|nel\s+raggio\s+di)\s*(\d+)\s*km/);
    if (matchDistanceMatch) {
      const km = matchDistanceMatch[1];
      navigate(`/map-search?radius=${km}`);
      toast.info(`Cerco match entro ${km} km sulla mappa...`);
      return { matched: true, response: `Cerco match entro ${km} km sulla mappa intelligente!` };
    }
    if (text.includes("cerca match") || text.includes("trova match") || text.includes("match vicini")) {
      navigate("/map-search");
      return { matched: true, response: "Apro la mappa dei match vicino a te!" };
    }

    // Theme voice commands - direct toggle
    if (text.includes("tema chiaro") || text.includes("modalità chiara") || text.includes("light mode")) {
      toast.info("Cambio al tema chiaro!");
      return { matched: true, response: "Attivo il tema chiaro!", action: "theme:light" };
    }
    if (text.includes("tema scuro") || text.includes("modalità scura") || text.includes("dark mode")) {
      toast.info("Cambio al tema scuro!");
      return { matched: true, response: "Attivo il tema scuro!", action: "theme:dark" };
    }

    return { matched: false, response: "Non ho capito il comando. Prova a dire 'apri chat', 'prenota', 'vai alla home', 'torna indietro', 'invia messaggio a...', 'cerca [termine]', 'cerca match a 10 km', o 'dimmi le notifiche'." };
  }, [navigate, canPerformAction, recordAction, requestConfirmation, getRemainingActions]);

  return { processVoiceCommand };
}
