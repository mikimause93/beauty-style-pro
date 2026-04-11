import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Rate limits ──────────────────────────────────────────────────────────────
const LIMITS = {
  like: { perHour: 20, cooldownMs: 3000 },
  comment: { perHour: 10, cooldownMs: 5000 },
  message: { perHour: 20, cooldownMs: 3000 },
  follow: { perHour: 15, cooldownMs: 5000 },
  navigate: { perHour: 999, cooldownMs: 0 },
  book: { perHour: 10, cooldownMs: 0 },
  info: { perHour: 999, cooldownMs: 0 },
  search: { perHour: 999, cooldownMs: 0 },
} as const;

const CONFIRMATION_REQUIRED = new Set([
  'book', 'payment', 'follow', 'message', 'delete', 'spend_coins',
]);

export interface StellaCommand {
  id: string;
  type: 'navigate' | 'search' | 'message' | 'like' | 'comment' | 'follow' | 'book' | 'info' | 'schedule' | 'call' | 'payment';
  text: string;
  response: string;
  requiresConfirmation: boolean;
  execute: () => void;
}

interface StellaMessage {
  id: string;
  role: 'user' | 'stella';
  content: string;
  type?: 'text' | 'confirmation' | 'action_result';
  pending?: StellaCommand;
}

const actionCounts = new Map<string, { count: number; resetAt: number }>();

function checkLimit(actionType: string): { allowed: boolean; remaining: number } {
  const limit = LIMITS[actionType as keyof typeof LIMITS] ?? { perHour: 30 };
  const now = Date.now();
  let entry = actionCounts.get(actionType);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 3600000 };
    actionCounts.set(actionType, entry);
  }
  return { allowed: limit.perHour - entry.count > 0, remaining: limit.perHour - entry.count };
}

function recordAction(actionType: string) {
  const now = Date.now();
  let entry = actionCounts.get(actionType);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 3600000 };
    actionCounts.set(actionType, entry);
  }
  entry.count++;
}

