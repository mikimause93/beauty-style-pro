/**
 * StellaContext — THE unified Stella AI brain.
 *
 * Single source of truth for:
 *  - All command processing (voice + text)
 *  - Rate limiting
 *  - Timed scheduling
 *  - DNA learning
 *  - Confirmation flows
 *  - Voice/TTS/WakeWord toggle persistence
 */
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import type { CommandResult, DNAProfile, ScheduledAction, StellaEvent, PendingConfirmation } from '@/lib/stella/types';
import { extractSchedule, formatDelay } from '@/lib/stella/parser';
import {
  actionLikePost, actionCommentPost, actionFollowUser, actionUnfollowUser,
  actionGetProfileInfo, actionConfirmBooking, actionSendMessage, actionReadScreen,
} from '@/lib/stella/actions';
import { loadDNA, learnFromEvent as dnaLearn, getPersonalizedGreeting, getSmartSuggestions, getCachedDNA } from '@/lib/stella/dna';

// ─── Context shape ─────────────────────────────────────────────────────────

interface StellaContextValue {
  dna: DNAProfile | null;
  isVoiceEnabled: boolean;
  isTTSEnabled: boolean;
  isWakeWordEnabled: boolean;
  pendingConfirmation: PendingConfirmation | null;
  scheduledActions: ScheduledAction[];
  smartSuggestions: string[];
  processCommand: (text: string) => Promise<CommandResult>;
  confirmPending: () => Promise<string>;
  cancelPending: () => void;
  toggleVoice: () => void;
  toggleTTS: () => void;
  toggleWakeWord: () => void;
  scheduleAction: (command: string, ms: number, description: string) => string;
  cancelScheduled: (id: string) => void;
  learnEvent: (event: StellaEvent) => Promise<void>;
  getGreeting: () => string;
}

const StellaContext = createContext<StellaContextValue | null>(null);

// ─── Helpers ────────────────────────────────────────────────────────────────

