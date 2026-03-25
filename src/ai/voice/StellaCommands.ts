// src/ai/voice/StellaCommands.ts
// Enhanced command parser — extends useStellaVoiceActions with V3 commands.
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CommandResult {
  matched: boolean;
  response: string;
  action?: string;
}

export function useStellaCommands() {
  const navigate = useNavigate();

  const parseCommand = useCallback((transcript: string): CommandResult => {
    const text = transcript.toLowerCase().trim();

    // ── Navigation ──────────────────────────────────────────────────────
    if (/vai alla home|apri home|homepage/.test(text)) {
      navigate('/');
      return { matched: true, response: 'Ti porto alla home!' };
    }
    if (/apri chat|vai alla chat|messaggi/.test(text)) {
      navigate('/chat');
      return { matched: true, response: 'Apro la chat!' };
    }
    if (/notifiche/.test(text)) {
      navigate('/notifications');
      return { matched: true, response: 'Ecco le tue notifiche!' };
    }
    if (/apri profilo|vai al profilo/.test(text)) {
      navigate('/profile');
      return { matched: true, response: 'Ecco il tuo profilo!' };
    }
    if (/wallet|portafoglio/.test(text)) {
      navigate('/wallet');
      return { matched: true, response: 'Apro il tuo wallet!' };
    }
    if (/prenota|prenotazione/.test(text)) {
      navigate('/stylists');
      return { matched: true, response: 'Ti mostro i professionisti disponibili!' };
    }
    if (/mappa|map-search/.test(text)) {
      navigate('/map-search');
      return { matched: true, response: 'Apro la mappa!' };
    }
    if (/shop|negozio/.test(text)) {
      navigate('/shop');
      return { matched: true, response: 'Apro lo shop!' };
    }
    if (/missioni/.test(text)) {
      navigate('/missions');
      return { matched: true, response: 'Ecco le tue missioni!' };
    }
    if (/ruota della fortuna|spin/.test(text)) {
      navigate('/spin');
      return { matched: true, response: 'Apro la ruota della fortuna!' };
    }
    if (/vai in live|apri live/.test(text)) {
      navigate('/live');
      return { matched: true, response: 'Ti porto nella sezione live!' };
    }
    if (/radio|musica/.test(text)) {
      navigate('/radio');
      return { matched: true, response: 'Apro la radio!' };
    }
    if (/impostazioni/.test(text)) {
      navigate('/settings');
      return { matched: true, response: 'Apro le impostazioni!' };
    }
    if (/esplora/.test(text)) {
      navigate('/explore');
      return { matched: true, response: 'Apro la sezione esplora!' };
    }
    if (/crea post|pubblica/.test(text)) {
      navigate('/create-post');
      return { matched: true, response: 'Apro la creazione post!' };
    }
    if (/le mie prenotazioni|mostra prenotazioni/.test(text)) {
      navigate('/my-bookings');
      return { matched: true, response: 'Ecco le tue prenotazioni!' };
    }
    if (/classifica|leaderboard/.test(text)) {
      navigate('/leaderboard');
      return { matched: true, response: 'Apro la classifica!' };
    }
    if (/sfide|challenge/.test(text)) {
      navigate('/challenges');
      return { matched: true, response: 'Ecco le sfide attive!' };
    }
    if (/shorts|video brevi/.test(text)) {
      navigate('/shorts');
      return { matched: true, response: 'Apro i video shorts!' };
    }
    if (/eventi/.test(text)) {
      navigate('/events');
      return { matched: true, response: 'Ecco gli eventi!' };
    }
    if (/marketplace/.test(text)) {
      navigate('/marketplace');
      return { matched: true, response: 'Apro il marketplace!' };
    }
    if (/spa|terme|benessere/.test(text)) {
      navigate('/spa-terme');
      return { matched: true, response: 'Ecco le Spa e Terme!' };
    }
    if (/analytics|statistiche|dashboard/.test(text)) {
      navigate('/analytics');
      return { matched: true, response: 'Apro le statistiche!' };
    }
    if (/quiz/.test(text)) {
      navigate('/quiz-live');
      return { matched: true, response: 'Apro il Quiz Live!' };
    }
    if (/talent/.test(text)) {
      navigate('/talent-game');
      return { matched: true, response: 'Apro il Talent Game!' };
    }
    if (/referral|invita amici/.test(text)) {
      navigate('/referral');
      return { matched: true, response: 'Apro il programma referral!' };
    }
    if (/work mode|modalità lavoro|lavoro/.test(text)) {
      navigate('/professional-dashboard');
      return { matched: true, response: 'Attivo la modalità lavoro!' };
    }

    // ── Scroll ───────────────────────────────────────────────────────────
    if (/scorri su|vai su|scroll su/.test(text)) {
      window.scrollBy({ top: -300, behavior: 'smooth' });
      return { matched: true, response: 'Scorro verso l\'alto!' };
    }
    if (/scorri giù|vai giù|scroll giù|scorri in basso/.test(text)) {
      window.scrollBy({ top: 300, behavior: 'smooth' });
      return { matched: true, response: 'Scorro verso il basso!' };
    }

    // ── Back navigation ────────────────────────────────────────────────
    if (/torna indietro|vai indietro|pagina precedente|^indietro$/.test(text)) {
      window.history.back();
      return { matched: true, response: 'Torno alla pagina precedente!' };
    }

    // ── Theme ─────────────────────────────────────────────────────────
    if (/tema chiaro|light mode/.test(text)) {
      toast.info('Cambio al tema chiaro!');
      return { matched: true, response: 'Attivo il tema chiaro!', action: 'theme:light' };
    }
    if (/tema scuro|dark mode/.test(text)) {
      toast.info('Cambio al tema scuro!');
      return { matched: true, response: 'Attivo il tema scuro!', action: 'theme:dark' };
    }

    // ── Search ─────────────────────────────────────────────────────────
    const searchMatch = text.match(/^cerca\s+(.+)$/);
    if (searchMatch) {
      navigate(`/search?q=${encodeURIComponent(searchMatch[1].trim())}`);
      return { matched: true, response: `Cerco "${searchMatch[1].trim()}"!` };
    }

    // ── Message ────────────────────────────────────────────────────────
    const msgMatch = text.match(/(?:invia|manda)\s+(?:un\s+)?messaggio\s+a\s+(.+)/);
    if (msgMatch) {
      navigate('/chat');
      toast.info(`Cerco "${msgMatch[1]}" nella chat...`);
      return { matched: true, response: `Cerco ${msgMatch[1]} per inviargli un messaggio!` };
    }

    return { matched: false, response: '' };
  }, [navigate]);

  return { parseCommand };
}