export function useStellaAgent() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { speak, cancel: cancelTTS, speaking } = useVoiceSynthesis();
  const {
    isListening, transcript, interimTranscript,
    startListening, stopListening, resetTranscript,
    isWakeWordListening, startWakeWordListening, stopWakeWordListening, isSupported,
  } = useVoiceRecognition({
    continuous: false,
    interimResults: true,
    language: 'it-IT',
    wakeWordEnabled: true,
    wakeWords: ['stella', 'hey stella', 'ehi stella', 'ciao stella'],
    onWakeWordDetected: () => {
      setIsOpen(true);
      speak('Ciao! Come posso aiutarti?');
    },
  });

  const [messages, setMessages] = useState<StellaMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [wakeWordActive, setWakeWordActive] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<StellaCommand | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);

  // Auto-start wake word listening on mount
  useEffect(() => {
    if (isSupported && wakeWordActive && !isWakeWordListening && !isListening) {
      startWakeWordListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-restart wake word after command processing
  useEffect(() => {
    if (transcript && !isListening) {
      handleCommand(transcript);
      resetTranscript();
      // Restart wake word listening after processing
      if (wakeWordActive && !isWakeWordListening) {
        setTimeout(() => startWakeWordListening(), 1500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  const addMessage = useCallback((msg: Omit<StellaMessage, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString() + Math.random() }]);
  }, []);

  const stellaSpeak = useCallback((text: string) => {
    if (ttsEnabled) speak(text);
  }, [ttsEnabled, speak]);

  // ── FULL NAVIGATION MAP (all app routes) ─────────────────────────────────
  const parseCommand = useCallback((text: string): StellaCommand | null => {
    const t = text.toLowerCase().trim();

    const navRoutes: Array<{ patterns: string[]; route: string; response: string }> = [
      // Core
      { patterns: ['vai alla home', 'apri home', 'torna alla home', 'home page'], route: '/', response: 'Ti porto alla home!' },
      { patterns: ['apri chat', 'vai alla chat', 'messaggi', 'apri messaggi'], route: '/chat', response: 'Apro la chat!' },
      { patterns: ['apri notifiche', 'le notifiche', 'dimmi le notifiche', 'vedi notifiche'], route: '/notifications', response: 'Ecco le tue notifiche!' },
      { patterns: ['apri profilo', 'vai al profilo', 'il mio profilo', 'modifica profilo'], route: '/profile', response: 'Ecco il tuo profilo!' },
      { patterns: ['modifica profilo', 'edit profilo', 'cambia profilo'], route: '/profile/edit', response: 'Apro la modifica del profilo!' },
      { patterns: ['apri wallet', 'vai al wallet', 'portafoglio', 'i miei soldi'], route: '/wallet', response: 'Apro il tuo wallet!' },
      { patterns: ['apri mappa', 'cerca sulla mappa', 'mappa', 'professionisti vicini'], route: '/map-search', response: 'Apro la mappa!' },
      { patterns: ['vai allo shop', 'apri shop', 'negozio', 'prodotti'], route: '/shop', response: 'Apro lo shop!' },
      { patterns: ['vai alle missioni', 'apri missioni', 'missioni'], route: '/missions', response: 'Ecco le tue missioni!' },
      { patterns: ['gira la ruota', 'ruota della fortuna', 'spin'], route: '/spin', response: 'Apro la ruota della fortuna!' },
      { patterns: ['vai in live', 'apri live', 'streaming'], route: '/live', response: 'Ti porto nella sezione live!' },
      { patterns: ['apri radio', 'musica', 'radio'], route: '/radio', response: 'Apro la radio!' },
      { patterns: ['impostazioni', 'apri impostazioni', 'settings'], route: '/settings', response: 'Apro le impostazioni!' },
      { patterns: ['esplora', 'apri esplora', 'scopri'], route: '/explore', response: 'Apro la sezione esplora!' },
      { patterns: ['crea post', 'pubblica', 'nuovo post', 'scrivi post'], route: '/create-post', response: 'Apro la creazione di un nuovo post!' },
      { patterns: ['le mie prenotazioni', 'mostra prenotazioni', 'i miei appuntamenti'], route: '/my-bookings', response: 'Ecco le tue prenotazioni!' },
      { patterns: ['classifica', 'leaderboard'], route: '/leaderboard', response: 'Apro la classifica!' },
      { patterns: ['sfide', 'challenge', 'sfida'], route: '/challenges', response: 'Ecco le sfide attive!' },
      { patterns: ['shorts', 'video brevi', 'reels'], route: '/shorts', response: 'Apro i video shorts!' },
      { patterns: ['eventi', 'apri eventi'], route: '/events', response: 'Ecco gli eventi!' },
      { patterns: ['marketplace', 'apri marketplace', 'mercato'], route: '/marketplace', response: 'Apro il marketplace!' },
      { patterns: ['spa', 'terme', 'benessere'], route: '/spa-terme', response: 'Ecco le Spa e Terme!' },
      { patterns: ['quiz', 'gioca al quiz', 'quiz live'], route: '/quiz-live', response: 'Apro il Quiz Live!' },
      { patterns: ['talent', 'gioco talent', 'talent game'], route: '/talent-game', response: 'Apro il Talent Game!' },
      { patterns: ['referral', 'invita amici', 'programma inviti'], route: '/referral', response: 'Apro il programma referral!' },
      { patterns: ['abbonamento', 'abbonamenti', 'subscription', 'piano'], route: '/subscriptions', response: 'Ecco i piani di abbonamento!' },
      { patterns: ['promemoria', 'reminder', 'ricordami'], route: '/reminders', response: 'Ecco i tuoi promemoria!' },
      { patterns: ['stilisti', 'parrucchieri', 'professionisti', 'trova stilista'], route: '/stylists', response: 'Ecco i professionisti!' },
      { patterns: ['qr coin', 'le mie monete', 'coins', 'qr coins'], route: '/qr-coins', response: 'Ecco i tuoi QR Coins!' },
      { patterns: ['prima dopo', 'before after', 'trasformazioni'], route: '/before-after', response: 'Apro le trasformazioni!' },
      { patterns: ['offerte', 'promozioni', 'sconti'], route: '/offers', response: 'Ecco le offerte!' },
      { patterns: ['aste', 'asta', 'auction'], route: '/auctions', response: 'Apro le aste!' },
      { patterns: ['ricevute', 'scontrini', 'receipts'], route: '/receipts', response: 'Ecco le tue ricevute!' },
      { patterns: ['verifica account', 'verifica profilo', 'verificami'], route: '/verify-account', response: 'Apro la verifica account!' },
      // Business & HR
      { patterns: ['dashboard business', 'pannello business', 'gestione attività'], route: '/business', response: 'Apro la dashboard business!' },
      { patterns: ['gestisci team', 'team dipendenti', 'i miei dipendenti'], route: '/business/team', response: 'Apro la gestione del team!' },
      { patterns: ['turni dipendenti', 'gestisci turni', 'orari lavoro'], route: '/business/team/shifts', response: 'Apro la gestione turni!' },
      { patterns: ['risorse umane', 'hr', 'assunzioni', 'lavoro'], route: '/hr', response: 'Apro la sezione HR!' },
      { patterns: ['crea annuncio lavoro', 'pubblica offerta lavoro'], route: '/hr/create-job', response: 'Creo un nuovo annuncio di lavoro!' },
      { patterns: ['gestisci prodotti', 'i miei prodotti', 'catalogo'], route: '/manage-products', response: 'Apro la gestione prodotti!' },
      { patterns: ['analytics', 'statistiche', 'dati'], route: '/analytics', response: 'Apro le statistiche!' },
      { patterns: ['affiliato', 'affiliate', 'programma affiliazione'], route: '/affiliate', response: 'Apro il programma affiliazione!' },
      { patterns: ['dashboard professionale', 'pannello pro'], route: '/professional-dashboard', response: 'Apro la dashboard professionale!' },
      { patterns: ['boost profilo', 'promuovi profilo', 'sponsorizza'], route: '/boost', response: 'Apro il boost profilo!' },
      { patterns: ['diventa creator', 'creator', 'applicazione creator'], route: '/become-creator', response: 'Apro l\'applicazione creator!' },
      // AI features
      { patterns: ['assistente ai', 'stella', 'ai assistant', 'assistente'], route: '/ai-assistant', response: 'Apro l\'assistente AI!' },
      { patterns: ['ai look', 'prova look', 'genera look', 'cambio look', 'prova taglio', 'prova colore'], route: '/ai-look', response: 'Apro il generatore di look AI!' },
      { patterns: ['anteprima ai', 'ai preview', 'prova stile'], route: '/ai-preview', response: 'Apro l\'anteprima AI!' },
      // V7 modules
      { patterns: ['calendario contenuti', 'content calendar', 'pianifica contenuti', 'piano editoriale'], route: '/content-calendar', response: 'Apro il calendario contenuti!' },
      { patterns: ['analisi predittiva', 'predictive', 'previsioni', 'forecasting', 'predittiva'], route: '/predictive-analytics', response: 'Apro l\'analisi predittiva!' },
      { patterns: ['automazione social', 'social automation', 'gestisci social', 'social media'], route: '/social-automation', response: 'Apro l\'automazione social!' },
      { patterns: ['genera sito', 'website generator', 'crea sito', 'landing page'], route: '/website-generator', response: 'Apro il generatore di siti web!' },
      { patterns: ['white label', 'agenzia', 'rivendita', 'reseller'], route: '/white-label', response: 'Apro il pannello White Label!' },
      { patterns: ['impostazioni globali', 'multi lingua', 'multi country', 'lingue e valute'], route: '/global-settings', response: 'Apro le impostazioni globali!' },
      { patterns: ['enterprise api', 'api key', 'webhook', 'chiavi api', 'api'], route: '/enterprise-api', response: 'Apro la dashboard Enterprise API!' },
      { patterns: ['tenant', 'pannello tenant', 'multi tenant'], route: '/tenant', response: 'Apro il pannello tenant!' },
      // Live features
      { patterns: ['vai live', 'go live', 'inizia streaming', 'avvia diretta'], route: '/go-live', response: 'Ti preparo per andare in diretta!' },
      { patterns: ['battle live', 'sfida live', 'live battle'], route: '/live-battle', response: 'Apro le Live Battle!' },
      { patterns: ['trasformazione', 'challenge trasformazione'], route: '/transformation-challenge', response: 'Apro le sfide di trasformazione!' },
      // Payments
      { patterns: ['checkout', 'paga', 'procedi al pagamento'], route: '/checkout', response: 'Apro il checkout!' },
      { patterns: ['rate', 'pagamento rateale', 'finanziamento'], route: '/installments', response: 'Apro i pagamenti rateali!' },
      { patterns: ['acquisti', 'storico acquisti', 'cronologia acquisti'], route: '/purchases', response: 'Ecco lo storico acquisti!' },
    ];

    for (const nav of navRoutes) {
      if (nav.patterns.some(p => t.includes(p))) {
        return {
          id: Date.now().toString(), type: 'navigate', text,
          response: nav.response, requiresConfirmation: false,
          execute: () => navigate(nav.route),
        };
      }
    }

    // ── BACK / SCROLL ─────────────────────────────────────────────────────
    if (t.includes('torna indietro') || t.includes('vai indietro') || t === 'indietro') {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Torno indietro!', requiresConfirmation: false, execute: () => window.history.back() };
    }
    if (t.includes('scorri su') || t.includes('vai su')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Scorro verso l\'alto!', requiresConfirmation: false, execute: () => window.scrollBy({ top: -400, behavior: 'smooth' }) };
    }
    if (t.includes('scorri giù') || t.includes('vai giù') || t.includes('scorri in basso')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Scorro verso il basso!', requiresConfirmation: false, execute: () => window.scrollBy({ top: 400, behavior: 'smooth' }) };
    }
    if (t.includes('vai in cima') || t.includes('torna su') || t.includes('inizio pagina')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Torno all\'inizio!', requiresConfirmation: false, execute: () => window.scrollTo({ top: 0, behavior: 'smooth' }) };
    }
    if (t.includes('vai in fondo') || t.includes('fine pagina')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Scorro in fondo!', requiresConfirmation: false, execute: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }) };
    }
    if (t.includes('ricarica') || t.includes('aggiorna pagina') || t.includes('refresh')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Ricarico la pagina!', requiresConfirmation: false, execute: () => window.location.reload() };
    }

    // ── THEME ─────────────────────────────────────────────────────────────
    if (t.includes('tema chiaro') || t.includes('light mode') || t.includes('modalità chiara')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Attivo il tema chiaro! ☀️', requiresConfirmation: false, execute: () => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        toast.success('Tema chiaro attivato');
      }};
    }
    if (t.includes('tema scuro') || t.includes('dark mode') || t.includes('modalità scura')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Attivo il tema scuro! 🌙', requiresConfirmation: false, execute: () => {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        toast.success('Tema scuro attivato');
      }};
    }

    // ── MESSAGE (requires confirmation) ───────────────────────────────────
    const msgMatch = t.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+([^:,]+?)(?:\s*[,:]\s*|\s+(?:che|dicendo|scrivendo)\s+)(.+)/);
    if (msgMatch) {
      const recipient = msgMatch[1].trim();
      const content = msgMatch[2].trim();
      return {
        id: Date.now().toString(), type: 'message', text,
        response: `Vuoi che invii a ${recipient}: "${content}"? Confermi?`,
        requiresConfirmation: true,
        execute: () => { navigate('/chat'); toast.info(`Cerco "${recipient}" per inviare: "${content}"`); },
      };
    }
    const msgSimple = t.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+(.+)/);
    if (msgSimple) {
      return {
        id: Date.now().toString(), type: 'message', text,
        response: `Vuoi aprire la chat con ${msgSimple[1]}? Confermi?`,
        requiresConfirmation: true,
        execute: () => { navigate('/chat'); toast.info(`Cerco "${msgSimple[1]}"...`); },
      };
    }

    // ── LIKE (rate limited, no confirmation) ──────────────────────────────
    if (t.match(/metti\s+like|dai\s+like|mi\s+piace/)) {
      return {
        id: Date.now().toString(), type: 'like', text,
        response: 'Like aggiunto! ❤️', requiresConfirmation: false,
        execute: () => { toast.success('Like aggiunto!'); recordAction('like'); },
      };
    }

    // ── FOLLOW (requires confirmation) ────────────────────────────────────
    const followMatch = t.match(/(?:segui|aggiungi)\s+(.+)/);
    if (followMatch) {
      const target = followMatch[1].trim();
      return {
        id: Date.now().toString(), type: 'follow', text,
        response: `Vuoi seguire ${target}? Confermi?`,
        requiresConfirmation: true,
        execute: () => { navigate('/search'); toast.info(`Cerco "${target}" per seguirlo`); },
      };
    }

    // ── BOOKING (requires confirmation) ───────────────────────────────────
    if (t.includes('prenota') || t.includes('prenotazione') || t.includes('appuntamento')) {
      return {
        id: Date.now().toString(), type: 'book', text,
        response: 'Vuoi cercare professionisti per prenotare? Confermi?',
        requiresConfirmation: true,
        execute: () => navigate('/stylists'),
      };
    }

    // ── CALL (requires confirmation) ──────────────────────────────────────
    const callMatch = t.match(/(?:chiama|telefona|videochiama)\s+(.+)/);
    if (callMatch) {
      return {
        id: Date.now().toString(), type: 'call', text,
        response: `Vuoi chiamare ${callMatch[1]}? Confermi?`,
        requiresConfirmation: true,
        execute: () => { navigate('/chat'); toast.info(`Cerco "${callMatch[1]}" per la chiamata...`); },
      };
    }

    // ── SEARCH ────────────────────────────────────────────────────────────
    const searchMatch = t.match(/^cerca\s+(.+)$/);
    if (searchMatch) {
      const q = searchMatch[1].trim();
      return {
        id: Date.now().toString(), type: 'search', text,
        response: `Cerco "${q}"!`, requiresConfirmation: false,
        execute: () => navigate(`/search?q=${encodeURIComponent(q)}`),
      };
    }

    // ── MAP SEARCH ────────────────────────────────────────────────────────
    const mapMatch = t.match(/cerca\s+(?:match|amici|persone|stilisti)\s+(?:a|entro|vicino|nel\s+raggio\s+di)\s*(\d+)\s*km/);
    if (mapMatch) {
      return {
        id: Date.now().toString(), type: 'search', text,
        response: `Cerco match entro ${mapMatch[1]} km!`, requiresConfirmation: false,
        execute: () => navigate(`/map-search?radius=${mapMatch[1]}`),
      };
    }
    if (t.includes('cerca match') || t.includes('match vicini')) {
      return { id: Date.now().toString(), type: 'search', text, response: 'Apro la mappa dei match!', requiresConfirmation: false, execute: () => navigate('/map-search') };
    }

    // ── INFO queries ──────────────────────────────────────────────────────
    if (t.includes('quanti coin') || t.includes('quante monete') || t.includes('saldo')) {
      const coins = profile?.qr_coins ?? 0;
      return { id: Date.now().toString(), type: 'info', text, response: `Hai ${coins} QR Coins nel tuo wallet!`, requiresConfirmation: false, execute: () => {} };
    }
    if (t.includes('prossimo appuntamento') || t.includes('prossima prenotazione')) {
      return { id: Date.now().toString(), type: 'info', text, response: 'Apro le tue prenotazioni per verificare!', requiresConfirmation: false, execute: () => navigate('/my-bookings') };
    }

    // ── SCHEDULING (requires confirmation) ────────────────────────────────
    const scheduleMatch = t.match(/(?:ricordami|promemoria|schedula|programma)\s+(?:di\s+)?(.+?)(?:\s+(?:tra|fra|per|il|domani|dopodomani)\s+(.+))?$/);
    if (scheduleMatch && user) {
      const actionDesc = scheduleMatch[1]?.trim() || 'azione programmata';
      const timeDesc = scheduleMatch[2]?.trim() || 'domani';
      const scheduledDate = new Date();
      if (timeDesc.includes('domani')) scheduledDate.setDate(scheduledDate.getDate() + 1);
      else if (timeDesc.includes('dopodomani')) scheduledDate.setDate(scheduledDate.getDate() + 2);
      else if (timeDesc.match(/(\d+)\s*(?:ore|ora|h)/)) {
        scheduledDate.setHours(scheduledDate.getHours() + parseInt(timeDesc.match(/(\d+)\s*(?:ore|ora|h)/)![1]));
      } else if (timeDesc.match(/(\d+)\s*(?:minuti|min)/)) {
        scheduledDate.setMinutes(scheduledDate.getMinutes() + parseInt(timeDesc.match(/(\d+)\s*(?:minuti|min)/)![1]));
      } else if (timeDesc.match(/(\d+)\s*(?:giorni|giorno|gg)/)) {
        scheduledDate.setDate(scheduledDate.getDate() + parseInt(timeDesc.match(/(\d+)\s*(?:giorni|giorno|gg)/)![1]));
      }

      return {
        id: Date.now().toString(), type: 'schedule' as StellaCommand['type'], text,
        response: `Programmo "${actionDesc}" per ${scheduledDate.toLocaleDateString('it-IT')} ${scheduledDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}. Confermi?`,
        requiresConfirmation: true,
        execute: () => {
          supabase.from('stella_scheduled_actions').insert({
            user_id: user.id,
            action_type: 'booking_reminder',
            action_params: { message: actionDesc },
            scheduled_for: scheduledDate.toISOString(),
          }).then(({ error }) => {
            if (error) toast.error('Errore nella programmazione');
            else toast.success('Azione programmata con successo!');
          });
        },
      };
    }

    // ── HELP ──────────────────────────────────────────────────────────────
    if (t.includes('aiuto') || t.includes('help') || t.includes('cosa puoi fare') || t.includes('comandi')) {
      return {
        id: Date.now().toString(), type: 'info', text,
        response: '🌟 Posso fare tutto! Ecco alcuni comandi:\n' +
          '📱 Navigazione: "apri home", "vai allo shop", "apri chat"\n' +
          '✂️ Prenotazioni: "prenota", "le mie prenotazioni"\n' +
          '💬 Messaggi: "invia messaggio a Mario"\n' +
          '🔍 Ricerca: "cerca parrucchiere"\n' +
          '🎨 AI: "prova look", "genera sito", "analisi predittiva"\n' +
          '📊 Business: "dashboard business", "calendario contenuti"\n' +
          '⚙️ Sistema: "tema scuro", "scorri giù", "ricarica"\n' +
          'Oppure chiedimi qualsiasi cosa!',
        requiresConfirmation: false,
        execute: () => {},
      };
    }

    return null;
  }, [navigate, profile, user]);

  // ── AI Fallback (when no command matched) ──────────────────────────────
  const askAI = useCallback(async (text: string) => {
    setIsAIThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-beauty-assistant', {
        body: {
          message: text,
          context: {
            user_type: profile?.user_type || 'client',
            user_name: profile?.display_name || 'Utente',
            qr_coins: profile?.qr_coins || 0,
          },
        },
      });
      if (error) throw error;
      const aiResponse = data?.response || data?.message || 'Mi dispiace, non sono riuscita a elaborare la risposta. Riprova!';
      addMessage({ role: 'stella', content: aiResponse, type: 'text' });
      stellaSpeak(aiResponse.length > 200 ? aiResponse.substring(0, 200) + '...' : aiResponse);
    } catch {
      const fallback = 'Stella AI è temporaneamente offline. Posso aiutarti con navigazione e comandi: dì "aiuto" per la lista!';
      addMessage({ role: 'stella', content: fallback, type: 'text' });
      stellaSpeak(fallback);
    } finally {
      setIsAIThinking(false);
    }
  }, [addMessage, stellaSpeak, profile]);

  // ── Handle command ──────────────────────────────────────────────────────
  const handleCommand = useCallback((text: string) => {
    addMessage({ role: 'user', content: text });

    const cmd = parseCommand(text);
    if (!cmd) {
      // No match → ask AI
      askAI(text);
      return;
    }

    const limit = checkLimit(cmd.type);
    if (!limit.allowed) {
      const msg = `Hai raggiunto il limite di ${cmd.type} per quest'ora. Rimanenti: ${limit.remaining}`;
      addMessage({ role: 'stella', content: msg });
      stellaSpeak(msg);
      return;
    }

    if (cmd.requiresConfirmation) {
      setPendingCommand(cmd);
      addMessage({ role: 'stella', content: cmd.response, type: 'confirmation', pending: cmd });
      stellaSpeak(cmd.response);
    } else {
      cmd.execute();
      recordAction(cmd.type);
      addMessage({ role: 'stella', content: cmd.response, type: 'action_result' });
      stellaSpeak(cmd.response);

      if (user) {
        supabase.from('stella_commands').insert({
          user_id: user.id, command_text: text, command_type: cmd.type,
          status: 'completed', executed_at: new Date().toISOString(),
        }).then(() => {});
      }
    }
  }, [addMessage, parseCommand, stellaSpeak, askAI, user]);

  // ── Confirm / Cancel pending action ─────────────────────────────────────
  const confirmAction = useCallback(() => {
    if (!pendingCommand) return;
    pendingCommand.execute();
    recordAction(pendingCommand.type);
    addMessage({ role: 'stella', content: 'Fatto! ✅', type: 'action_result' });
    stellaSpeak('Fatto!');

    if (user) {
      supabase.from('stella_commands').insert({
        user_id: user.id, command_text: pendingCommand.text, command_type: pendingCommand.type,
        status: 'completed', requires_confirmation: true,
        confirmed_at: new Date().toISOString(), executed_at: new Date().toISOString(),
      }).then(() => {});
    }
    setPendingCommand(null);
  }, [pendingCommand, addMessage, stellaSpeak, user]);

  const cancelAction = useCallback(() => {
    setPendingCommand(null);
    addMessage({ role: 'stella', content: 'Azione annullata.' });
    stellaSpeak('Annullato.');
  }, [addMessage, stellaSpeak]);

  const sendTextCommand = useCallback((text: string) => {
    if (!text.trim()) return;
    handleCommand(text.trim());
  }, [handleCommand]);

  const toggleWakeWord = useCallback(() => {
    if (wakeWordActive) { stopWakeWordListening(); setWakeWordActive(false); }
    else { startWakeWordListening(); setWakeWordActive(true); }
  }, [wakeWordActive, startWakeWordListening, stopWakeWordListening]);

  const toggleTTS = useCallback(() => setTtsEnabled(prev => !prev), []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening(); else startListening();
  }, [isListening, startListening, stopListening]);

  return {
    messages, isOpen, setIsOpen, wakeWordActive, ttsEnabled,
    isListening, isWakeWordListening, interimTranscript, speaking,
    pendingCommand, isSupported, isAIThinking,
    toggleWakeWord, toggleTTS, toggleListening,
    sendTextCommand, confirmAction, cancelAction,
    clearMessages: useCallback(() => setMessages([]), []),
  };
}