function lsBool(key: string, def: boolean): boolean {
  try { const v = localStorage.getItem(key); return v === null ? def : v === 'true'; } catch { return def; }
}
function lsSet(key: string, val: boolean): void {
  try { localStorage.setItem(key, String(val)); } catch { /* noop */ }
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function StellaProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [dna, setDNA] = useState<DNAProfile | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [scheduledActions, setScheduledActions] = useState<ScheduledAction[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => lsBool('stella_voice_enabled', true));
  const [isTTSEnabled, setIsTTSEnabled] = useState(() => lsBool('stella_tts_enabled', false));
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(() => lsBool('stella_wakeword_enabled', true));

  // Load DNA when user is available
  useEffect(() => {
    if (!user) return;
    loadDNA(user.id).then(setDNA);
  }, [user?.id]);

  // Reload scheduled actions from DB on mount
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data } = await supabase.from('stella_scheduled_actions')
          .select('*').eq('user_id', user.id).eq('status', 'pending');
        if (!data?.length) return;
        const now = Date.now();
        data.forEach((row: { id: string; command: string; description: string; scheduled_for: string }) => {
          const ms = new Date(row.scheduled_for).getTime() - now;
          if (ms > 0) {
            const action: ScheduledAction = {
              id: row.id, command: row.command, description: row.description,
              scheduledAt: new Date(row.scheduled_for).getTime(), status: 'pending',
            };
            setScheduledActions(prev => [...prev, action]);
            const timer = setTimeout(async () => {
              const result = await processCommandFn(row.command).catch(() => ({ matched: false, response: 'Errore' }));
              toast.success(`⏰ Stella: ${result.response}`, { duration: 6000 });
              setScheduledActions(prev => prev.map(a => a.id === row.id ? { ...a, status: 'executed' } : a));
              try { await supabase.from('stella_scheduled_actions').update({ status: 'executed', executed_at: new Date().toISOString() }).eq('id', row.id); } catch { /* noop */ }
              delete timersRef.current[row.id];
            }, ms);
            timersRef.current[row.id] = timer;
          }
        });
      } catch { /* table may not exist */ }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => () => { Object.values(timersRef.current).forEach(clearTimeout); }, []);

  const smartSuggestions = getSmartSuggestions(dna);

  // ─── Toggle helpers ──────────────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled(v => { lsSet('stella_voice_enabled', !v); return !v; });
  }, []);
  const toggleTTS = useCallback(() => {
    setIsTTSEnabled(v => { lsSet('stella_tts_enabled', !v); return !v; });
  }, []);
  const toggleWakeWord = useCallback(() => {
    setIsWakeWordEnabled(v => { lsSet('stella_wakeword_enabled', !v); return !v; });
  }, []);

  // ─── Scheduler ───────────────────────────────────────────────────────────
  const scheduleAction = useCallback((command: string, ms: number, description: string): string => {
    const id = `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const scheduledAt = Date.now() + ms;
    const action: ScheduledAction = { id, command, description, scheduledAt, status: 'pending' };
    setScheduledActions(prev => [...prev, action]);

    const timer = setTimeout(async () => {
      const result = await processCommandFn(command).catch(() => ({ matched: false, response: 'Errore esecuzione' }));
      toast.success(`⏰ Stella: ${result.response}`, { duration: 6000 });
      setScheduledActions(prev => prev.map(a => a.id === id ? { ...a, status: 'executed' } : a));
      try {
        await supabase.from('stella_scheduled_actions').update({ status: 'executed', executed_at: new Date().toISOString() }).eq('id', id);
      } catch { /* noop */ }
      delete timersRef.current[id];
    }, ms);
    timersRef.current[id] = timer;

    // Persist
    if (user) {
      supabase.from('stella_scheduled_actions').insert({
        id, user_id: user.id, command, description,
        scheduled_for: new Date(scheduledAt).toISOString(), status: 'pending',
      }).then(() => { /* noop */ }).catch(() => { /* noop */ });
    }

    toast.success(`⏰ Azione programmata tra ${formatDelay(ms)}!`, { duration: 4000 });
    return id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const cancelScheduled = useCallback((id: string) => {
    if (timersRef.current[id]) { clearTimeout(timersRef.current[id]); delete timersRef.current[id]; }
    setScheduledActions(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    if (user) supabase.from('stella_scheduled_actions').update({ status: 'cancelled' }).eq('id', id).then(() => { /* noop */ }).catch(() => { /* noop */ });
    toast.success('Azione annullata ✓');
  }, [user]);

  // ─── Confirmation helpers ─────────────────────────────────────────────────
  const confirmPending = useCallback(async (): Promise<string> => {
    if (!pendingConfirmation) return 'Nessuna azione in attesa';
    const response = await pendingConfirmation.execute();
    setPendingConfirmation(null);
    return response;
  }, [pendingConfirmation]);

  const cancelPending = useCallback(() => {
    setPendingConfirmation(null);
    toast.info('Azione annullata');
  }, []);

  // ─── DNA learning ─────────────────────────────────────────────────────────
  const learnEvent = useCallback(async (event: StellaEvent) => {
    if (!user) return;
    await dnaLearn(user.id, event);
    const updated = getCachedDNA(user.id);
    if (updated) setDNA({ ...updated });
  }, [user]);

  const getGreeting = useCallback((): string => {
    return getPersonalizedGreeting(dna, profile?.display_name ?? undefined);
  }, [dna, profile?.display_name]);

  // ─── MAIN COMMAND PROCESSOR ───────────────────────────────────────────────
  const processCommandFn = useCallback(async (text: string): Promise<CommandResult> => {
    const lower = text.toLowerCase().trim();

    // 1) Check custom shortcuts first (from DNA)
    if (dna?.customShortcuts) {
      for (const [shortcut, target] of Object.entries(dna.customShortcuts)) {
        if (lower === shortcut.toLowerCase()) {
          navigate(target);
          return { matched: true, response: `Vado su ${target}!` };
        }
      }
    }

    // 2) Extract schedule expression
    const { hasSchedule, ms, cleanCommand } = extractSchedule(lower);
    if (hasSchedule && ms !== null && cleanCommand.length > 3) {
      const id = scheduleAction(cleanCommand, ms, text);
      void id;
      // Learn
      if (user) await dnaLearn(user.id, { type: 'command', data: { text, scheduled: true } });
      return { matched: true, response: `Azione programmata tra ${formatDelay(ms)}! Eseguirò: "${cleanCommand}"`, scheduled: true };
    }

    // Use the original (non-scheduled) text for matching
    const t = lower;

    // 3) Navigation commands (no confirmation, no rate limit)
    if (t.includes('torna indietro') || t.includes('vai indietro') || t === 'indietro') {
      window.history.back();
      if (user) await dnaLearn(user.id, { type: 'navigation', data: { text }, pagePath: window.location.pathname });
      return { matched: true, response: 'Torno alla pagina precedente!' };
    }
    if (t.includes('scorri su') || t.includes('scroll su')) {
      window.scrollBy({ top: -300, behavior: 'smooth' });
      return { matched: true, response: 'Scorro verso l\'alto!' };
    }
    if (t.includes('scorri giù') || t.includes('scorri in basso') || t.includes('scroll giù')) {
      window.scrollBy({ top: 300, behavior: 'smooth' });
      return { matched: true, response: 'Scorro verso il basso!' };
    }

    // Read screen — no limit
    if (t.includes('leggi schermo') || t.includes('cosa c\'è sullo schermo') || t.includes('leggi la pagina')) {
      const content = actionReadScreen();
      return { matched: true, response: content };
    }

    // Theme — no limit
    if (t.includes('tema chiaro') || t.includes('light mode') || t.includes('modalità chiara')) {
      return { matched: true, response: 'Attivo il tema chiaro!', action: 'theme:light' };
    }
    if (t.includes('tema scuro') || t.includes('dark mode') || t.includes('modalità scura')) {
      return { matched: true, response: 'Attivo il tema scuro!', action: 'theme:dark' };
    }

    // 4) Actions requiring rate limits + optional confirmation
    // ── SEND MESSAGE (with content) → needs confirmation
    const msgFull = t.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+([^:,]+?)(?:\s*[,:]\s*|\s+(?:che\s+dice|dicendo|scrivendo)\s+)(.+)/);
    if (msgFull) {
      const [, recipientRaw, content] = msgFull;
      const recipient = recipientRaw.trim();
      const msg = content.trim();
      const execute = async () => {
        if (!user) return 'Devi accedere!';
        const result = await actionSendMessage(user.id, recipient, msg);
        if (result.conversationId) navigate(`/chat/${result.conversationId}`);
        if (user) await dnaLearn(user.id, { type: 'command', data: { text, action: 'message' } });
        return result.response;
      };
      const pendId = `pending-${Date.now()}`;
      setPendingConfirmation({ id: pendId, prompt: `Inviare a ${recipient}: "${msg}"?`, execute });
      return {
        matched: true,
        response: `Vuoi inviare a ${recipient}: "${msg}"?`,
        requiresConfirmation: true,
        confirmationPrompt: `Inviare a ${recipient}: "${msg}"?`,
        executeConfirmed: execute,
      };
    }

    // ── SEND MESSAGE (navigate only)
    const msgSimple = t.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+(.+)/);
    if (msgSimple) {
      navigate('/chat');
      return { matched: true, response: `Apro la chat per ${msgSimple[1].trim()}!` };
    }

    // ── COMMENT → needs confirmation
    const commentMatch = t.match(/commenta\s+(?:il\s+post\s+di|su)\s+([^:,]+?)(?:\s*[,:]\s*|\s+(?:con|dicendo|scrivendo)\s+)(.+)/);
    if (commentMatch) {
      const [, uName, commentText] = commentMatch;
      const execute = async () => {
        if (!user) return 'Devi accedere!';
        const r = await actionCommentPost(user.id, uName.trim(), commentText.trim());
        if (user) await dnaLearn(user.id, { type: 'comment', data: { text } });
        return r;
      };
      const pendId = `pending-${Date.now()}`;
      setPendingConfirmation({ id: pendId, prompt: `Commentare il post di ${uName}: "${commentText}"?`, execute });
      return {
        matched: true,
        response: `Vuoi commentare il post di ${uName}: "${commentText}"?`,
        requiresConfirmation: true,
        confirmationPrompt: `Commentare il post di ${uName}: "${commentText}"?`,
        executeConfirmed: execute,
      };
    }

    // ── CONFIRM BOOKING → needs confirmation
    if (t.includes('conferma prenotazione') || t.includes('conferma appuntamento') || t.includes('approva prenotazione')) {
      const execute = async () => {
        if (!user) return 'Devi accedere!';
        const r = await actionConfirmBooking(user.id);
        navigate('/my-bookings');
        if (user) await dnaLearn(user.id, { type: 'booking', data: { text } });
        return r;
      };
      const pendId = `pending-${Date.now()}`;
      setPendingConfirmation({ id: pendId, prompt: 'Confermare la prossima prenotazione in attesa?', execute });
      return {
        matched: true,
        response: 'Confermare la prossima prenotazione in attesa?',
        requiresConfirmation: true,
        confirmationPrompt: 'Confermare la prossima prenotazione in attesa?',
        executeConfirmed: execute,
      };
    }

    // ── LIKE (rate limited, no confirmation)
    const likeUser = t.match(/(?:metti|dai|aggiungi)\s+like\s+(?:al\s+post\s+di|a)\s+(.+)/);
    if (likeUser) {
      if (!user) return { matched: true, response: 'Devi accedere per mettere like!' };
      const response = await actionLikePost(user.id, likeUser[1].trim());
      toast.success(response);
      await dnaLearn(user.id, { type: 'like', data: { text } });
      return { matched: true, response };
    }
    if (t.match(/metti\s+like|dai\s+like|mi\s+piace\s+(?:al\s+post|questo)/)) {
      if (!user) return { matched: true, response: 'Devi accedere!' };
      const response = await actionLikePost(user.id);
      toast.success(response);
      await dnaLearn(user.id, { type: 'like', data: { text } });
      return { matched: true, response };
    }

    // ── FOLLOW (rate limited, no confirmation)
    const followMatch = t.match(/(?:segui|inizia\s+a\s+seguire)\s+(.+)/);
    if (followMatch) {
      if (!user) return { matched: true, response: 'Devi accedere!' };
      const result = await actionFollowUser(user.id, followMatch[1].trim());
      if (result.profileId) navigate(`/profile/${result.profileId}`);
      await dnaLearn(user.id, { type: 'follow', data: { text } });
      return { matched: true, response: result.response };
    }

    // ── UNFOLLOW
    const unfollowMatch = t.match(/(?:smetti\s+di\s+seguire|togli\s+(?:il\s+)?follow\s+(?:a|di))\s+(.+)/);
    if (unfollowMatch) {
      if (!user) return { matched: true, response: 'Devi accedere!' };
      const response = await actionUnfollowUser(user.id, unfollowMatch[1].trim());
      return { matched: true, response };
    }

    // ── PROFILE INFO
    const profileMatch = t.match(/(?:dimmi|mostrami|fammi\s+vedere|esamina|verifica|controlla|guarda)\s+(?:il\s+)?profilo\s+(?:di\s+)?(.+)/);
    if (profileMatch) {
      const result = await actionGetProfileInfo(profileMatch[1].trim());
      if (result.userId) navigate(`/profile/${result.userId}`);
      if (user) await dnaLearn(user.id, { type: 'search', data: { query: profileMatch[1].trim() } });
      return { matched: true, response: result.text };
    }

    // ── CALL
    const callMatch = t.match(/(?:chiama|telefona|videochiama)\s+(.+)/);
    if (callMatch) {
      navigate('/chat');
      toast.info(`Cerco "${callMatch[1]}" per la chiamata...`);
      return { matched: true, response: `Cerco ${callMatch[1]} per la chiamata!` };
    }

    // ── SEARCH
    const searchMatch = t.match(/^cerca\s+(.+)$/);
    if (searchMatch) {
      navigate(`/search?q=${encodeURIComponent(searchMatch[1].trim())}`);
      if (user) await dnaLearn(user.id, { type: 'search', data: { query: searchMatch[1].trim() } });
      return { matched: true, response: `Cerco "${searchMatch[1].trim()}"!` };
    }
    const radiusMatch = t.match(/cerca\s+(?:match|amici|stilisti)\s+(?:a|entro)\s*(\d+)\s*km/);
    if (radiusMatch) {
      navigate(`/map-search?radius=${radiusMatch[1]}`);
      return { matched: true, response: `Cerco match entro ${radiusMatch[1]} km!` };
    }
    if (t.includes('cerca match') || t.includes('trova match')) {
      navigate('/map-search');
      return { matched: true, response: 'Apro la mappa dei match!' };
    }

    // 5) Pure navigation
    const nav: [string | RegExp, string, string][] = [
      [/vai alla home|apri home|torna alla home/, '/', 'Ti porto alla home!'],
      [/apri chat|vai alla chat|messaggi/, '/chat', 'Apro la chat!'],
      [/apri notifiche|dimmi le notifiche|tutte le notifiche|leggi notifiche/, '/notifications', 'Ecco le notifiche!'],
      [/apri profilo|vai al mio profilo|mostra profilo/, '/profile', 'Ecco il tuo profilo!'],
      [/apri wallet|vai al wallet|portafoglio/, '/wallet', 'Apro il wallet!'],
      [/le mie prenotazioni|mostra prenotazioni|miei appuntamenti/, '/my-bookings', 'Ecco le prenotazioni!'],
      [/prenota\b/, '/stylists', 'Ti mostro i professionisti!'],
      [/apri mappa|cerca sulla mappa/, '/map-search', 'Apro la mappa!'],
      [/vai allo shop|apri shop|negozio/, '/shop', 'Apro lo shop!'],
      [/apri missioni|vai alle missioni/, '/missions', 'Ecco le missioni!'],
      [/gira la ruota|ruota della fortuna/, '/spin', 'Apro la ruota!'],
      [/vai in live|apri live/, '/live', 'Ti porto nel live!'],
      [/apri radio|musica/, '/radio', 'Apro la radio!'],
      [/impostazioni/, '/settings', 'Apro le impostazioni!'],
      [/esplora/, '/explore', 'Apro esplora!'],
      [/crea post|pubblica post/, '/create-post', 'Apro la creazione post!'],
      [/classifica|leaderboard/, '/leaderboard', 'Apro la classifica!'],
      [/sfide|challenge/, '/challenges', 'Ecco le sfide!'],
      [/shorts|video brevi/, '/shorts', 'Apro i video shorts!'],
      [/eventi/, '/events', 'Ecco gli eventi!'],
      [/marketplace/, '/marketplace', 'Apro il marketplace!'],
      [/spa|terme|benessere/, '/spa-terme', 'Ecco le Spa e Terme!'],
      [/quiz/, '/quiz-live', 'Apro il Quiz Live!'],
      [/referral|invita amici/, '/referral', 'Apro il programma referral!'],
      [/offerte/, '/offers', 'Apro le offerte!'],
      [/ai assistant|assistente ai|assistente stella/, '/ai-assistant', 'Apro Stella AI!'],
      [/stella ai|apri stella/, '/ai-assistant', 'Apro Stella AI!'],
    ];

    for (const [pattern, path, response] of nav) {
      const match = typeof pattern === 'string' ? t.includes(pattern) : pattern.test(t);
      if (match) {
        navigate(path);
        if (user) await dnaLearn(user.id, { type: 'navigation', data: { text, path }, pagePath: path });
        return { matched: true, response };
      }
    }

    // Not matched — caller will send to AI
    return {
      matched: false,
      response: 'Non ho capito. Puoi dirmi: "invia messaggio a [nome]: [testo]", "metti like a [nome]", "segui [nome]", "commenta [nome]: [testo]", "esamina profilo di [nome]", "conferma prenotazione", "vai alla home", "cerca [termine]", o programmare con "tra X minuti…".',
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dna, navigate, user, scheduleAction]);

  // Stable ref so scheduler callbacks always call the latest version
  const processCommandRef = useRef(processCommandFn);
  processCommandRef.current = processCommandFn;
  const processCommand = useCallback((text: string) => processCommandRef.current(text), []);

  const value: StellaContextValue = {
    dna, isVoiceEnabled, isTTSEnabled, isWakeWordEnabled,
    pendingConfirmation, scheduledActions, smartSuggestions,
    processCommand, confirmPending, cancelPending,
    toggleVoice, toggleTTS, toggleWakeWord,
    scheduleAction, cancelScheduled,
    learnEvent, getGreeting,
  };

  return <StellaContext.Provider value={value}>{children}</StellaContext.Provider>;
}

export function useStellaContext(): StellaContextValue {
  const ctx = useContext(StellaContext);
  if (!ctx) throw new Error('useStellaContext must be used inside StellaProvider');
  return ctx;
}
