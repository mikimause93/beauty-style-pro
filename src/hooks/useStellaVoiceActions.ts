import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface VoiceAction {
  patterns: string[];
  action: (params: string) => void;
  description: string;
}

export function useStellaVoiceActions() {
  const navigate = useNavigate();

  const processVoiceCommand = useCallback((transcript: string): { matched: boolean; response: string } => {
    const text = transcript.toLowerCase().trim();

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
      navigate("/stylists");
      return { matched: true, response: "Ti mostro i professionisti disponibili per prenotare!" };
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
    if (text.includes("cerca") || text.includes("esplora")) {
      navigate("/explore");
      return { matched: true, response: "Apro la sezione esplora!" };
    }
    if (text.includes("crea post") || text.includes("pubblica")) {
      navigate("/create-post");
      return { matched: true, response: "Apro la creazione di un nuovo post!" };
    }

    // Message commands
    const messageMatch = text.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+(.+)/);
    if (messageMatch) {
      const recipient = messageMatch[1];
      navigate("/chat");
      toast.info(`Cerco "${recipient}" nella chat...`);
      return { matched: true, response: `Cerco ${recipient} per inviargli un messaggio!` };
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

    // Add friend
    const addMatch = text.match(/(?:aggiungi|segui)\s+(.+)/);
    if (addMatch) {
      navigate("/search");
      toast.info(`Cerco "${addMatch[1]}"...`);
      return { matched: true, response: `Cerco ${addMatch[1]} per seguirlo!` };
    }

    return { matched: false, response: "Non ho capito il comando. Prova a dire 'apri chat', 'prenota', 'vai alla home' o 'invia messaggio a...'." };
  }, [navigate]);

  return { processVoiceCommand };
}
