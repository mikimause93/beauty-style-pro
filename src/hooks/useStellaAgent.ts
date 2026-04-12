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
  action: { perHour: 60, cooldownMs: 0 },
} as const;

const CONFIRMATION_REQUIRED = new Set([
  'book', 'payment', 'follow', 'message', 'delete', 'spend_coins',
]);

export interface StellaCommand {
  id: string;
  type: 'navigate' | 'search' | 'message' | 'like' | 'comment' | 'follow' | 'book' | 'info' | 'schedule' | 'call' | 'payment' | 'action';
  text: string;
  response: string;
  requiresConfirmation: boolean;
  execute: () => void | Promise<void>;
  silent?: boolean; // execute without opening panel
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

  const [messages, setMessages] = useState<StellaMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [wakeWordActive, setWakeWordActive] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<StellaCommand | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);

  const isOpenRef = useRef(false);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // Detect browser language for voice recognition
  const browserLang = typeof navigator !== 'undefined' ? navigator.language || 'it-IT' : 'it-IT';

  const {
    isListening, transcript, interimTranscript,
    startListening, stopListening, resetTranscript,
    isWakeWordListening, startWakeWordListening, stopWakeWordListening, isSupported,
  } = useVoiceRecognition({
    continuous: false,
    interimResults: true,
    language: browserLang,
    wakeWordEnabled: true,
    wakeWords: [
      // Multilingual wake words
      'stella', 'hey stella', 'ehi stella', 'ciao stella',
      'hi stella', 'ok stella', 'hola stella', 'oi stella',
      'hé stella', 'hallo stella', 'привет стелла',
    ],
    onWakeWordDetected: () => {
      speak('Sono qui! Dimmi cosa fare.');
    },
  });

  const wakeWordActiveRef = useRef(wakeWordActive);
  useEffect(() => { wakeWordActiveRef.current = wakeWordActive; }, [wakeWordActive]);

  // Auto-start wake word listening on mount
  useEffect(() => {
    if (isSupported && wakeWordActive && !isWakeWordListening && !isListening) {
      const timer = setTimeout(() => startWakeWordListening(), 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  // Process transcript when command listening ends
  const lastTranscriptRef = useRef('');
  useEffect(() => {
    if (transcript && !isListening && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      handleCommand(transcript);
      resetTranscript();
      // Re-enable wake word after processing command
      if (wakeWordActiveRef.current) {
        setTimeout(() => {
          if (wakeWordActiveRef.current && !isWakeWordListening) {
            startWakeWordListening();
          }
        }, 2000);
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

  // ── Helper: search profile by name in DB ──────────────────────────────────
  const findProfileByName = useCallback(async (name: string) => {
    const searchTerms = name.toLowerCase().split(/\s+/);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, user_type')
      .or(searchTerms.map(term => `display_name.ilike.%${term}%,username.ilike.%${term}%`).join(','))
      .limit(5);
    return data || [];
  }, []);

  // ── Helper: like a post ───────────────────────────────────────────────────
  const likeLatestPost = useCallback(async (targetName?: string) => {
    if (!user) return 'Devi effettuare il login per mettere like!';
    
    let postId: string | null = null;
    
    if (targetName) {
      const profiles = await findProfileByName(targetName);
      if (profiles.length > 0) {
        const { data: posts } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', profiles[0].user_id)
          .order('created_at', { ascending: false })
          .limit(1);
        postId = posts?.[0]?.id || null;
      }
    } else {
      // Like the most recent post in feed
      const { data: posts } = await supabase
        .from('posts')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);
      postId = posts?.[0]?.id || null;
    }
    
    if (!postId) return 'Non ho trovato post da mettere like.';
    
    const { error } = await supabase.from('post_likes').insert({
      post_id: postId,
      user_id: user.id,
    });
    
    if (error?.code === '23505') return 'Hai già messo like a questo post! ❤️';
    if (error) return 'Errore nel mettere like. Riprova!';
    
    // Increment like count (best effort)
    try { await supabase.rpc('increment_like_count' as any, { post_id: postId }); } catch {}
    return 'Like aggiunto! ❤️';
  }, [user, findProfileByName]);

  // ── Helper: follow a user ─────────────────────────────────────────────────
  const followUser = useCallback(async (targetName: string) => {
    if (!user) return 'Devi effettuare il login per seguire qualcuno!';
    
    const profiles = await findProfileByName(targetName);
    if (profiles.length === 0) return `Non ho trovato nessun profilo con il nome "${targetName}".`;
    
    const target = profiles[0];
    if (target.user_id === user.id) return 'Non puoi seguire te stesso! 😄';
    
    const { error } = await supabase.from('follows').insert({
      follower_id: user.id,
      following_id: target.user_id,
    });
    
    if (error?.code === '23505') return `Stai già seguendo ${target.display_name || target.username}!`;
    if (error) return 'Errore nel seguire. Riprova!';
    return `Ora segui ${target.display_name || target.username}! ✅`;
  }, [user, findProfileByName]);

  // ── Helper: send message ──────────────────────────────────────────────────
  const sendMessageTo = useCallback(async (targetName: string, content: string) => {
    if (!user) return 'Devi effettuare il login per inviare messaggi!';
    
    const profiles = await findProfileByName(targetName);
    if (profiles.length === 0) return `Non ho trovato nessun profilo con il nome "${targetName}".`;
    
    const target = profiles[0];
    
    // Find or create conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${target.user_id}),and(participant_1.eq.${target.user_id},participant_2.eq.${user.id})`)
      .limit(1);
    
    let conversationId = existing?.[0]?.id;
    
    if (!conversationId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ participant_1: user.id, participant_2: target.user_id })
        .select('id')
        .single();
      conversationId = newConv?.id;
    }
    
    if (!conversationId) return 'Errore nella creazione della conversazione.';
    
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });
    
    await supabase.from('conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);
    
    return `Messaggio inviato a ${target.display_name || target.username}! 💬`;
  }, [user, findProfileByName]);

  // ── Helper: navigate to specific profile ──────────────────────────────────
  const goToProfile = useCallback(async (name: string) => {
    const profiles = await findProfileByName(name);
    if (profiles.length === 0) {
      navigate(`/search?q=${encodeURIComponent(name)}`);
      return `Non ho trovato "${name}" esattamente, apro la ricerca!`;
    }
    const p = profiles[0];
    navigate(`/profile/${p.user_id}`);
    return `Ecco il profilo di ${p.display_name || p.username}! 👤`;
  }, [findProfileByName, navigate]);

  // ── FULL COMMAND PARSER ─────────────────────────────────────────────────────
  const parseCommand = useCallback((text: string): StellaCommand | null => {
    const t = text.toLowerCase().trim();

    // ── Strip "stella" prefix if present ──────────────────────────────────
    const stripped = t.replace(/^(?:stella|hey stella|ehi stella|ciao stella)\s*[,.]?\s*/i, '');

    // ── SHOW / OPEN PROFILE by name (direct DB lookup) ────────────────────
    const profileMatch = stripped.match(/(?:mostrami|mostra|apri|vedi|fammi vedere|portami a|portami al|vai al|chi è)\s+(?:il\s+)?(?:profilo\s+)?(?:di\s+)?(.+)/);
    if (profileMatch && !stripped.includes('profilo mio') && !stripped.includes('mio profilo')) {
      const name = profileMatch[1].replace(/\s+(?:profilo)$/, '').trim();
      if (name.length > 1) {
        return {
          id: Date.now().toString(), type: 'action', text,
          response: `Cerco il profilo di ${name}...`, requiresConfirmation: false, silent: true,
          execute: async () => {
            const result = await goToProfile(name);
            toast.success(`🌟 Stella: ${result}`);
            stellaSpeak(result);
          },
        };
      }
    }

    // ── NEARBY PROFESSIONALS ──────────────────────────────────────────────
    if (stripped.includes('professionisti in zona') || stripped.includes('professionisti disponibili') ||
        stripped.includes('professionisti vicini') || stripped.includes('chi è disponibile') ||
        stripped.includes('saloni vicini') || stripped.includes('stilisti vicini') ||
        stripped.includes('parrucchieri vicini') || stripped.includes('chi c\'è in zona') ||
        stripped.includes('trova professionisti') || stripped.includes('cerca professionisti vicino')) {
      return {
        id: Date.now().toString(), type: 'navigate', text,
        response: 'Cerco i professionisti disponibili nella tua zona!', requiresConfirmation: false, silent: true,
        execute: () => { navigate('/map-search'); toast.success('🌟 Stella: Apro la mappa dei professionisti!'); },
      };
    }

    // ── NAVIGATION MAP ────────────────────────────────────────────────────
    const navRoutes: Array<{ patterns: string[]; route: string; response: string }> = [
      { patterns: ['vai alla home', 'apri home', 'torna alla home', 'home page', 'torna a casa'], route: '/', response: 'Ti porto alla home!' },
      { patterns: ['apri chat', 'vai alla chat', 'messaggi', 'apri messaggi', 'le mie chat'], route: '/chat', response: 'Apro la chat!' },
      { patterns: ['apri notifiche', 'le notifiche', 'dimmi le notifiche', 'vedi notifiche', 'mostra notifiche'], route: '/notifications', response: 'Ecco le tue notifiche!' },
      { patterns: ['apri profilo', 'vai al profilo', 'il mio profilo', 'profilo mio'], route: '/profile', response: 'Ecco il tuo profilo!' },
      { patterns: ['modifica profilo', 'edit profilo', 'cambia profilo', 'aggiorna profilo'], route: '/profile/edit', response: 'Apro la modifica del profilo!' },
      { patterns: ['apri wallet', 'vai al wallet', 'portafoglio', 'i miei soldi', 'saldo'], route: '/wallet', response: 'Apro il tuo wallet!' },
      { patterns: ['apri mappa', 'cerca sulla mappa', 'mappa', 'dove sono'], route: '/map-search', response: 'Apro la mappa!' },
      { patterns: ['vai allo shop', 'apri shop', 'negozio', 'prodotti', 'compra'], route: '/shop', response: 'Apro lo shop!' },
      { patterns: ['vai alle missioni', 'apri missioni', 'missioni', 'le mie missioni'], route: '/missions', response: 'Ecco le tue missioni!' },
      { patterns: ['gira la ruota', 'ruota della fortuna', 'spin', 'fortuna'], route: '/spin', response: 'Apro la ruota della fortuna!' },
      { patterns: ['vai in live', 'apri live', 'streaming', 'dirette'], route: '/live', response: 'Ti porto nella sezione live!' },
      { patterns: ['apri radio', 'musica', 'radio', 'ascolta musica'], route: '/radio', response: 'Apro la radio!' },
      { patterns: ['impostazioni', 'apri impostazioni', 'settings', 'le impostazioni'], route: '/settings', response: 'Apro le impostazioni!' },
      { patterns: ['esplora', 'apri esplora', 'scopri'], route: '/explore', response: 'Apro la sezione esplora!' },
      { patterns: ['crea post', 'pubblica', 'nuovo post', 'scrivi post', 'fai un post'], route: '/create-post', response: 'Apro la creazione di un nuovo post!' },
      { patterns: ['le mie prenotazioni', 'mostra prenotazioni', 'i miei appuntamenti', 'appuntamenti'], route: '/my-bookings', response: 'Ecco le tue prenotazioni!' },
      { patterns: ['classifica', 'leaderboard', 'graduatoria'], route: '/leaderboard', response: 'Apro la classifica!' },
      { patterns: ['sfide', 'challenge', 'sfida', 'le sfide'], route: '/challenges', response: 'Ecco le sfide attive!' },
      { patterns: ['shorts', 'video brevi', 'reels', 'i video'], route: '/shorts', response: 'Apro i video shorts!' },
      { patterns: ['eventi', 'apri eventi', 'prossimi eventi'], route: '/events', response: 'Ecco gli eventi!' },
      { patterns: ['marketplace', 'apri marketplace', 'mercato'], route: '/marketplace', response: 'Apro il marketplace!' },
      { patterns: ['spa', 'terme', 'benessere', 'centri spa'], route: '/spa-terme', response: 'Ecco le Spa e Terme!' },
      { patterns: ['quiz', 'gioca al quiz', 'quiz live'], route: '/quiz-live', response: 'Apro il Quiz Live!' },
      { patterns: ['talent', 'gioco talent', 'talent game'], route: '/talent-game', response: 'Apro il Talent Game!' },
      { patterns: ['referral', 'invita amici', 'programma inviti', 'invita un amico'], route: '/referral', response: 'Apro il programma referral!' },
      { patterns: ['abbonamento', 'abbonamenti', 'subscription', 'piano', 'vai premium'], route: '/subscriptions', response: 'Ecco i piani di abbonamento!' },
      { patterns: ['promemoria', 'reminder', 'i miei promemoria'], route: '/reminders', response: 'Ecco i tuoi promemoria!' },
      { patterns: ['stilisti', 'parrucchieri', 'trova stilista'], route: '/stylists', response: 'Ecco i professionisti!' },
      { patterns: ['qr coin', 'le mie monete', 'coins', 'qr coins'], route: '/qr-coins', response: 'Ecco i tuoi QR Coins!' },
      { patterns: ['prima dopo', 'before after', 'trasformazioni'], route: '/before-after', response: 'Apro le trasformazioni!' },
      { patterns: ['offerte', 'promozioni', 'sconti'], route: '/offers', response: 'Ecco le offerte!' },
      { patterns: ['aste', 'asta', 'auction'], route: '/auctions', response: 'Apro le aste!' },
      { patterns: ['ricevute', 'scontrini', 'receipts', 'fatture'], route: '/receipts', response: 'Ecco le tue ricevute!' },
      { patterns: ['verifica account', 'verifica profilo', 'verificami'], route: '/verify-account', response: 'Apro la verifica account!' },
      { patterns: ['dashboard business', 'pannello business', 'gestione attività', 'il mio business'], route: '/business', response: 'Apro la dashboard business!' },
      { patterns: ['gestisci team', 'team dipendenti', 'i miei dipendenti', 'staff'], route: '/business/team', response: 'Apro la gestione del team!' },
      { patterns: ['turni dipendenti', 'gestisci turni', 'orari lavoro', 'turni'], route: '/business/team/shifts', response: 'Apro la gestione turni!' },
      { patterns: ['risorse umane', 'hr', 'assunzioni', 'offerte lavoro'], route: '/hr', response: 'Apro la sezione HR!' },
      { patterns: ['crea annuncio lavoro', 'pubblica offerta lavoro', 'nuovo lavoro'], route: '/hr/create-job', response: 'Creo un nuovo annuncio di lavoro!' },
      { patterns: ['gestisci prodotti', 'i miei prodotti', 'catalogo', 'inventario'], route: '/manage-products', response: 'Apro la gestione prodotti!' },
      { patterns: ['analytics', 'statistiche', 'dati', 'le mie statistiche'], route: '/analytics', response: 'Apro le statistiche!' },
      { patterns: ['affiliato', 'affiliate', 'programma affiliazione', 'affiliati'], route: '/affiliate', response: 'Apro il programma affiliazione!' },
      { patterns: ['dashboard professionale', 'pannello pro', 'i miei guadagni'], route: '/professional-dashboard', response: 'Apro la dashboard professionale!' },
      { patterns: ['boost profilo', 'promuovi profilo', 'sponsorizza', 'potenzia profilo'], route: '/boost', response: 'Apro il boost profilo!' },
      { patterns: ['diventa creator', 'creator', 'applicazione creator', 'candidatura creator'], route: '/become-creator', response: 'Apro l\'applicazione creator!' },
      { patterns: ['ai look', 'prova look', 'genera look', 'cambio look', 'prova taglio', 'prova colore', 'nuovo look'], route: '/ai-look', response: 'Apro il generatore di look AI!' },
      { patterns: ['anteprima ai', 'ai preview', 'prova stile'], route: '/ai-preview', response: 'Apro l\'anteprima AI!' },
      { patterns: ['calendario contenuti', 'content calendar', 'pianifica contenuti', 'piano editoriale'], route: '/content-calendar', response: 'Apro il calendario contenuti!' },
      { patterns: ['analisi predittiva', 'predictive', 'previsioni', 'forecasting', 'predittiva'], route: '/predictive-analytics', response: 'Apro l\'analisi predittiva!' },
      { patterns: ['automazione social', 'social automation', 'gestisci social', 'social media'], route: '/social-automation', response: 'Apro l\'automazione social!' },
      { patterns: ['genera sito', 'website generator', 'crea sito', 'landing page', 'il mio sito'], route: '/website-generator', response: 'Apro il generatore di siti web!' },
      { patterns: ['white label', 'agenzia', 'rivendita', 'reseller', 'whitelabel'], route: '/white-label', response: 'Apro il pannello White Label!' },
      { patterns: ['impostazioni globali', 'multi lingua', 'multi country', 'lingue e valute'], route: '/global-settings', response: 'Apro le impostazioni globali!' },
      { patterns: ['enterprise api', 'api key', 'webhook', 'chiavi api'], route: '/enterprise-api', response: 'Apro la dashboard Enterprise API!' },
      { patterns: ['tenant', 'pannello tenant', 'multi tenant'], route: '/tenant', response: 'Apro il pannello tenant!' },
      { patterns: ['vai live', 'go live', 'inizia streaming', 'avvia diretta'], route: '/go-live', response: 'Ti preparo per andare in diretta!' },
      { patterns: ['battle live', 'sfida live', 'live battle'], route: '/live-battle', response: 'Apro le Live Battle!' },
      { patterns: ['trasformazione', 'challenge trasformazione'], route: '/transformation-challenge', response: 'Apro le sfide di trasformazione!' },
      { patterns: ['checkout', 'paga', 'procedi al pagamento'], route: '/checkout', response: 'Apro il checkout!' },
      { patterns: ['rate', 'pagamento rateale', 'finanziamento'], route: '/installments', response: 'Apro i pagamenti rateali!' },
      { patterns: ['acquisti', 'storico acquisti', 'cronologia acquisti', 'i miei ordini'], route: '/purchases', response: 'Ecco lo storico acquisti!' },
      { patterns: ['ricerca', 'cerca', 'apri ricerca'], route: '/search', response: 'Apro la ricerca!' },
      { patterns: ['admin', 'pannello admin', 'amministrazione'], route: '/admin', response: 'Apro il pannello admin!' },
      { patterns: ['servizio a domicilio', 'a domicilio', 'home service'], route: '/home-service', response: 'Apro i servizi a domicilio!' },
    ];

    for (const nav of navRoutes) {
      if (nav.patterns.some(p => stripped.includes(p))) {
        return {
          id: Date.now().toString(), type: 'navigate', text,
          response: nav.response, requiresConfirmation: false, silent: true,
          execute: () => { navigate(nav.route); toast.success(`🌟 Stella: ${nav.response}`); },
        };
      }
    }

    // ── BACK / SCROLL / REFRESH ────────────────────────────────────────────
    if (stripped.includes('torna indietro') || stripped.includes('vai indietro') || stripped === 'indietro') {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Torno indietro!', requiresConfirmation: false, silent: true,
        execute: () => { window.history.back(); toast.success('🌟 Stella: Torno indietro!'); } };
    }
    if (stripped.includes('scorri su') || stripped.includes('vai su')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Scorro verso l\'alto!', requiresConfirmation: false, silent: true,
        execute: () => { window.scrollBy({ top: -400, behavior: 'smooth' }); } };
    }
    if (stripped.includes('scorri giù') || stripped.includes('vai giù') || stripped.includes('scorri in basso')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Scorro verso il basso!', requiresConfirmation: false, silent: true,
        execute: () => { window.scrollBy({ top: 400, behavior: 'smooth' }); } };
    }
    if (stripped.includes('vai in cima') || stripped.includes('torna su') || stripped.includes('inizio pagina')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Torno all\'inizio!', requiresConfirmation: false, silent: true,
        execute: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); } };
    }
    if (stripped.includes('vai in fondo') || stripped.includes('fine pagina')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Scorro in fondo!', requiresConfirmation: false, silent: true,
        execute: () => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); } };
    }
    if (stripped.includes('ricarica') || stripped.includes('aggiorna pagina') || stripped.includes('refresh')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Ricarico la pagina!', requiresConfirmation: false, silent: true,
        execute: () => { toast.success('🌟 Stella: Ricarico!'); setTimeout(() => window.location.reload(), 500); } };
    }

    // ── THEME ──────────────────────────────────────────────────────────────
    if (stripped.includes('tema chiaro') || stripped.includes('light mode') || stripped.includes('modalità chiara')) {
      return { id: Date.now().toString(), type: 'action', text, response: 'Attivo il tema chiaro! ☀️', requiresConfirmation: false, silent: true,
        execute: () => { document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light'); toast.success('🌟 Stella: Tema chiaro attivato! ☀️'); } };
    }
    if (stripped.includes('tema scuro') || stripped.includes('dark mode') || stripped.includes('modalità scura')) {
      return { id: Date.now().toString(), type: 'action', text, response: 'Attivo il tema scuro! 🌙', requiresConfirmation: false, silent: true,
        execute: () => { document.documentElement.classList.remove('light'); document.documentElement.classList.add('dark'); toast.success('🌟 Stella: Tema scuro attivato! 🌙'); } };
    }

    // ── DIRECT LIKE (with optional target) ────────────────────────────────
    const likeMatch = stripped.match(/(?:metti|dai|fai)\s+(?:un\s+)?like\s+(?:a|al post di|alla foto di|al|alla)\s+(.+)/);
    if (likeMatch) {
      const target = likeMatch[1].trim();
      return {
        id: Date.now().toString(), type: 'like', text,
        response: `Metto like a ${target}...`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await likeLatestPost(target);
          toast.success(`🌟 Stella: ${result}`);
          stellaSpeak(result);
        },
      };
    }
    if (stripped.match(/metti\s+like|dai\s+like|mi\s+piace|metti un like/)) {
      return {
        id: Date.now().toString(), type: 'like', text,
        response: 'Metto like! ❤️', requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await likeLatestPost();
          toast.success(`🌟 Stella: ${result}`);
          stellaSpeak(result);
        },
      };
    }

    // ── DIRECT FOLLOW ─────────────────────────────────────────────────────
    const followMatch = stripped.match(/(?:segui|inizia a seguire|aggiungi)\s+(.+)/);
    if (followMatch) {
      const target = followMatch[1].trim();
      return {
        id: Date.now().toString(), type: 'follow', text,
        response: `Seguo ${target}...`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await followUser(target);
          toast.success(`🌟 Stella: ${result}`);
          stellaSpeak(result);
        },
      };
    }

    // ── DIRECT MESSAGE (with content) ─────────────────────────────────────
    const msgMatch = stripped.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+([^:,]+?)(?:\s*[,:]\s*|\s+(?:che|dicendo|scrivendo|con scritto|con testo)\s+)(.+)/);
    if (msgMatch) {
      const recipient = msgMatch[1].trim();
      const content = msgMatch[2].trim();
      return {
        id: Date.now().toString(), type: 'message', text,
        response: `Invio messaggio a ${recipient}...`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await sendMessageTo(recipient, content);
          toast.success(`🌟 Stella: ${result}`);
          stellaSpeak(result);
        },
      };
    }
    // Message without content — open chat
    const msgSimple = stripped.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+(.+)/);
    if (msgSimple) {
      const recipient = msgSimple[1].trim();
      return {
        id: Date.now().toString(), type: 'action', text,
        response: `Apro la chat con ${recipient}...`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const profiles = await findProfileByName(recipient);
          if (profiles.length > 0) {
            navigate('/chat');
            toast.success(`🌟 Stella: Apro la chat con ${profiles[0].display_name || profiles[0].username}!`);
          } else {
            navigate('/chat');
            toast.info(`🌟 Stella: Non ho trovato "${recipient}", apro la chat.`);
          }
        },
      };
    }

    // ── BOOKING ────────────────────────────────────────────────────────────
    const bookMatch = stripped.match(/(?:prenota|prenotazione|appuntamento)\s+(?:con|da|per)\s+(.+)/);
    if (bookMatch) {
      const target = bookMatch[1].trim();
      return {
        id: Date.now().toString(), type: 'book', text,
        response: `Cerco ${target} per la prenotazione...`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const profiles = await findProfileByName(target);
          if (profiles.length > 0) {
            navigate(`/stylist/${profiles[0].user_id}`);
            toast.success(`🌟 Stella: Apro la pagina di ${profiles[0].display_name || target} per prenotare!`);
          } else {
            navigate('/stylists');
            toast.info(`🌟 Stella: Non ho trovato "${target}", mostro i professionisti.`);
          }
          stellaSpeak(`Cerco ${target} per la prenotazione!`);
        },
      };
    }
    if (stripped.includes('prenota') || stripped.includes('prenotazione') || stripped.includes('appuntamento') || stripped.includes('fissa')) {
      return {
        id: Date.now().toString(), type: 'navigate', text,
        response: 'Ti mostro i professionisti disponibili!', requiresConfirmation: false, silent: true,
        execute: () => { navigate('/stylists'); toast.success('🌟 Stella: Ecco i professionisti!'); },
      };
    }

    // ── SEARCH ────────────────────────────────────────────────────────────
    const searchMatch = stripped.match(/^cerca\s+(.+)$/);
    if (searchMatch) {
      const q = searchMatch[1].trim();
      return {
        id: Date.now().toString(), type: 'search', text,
        response: `Cerco "${q}"!`, requiresConfirmation: false, silent: true,
        execute: () => { navigate(`/search?q=${encodeURIComponent(q)}`); toast.success(`🌟 Stella: Cerco "${q}"!`); },
      };
    }

    // ── MAP SEARCH ────────────────────────────────────────────────────────
    const mapMatch = stripped.match(/cerca\s+(?:match|amici|persone|stilisti)\s+(?:a|entro|vicino|nel\s+raggio\s+di)\s*(\d+)\s*km/);
    if (mapMatch) {
      return { id: Date.now().toString(), type: 'search', text, response: `Cerco match entro ${mapMatch[1]} km!`, requiresConfirmation: false, silent: true,
        execute: () => { navigate(`/map-search?radius=${mapMatch[1]}`); toast.success(`🌟 Stella: Cerco entro ${mapMatch[1]} km!`); } };
    }
    if (stripped.includes('cerca match') || stripped.includes('match vicini') || stripped.includes('chi c\'è vicino')) {
      return { id: Date.now().toString(), type: 'search', text, response: 'Apro la mappa!', requiresConfirmation: false, silent: true,
        execute: () => { navigate('/map-search'); toast.success('🌟 Stella: Apro la mappa!'); } };
    }

    // ── INFO ──────────────────────────────────────────────────────────────
    if (stripped.includes('quanti coin') || stripped.includes('quante monete') || stripped.includes('il mio saldo')) {
      const coins = profile?.qr_coins ?? 0;
      const msg = `Hai ${coins} QR Coins nel tuo wallet!`;
      return { id: Date.now().toString(), type: 'info', text, response: msg, requiresConfirmation: false, silent: true,
        execute: () => { toast.success(`🌟 Stella: ${msg}`); } };
    }
    if (stripped.includes('prossimo appuntamento') || stripped.includes('prossima prenotazione')) {
      return { id: Date.now().toString(), type: 'info', text, response: 'Verifico le tue prenotazioni!', requiresConfirmation: false, silent: true,
        execute: () => { navigate('/my-bookings'); toast.success('🌟 Stella: Ecco le tue prenotazioni!'); } };
    }

    // ── CALL ──────────────────────────────────────────────────────────────
    const callMatch = stripped.match(/(?:chiama|telefona|videochiama)\s+(.+)/);
    if (callMatch) {
      return {
        id: Date.now().toString(), type: 'call', text,
        response: `Cerco ${callMatch[1]} per la chiamata!`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const profiles = await findProfileByName(callMatch[1]);
          navigate('/chat');
          toast.success(`🌟 Stella: Cerco ${callMatch[1]} per la chiamata!`);
        },
      };
    }

    // ── SHARE ─────────────────────────────────────────────────────────────
    if (stripped.includes('condividi') || stripped.includes('share') || stripped.includes('invia link')) {
      return { id: Date.now().toString(), type: 'action', text, response: 'Condivido la pagina!', requiresConfirmation: false, silent: true,
        execute: () => {
          if (navigator.share) {
            navigator.share({ title: 'STYLE', url: window.location.href }).catch(() => {});
          } else {
            navigator.clipboard.writeText(window.location.href);
          }
          toast.success('🌟 Stella: Link condiviso!');
        } };
    }

    // ── SCHEDULING ────────────────────────────────────────────────────────
    const scheduleMatch = stripped.match(/(?:ricordami|promemoria|schedula|programma)\s+(?:di\s+)?(.+?)(?:\s+(?:tra|fra|per|il|domani|dopodomani)\s+(.+))?$/);
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
        response: `Programmato "${actionDesc}" per ${scheduledDate.toLocaleDateString('it-IT')}!`, requiresConfirmation: false, silent: true,
        execute: () => {
          supabase.from('stella_scheduled_actions').insert({
            user_id: user.id, action_type: 'booking_reminder',
            action_params: { message: actionDesc },
            scheduled_for: scheduledDate.toISOString(),
          }).then(({ error }) => {
            if (error) toast.error('🌟 Stella: Errore nella programmazione');
            else toast.success(`🌟 Stella: Promemoria programmato!`);
          });
        },
      };
    }

    // ── HELP ──────────────────────────────────────────────────────────────
    if (stripped.includes('aiuto') || stripped.includes('help') || stripped.includes('cosa puoi fare') || stripped.includes('comandi')) {
      return {
        id: Date.now().toString(), type: 'info', text,
        response: '🌟 Sono Stella, il cuore dell\'app! Posso fare TUTTO per te:\n\n' +
          '👤 Profili: "mostrami profilo Mario Rossi"\n' +
          '📍 Mappa: "professionisti in zona disponibili"\n' +
          '❤️ Social: "metti like a Anna", "segui Marco"\n' +
          '💬 Chat: "invia messaggio a Sara: ciao!"\n' +
          '✂️ Booking: "prenota con Studio Bella"\n' +
          '📱 Navigazione: "apri shop", "vai alla home"\n' +
          '🎨 AI: "prova look", "genera sito"\n' +
          '🔍 Ricerca: "cerca parrucchiere"\n' +
          '⚙️ Sistema: "tema scuro", "scorri giù"\n\n' +
          'Dì "Stella" e poi il comando — agisco senza aprire niente! 🚀',
        requiresConfirmation: false,
        execute: () => {},
      };
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────
    if (stripped.includes('esci') || stripped.includes('logout') || stripped.includes('disconnetti')) {
      return { id: Date.now().toString(), type: 'navigate', text, response: 'Per sicurezza, vai nelle impostazioni per uscire.', requiresConfirmation: false, silent: true,
        execute: () => { navigate('/settings'); toast.info('🌟 Stella: Vai nelle impostazioni per uscire.'); } };
    }

    // ── OPEN STELLA PANEL ─────────────────────────────────────────────────
    if (stripped.includes('apri stella') || stripped.includes('apri pannello') || stripped.includes('apri assistente')) {
      return { id: Date.now().toString(), type: 'action', text, response: 'Apro il mio pannello!', requiresConfirmation: false,
        execute: () => setIsOpen(true) };
    }

    return null;
  }, [navigate, profile, user, goToProfile, likeLatestPost, followUser, sendMessageTo, findProfileByName, stellaSpeak]);

  // ── AI Intent Parsing (multilingual — understands every language) ──────
  const executeAIIntent = useCallback(async (intent: string, params: any, response: string) => {
    switch (intent) {
      case 'navigate':
        if (params?.route) { navigate(params.route); toast.success(`🌟 Stella: ${response}`); }
        else { navigate('/map-search'); toast.success(`🌟 Stella: ${response}`); }
        break;
      case 'search':
        navigate(`/search?q=${encodeURIComponent(params?.query || '')}`);
        toast.success(`🌟 Stella: ${response}`);
        break;
      case 'show_profile':
        if (params?.name) {
          const result = await goToProfile(params.name);
          toast.success(`🌟 Stella: ${result}`);
        }
        break;
      case 'like':
        const likeResult = await likeLatestPost(params?.target_name);
        toast.success(`🌟 Stella: ${likeResult}`);
        break;
      case 'follow':
        if (params?.target_name) {
          const followResult = await followUser(params.target_name);
          toast.success(`🌟 Stella: ${followResult}`);
        }
        break;
      case 'send_message':
        if (params?.recipient && params?.content) {
          const msgResult = await sendMessageTo(params.recipient, params.content);
          toast.success(`🌟 Stella: ${msgResult}`);
        } else if (params?.recipient) {
          const profiles = await findProfileByName(params.recipient);
          navigate('/chat');
          toast.success(`🌟 Stella: ${response}`);
        }
        break;
      case 'book':
        if (params?.target_name) {
          const profiles = await findProfileByName(params.target_name);
          if (profiles.length > 0) navigate(`/stylist/${profiles[0].user_id}`);
          else navigate('/stylists');
        } else {
          navigate('/stylists');
        }
        toast.success(`🌟 Stella: ${response}`);
        break;
      case 'call':
        navigate('/chat');
        toast.success(`🌟 Stella: ${response}`);
        break;
      case 'scroll':
        if (params?.direction === 'up') window.scrollBy({ top: -400, behavior: 'smooth' });
        else if (params?.direction === 'down') window.scrollBy({ top: 400, behavior: 'smooth' });
        else if (params?.direction === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
        else if (params?.direction === 'bottom') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        break;
      case 'theme':
        if (params?.mode === 'dark') { document.documentElement.classList.remove('light'); document.documentElement.classList.add('dark'); }
        else { document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light'); }
        toast.success(`🌟 Stella: ${response}`);
        break;
      case 'share':
        if (navigator.share) navigator.share({ title: 'STYLE', url: window.location.href }).catch(() => {});
        else navigator.clipboard.writeText(window.location.href);
        toast.success(`🌟 Stella: ${response}`);
        break;
      case 'refresh':
        toast.success(`🌟 Stella: ${response}`);
        setTimeout(() => window.location.reload(), 500);
        break;
      case 'back':
        window.history.back();
        toast.success(`🌟 Stella: ${response}`);
        break;
      case 'info':
        if (params?.info_type === 'coins') {
          const coins = profile?.qr_coins ?? 0;
          toast.success(`🌟 Stella: ${coins} QR Coins`);
        } else if (params?.info_type === 'bookings') {
          navigate('/my-bookings');
          toast.success(`🌟 Stella: ${response}`);
        } else {
          toast.success(`🌟 Stella: ${response}`);
        }
        break;
      case 'reminder':
        if (user && params?.description) {
          const scheduledDate = new Date();
          scheduledDate.setDate(scheduledDate.getDate() + 1);
          await supabase.from('stella_scheduled_actions').insert({
            user_id: user.id, action_type: 'booking_reminder',
            action_params: { message: params.description },
            scheduled_for: scheduledDate.toISOString(),
          });
          toast.success(`🌟 Stella: ${response}`);
        }
        break;
      default:
        // chat — just show the response
        toast.success(`🌟 Stella: ${response.substring(0, 120)}${response.length > 120 ? '...' : ''}`);
        break;
    }
  }, [navigate, profile, user, goToProfile, likeLatestPost, followUser, sendMessageTo, findProfileByName]);

  const askAI = useCallback(async (text: string) => {
    setIsAIThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('stella-intent', {
        body: {
          text,
          context: {
            user_type: profile?.user_type || 'client',
            user_name: profile?.display_name || 'User',
            qr_coins: profile?.qr_coins || 0,
            current_page: window.location.pathname,
          },
        },
      });
      if (error) throw error;

      const { intent, params, response: aiResponse, detected_language } = data || {};
      const displayResponse = aiResponse || 'I\'m here to help!';

      addMessage({ role: 'stella', content: displayResponse, type: 'text' });
      stellaSpeak(displayResponse.length > 200 ? displayResponse.substring(0, 200) + '...' : displayResponse);

      // Execute the parsed intent
      if (intent && intent !== 'chat') {
        await executeAIIntent(intent, params || {}, displayResponse);
        if (user) {
          supabase.from('stella_commands').insert({
            user_id: user.id, command_text: text, command_type: intent,
            status: 'completed', executed_at: new Date().toISOString(),
          }).then(() => {});
        }
      } else {
        toast.success(`🌟 Stella: ${displayResponse.substring(0, 100)}${displayResponse.length > 100 ? '...' : ''}`);
      }
    } catch {
      const fallback = 'Stella AI is temporarily offline. Say "help" for available commands!';
      addMessage({ role: 'stella', content: fallback, type: 'text' });
      stellaSpeak(fallback);
      toast.info(`🌟 ${fallback}`);
    } finally {
      setIsAIThinking(false);
    }
  }, [addMessage, stellaSpeak, profile, user, executeAIIntent]);

  // ── Handle command (works in background or with panel open) ────────────
  const handleCommand = useCallback((text: string) => {
    addMessage({ role: 'user', content: text });

    const cmd = parseCommand(text);
    if (!cmd) {
      askAI(text);
      return;
    }

    const limit = checkLimit(cmd.type);
    if (!limit.allowed) {
      const msg = `Hai raggiunto il limite di ${cmd.type} per quest'ora.`;
      addMessage({ role: 'stella', content: msg });
      stellaSpeak(msg);
      toast.warning(`🌟 Stella: ${msg}`);
      return;
    }

    if (cmd.requiresConfirmation && !cmd.silent) {
      setPendingCommand(cmd);
      addMessage({ role: 'stella', content: cmd.response, type: 'confirmation', pending: cmd });
      stellaSpeak(cmd.response);
      // Open panel for confirmations
      setIsOpen(true);
    } else {
      // Execute silently — no need to open panel
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
    toast.success('🌟 Stella: Fatto! ✅');

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