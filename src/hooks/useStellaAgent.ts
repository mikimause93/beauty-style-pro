import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haversineDistance } from '@/hooks/useGeolocation';
import { useStellaLearning } from '@/hooks/useStellaLearning';

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

function normalizeActionLabel(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
  const location = useLocation();
  const { user, profile } = useAuth();
  const { speak, cancel: cancelTTS, speaking } = useVoiceSynthesis();
  const { analyzePatterns, getProactiveSuggestions, trackPageVisit, getTopPages } = useStellaLearning();

  const [messages, setMessages] = useState<StellaMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [wakeWordActive, setWakeWordActive] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<StellaCommand | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<Array<{ text: string; command: string }>>([]);
  const [inlineStatus, setInlineStatus] = useState<string | null>(null);
  const handleCommandRef = useRef<(text: string) => Promise<void> | void>(() => {});
  const restartWakeWordTimeoutRef = useRef<number | null>(null);
  const clearInlineStatus = useCallback(() => setInlineStatus(null), []);
  const clearWakeWordResumeTimeout = useCallback(() => {
    if (restartWakeWordTimeoutRef.current !== null) {
      window.clearTimeout(restartWakeWordTimeoutRef.current);
      restartWakeWordTimeoutRef.current = null;
    }
  }, []);

  const isOpenRef = useRef(false);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // Track page visits for learning
  useEffect(() => {
    trackPageVisit(location.pathname);
  }, [location.pathname, trackPageVisit]);

  // Periodically generate proactive suggestions
  useEffect(() => {
    if (!user) return;
    const loadSuggestions = async () => {
      const suggestions = await getProactiveSuggestions();
      setProactiveSuggestions(suggestions.map(s => ({ text: s.text, command: s.command })));
    };
    loadSuggestions();
    const interval = setInterval(loadSuggestions, 600000); // every 10 min
    return () => clearInterval(interval);
  }, [user, getProactiveSuggestions]);

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
    wakeWordEnabled: wakeWordActive,
    wakeWords: [
      // Multilingual wake words
      'stella', 'hey stella', 'ehi stella', 'ciao stella',
      'hi stella', 'ok stella', 'hola stella', 'oi stella',
      'hé stella', 'hallo stella', 'привет стелла',
    ],
    onWakeWordDetected: (command?: string) => {
      const trimmedCommand = command?.trim();

      if (trimmedCommand) {
        setInlineStatus(`Eseguo: ${trimmedCommand}`);
        void Promise.resolve(handleCommandRef.current(trimmedCommand));
        return;
      }

      setInlineStatus('Sono qui! Dimmi cosa fare.');
      if (ttsEnabled) {
        speak('Sono qui! Dimmi cosa fare.');
      }
    },
  });

  const wakeWordActiveRef = useRef(wakeWordActive);
  useEffect(() => { wakeWordActiveRef.current = wakeWordActive; }, [wakeWordActive]);
  const isListeningRef = useRef(isListening);
  const isWakeWordListeningRef = useRef(isWakeWordListening);

  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isWakeWordListeningRef.current = isWakeWordListening; }, [isWakeWordListening]);

  const scheduleWakeWordResume = useCallback((delayMs = 1400) => {
    if (!wakeWordActiveRef.current) return;

    clearWakeWordResumeTimeout();
    restartWakeWordTimeoutRef.current = window.setTimeout(() => {
      if (
        wakeWordActiveRef.current &&
        !isListeningRef.current &&
        !isWakeWordListeningRef.current
      ) {
        startWakeWordListening();
      }
    }, delayMs);
  }, [clearWakeWordResumeTimeout, startWakeWordListening]);

  useEffect(() => () => clearWakeWordResumeTimeout(), [clearWakeWordResumeTimeout]);

  // Auto-start wake word listening on mount
  useEffect(() => {
    if (!isSupported || !wakeWordActive || isWakeWordListening || isListening) return;

    const timer = window.setTimeout(() => startWakeWordListening(), 500);
    return () => window.clearTimeout(timer);
  }, [isSupported, wakeWordActive, isWakeWordListening, isListening, startWakeWordListening]);

  // Process transcript when command listening ends
  const lastTranscriptRef = useRef('');
  useEffect(() => {
    if (!transcript || isListening || transcript === lastTranscriptRef.current) return;

    lastTranscriptRef.current = transcript;
    void Promise.resolve(handleCommandRef.current(transcript));
    resetTranscript();
  }, [transcript, isListening]);

  const addMessage = useCallback((msg: Omit<StellaMessage, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString() + Math.random() }]);
  }, []);

  const stellaSpeak = useCallback((text: string) => {
    if (ttsEnabled) speak(text);
  }, [ttsEnabled, speak]);

  const logStellaCommand = useCallback((commandText: string, commandType: string, extra: Record<string, any> = {}) => {
    if (!user) return;

    void supabase.from('stella_commands').insert({
      user_id: user.id,
      command_text: commandText,
      command_type: commandType,
      status: 'completed',
      executed_at: new Date().toISOString(),
      ...extra,
    }).then(({ error }) => {
      if (error) {
        console.warn('Stella command log error:', error);
      }
    });
  }, [user]);

  const clickVisibleAction = useCallback((labels: string[]) => {
    const normalizedLabels = labels.map(normalizeActionLabel).filter(Boolean);
    if (normalizedLabels.length === 0) return false;

    const elements = Array.from(document.querySelectorAll<HTMLElement>(
      'button, a, [role="button"], input[type="button"], input[type="submit"], [data-stella-action]'
    ));

    const target = elements.find((element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) {
        return false;
      }

      const text = normalizeActionLabel([
        element.textContent || '',
        element.getAttribute('aria-label') || '',
        element.getAttribute('title') || '',
        element.getAttribute('value') || '',
        element.dataset?.stellaAction || '',
      ].join(' '));

      return normalizedLabels.some((label) => text.includes(label));
    });

    if (!target) return false;

    target.click();
    return true;
  }, []);

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

  const callContact = useCallback(async (targetName: string) => {
    const profiles = await findProfileByName(targetName);

    if (profiles.length > 0) {
      const targetUserId = profiles[0].user_id;
      const [{ data: profilePhone }, { data: professionalPhone }, { data: businessPhone }] = await Promise.all([
        supabase.from('profiles').select('display_name, phone').eq('user_id', targetUserId).maybeSingle(),
        supabase.from('professionals').select('business_name, phone').eq('user_id', targetUserId).maybeSingle(),
        supabase.from('businesses').select('business_name, phone').eq('user_id', targetUserId).maybeSingle(),
      ]);

      const label = businessPhone?.business_name || professionalPhone?.business_name || profilePhone?.display_name || profiles[0].display_name || profiles[0].username || targetName;
      const phone = profilePhone?.phone || professionalPhone?.phone || businessPhone?.phone;

      if (phone) {
        window.location.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
        return `Sto chiamando ${label}.`;
      }

      navigate('/chat');
      return `Non ho trovato un numero per ${label}, quindi apro la chat.`;
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('business_name, phone')
      .ilike('business_name', `%${targetName}%`)
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    if (business?.phone) {
      window.location.href = `tel:${business.phone.replace(/[^\d+]/g, '')}`;
      return `Sto chiamando ${business.business_name}.`;
    }

    navigate('/chat');
    return `Non ho trovato ${targetName}, quindi apro la chat.`;
  }, [findProfileByName, navigate]);

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
    return 'Like aggiunto! ❤️';
  }, [user, findProfileByName]);

  // ── Helper: comment on a post ─────────────────────────────────────────────
  const commentOnPost = useCallback(async (comment: string, targetName?: string) => {
    if (!user) return 'Devi effettuare il login per commentare!';
    
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
      const { data: posts } = await supabase
        .from('posts')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);
      postId = posts?.[0]?.id || null;
    }
    
    if (!postId) return 'Non ho trovato post da commentare.';
    
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      message: comment,
    });
    
    if (error) return 'Errore nel commentare. Riprova!';
    return `Commento aggiunto: "${comment}" 💬`;
  }, [user, findProfileByName]);

  // ── Helper: create a post ─────────────────────────────────────────────────
  const createPost = useCallback(async (content: string) => {
    if (!user) return 'Devi effettuare il login per pubblicare!';
    
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      caption: content,
      post_type: 'image',
    });
    
    if (error) return 'Errore nella pubblicazione. Riprova!';
    return `Post pubblicato: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}" ✅`;
  }, [user]);

  // ── Helper: unfollow a user ───────────────────────────────────────────────
  const unfollowUser = useCallback(async (targetName: string) => {
    if (!user) return 'Devi effettuare il login!';
    
    const profiles = await findProfileByName(targetName);
    if (profiles.length === 0) return `Non ho trovato "${targetName}".`;
    
    const target = profiles[0];
    const { error } = await supabase.from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', target.user_id);
    
    if (error) return 'Errore. Riprova!';
    return `Hai smesso di seguire ${target.display_name || target.username}! ✅`;
  }, [user, findProfileByName]);

  // ── Helper: confirm/cancel booking ────────────────────────────────────────
  const manageBooking = useCallback(async (action: 'confirm' | 'cancel') => {
    if (!user) return 'Devi effettuare il login!';
    
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, booking_date, status')
      .eq('client_id', user.id)
      .eq('status', 'pending')
      .order('booking_date', { ascending: true })
      .limit(1);
    
    if (!bookings?.length) return 'Non hai prenotazioni in sospeso!';
    
    const booking = bookings[0];
    const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
    
    const { error } = await supabase.from('bookings')
      .update({ status: newStatus })
      .eq('id', booking.id);
    
    if (error) return `Errore nel ${action === 'confirm' ? 'confermare' : 'cancellare'} la prenotazione.`;
    return action === 'confirm' 
      ? `Prenotazione del ${booking.booking_date} confermata! ✅`
      : `Prenotazione del ${booking.booking_date} cancellata! ❌`;
  }, [user]);

  // ── Helper: find nearby professionals/salons by city or GPS ─────────────
  const findNearbyProfessionals = useCallback(async (city?: string, specialty?: string) => {
    // Try professionals table
    let query = supabase.from('professionals').select('id, business_name, specialty, city, rating, latitude, longitude');
    if (city) query = query.ilike('city', `%${city}%`);
    if (specialty) query = query.ilike('specialty', `%${specialty}%`);
    const { data: pros } = await query.order('rating', { ascending: false }).limit(10);

    // Try businesses table
    let bizQuery = supabase.from('businesses').select('id, business_name, business_type, city, rating, latitude, longitude, phone, address');
    if (city) bizQuery = bizQuery.ilike('city', `%${city}%`);
    bizQuery = bizQuery.eq('active', true);
    const { data: biz } = await bizQuery.order('rating', { ascending: false }).limit(10);

    // Also try profiles table (professional users registered here)
    let profileQuery = supabase.from('profiles').select('user_id, display_name, user_type, city, latitude, longitude')
      .in('user_type', ['professional', 'business']);
    if (city) profileQuery = profileQuery.ilike('city', `%${city}%`);
    const { data: profilePros } = await profileQuery.limit(20);

    const results: Array<{ name: string; type: string; city: string; rating: number | null; distance?: number }> = [];

    // Get user position for distance calc
    let userLat: number | null = null;
    let userLng: number | null = null;
    if (profile && (profile as any).latitude) {
      userLat = (profile as any).latitude;
      userLng = (profile as any).longitude;
    } else if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
      } catch { /* ignore */ }
    }

    // Collect unique names to avoid duplicates
    const seenNames = new Set<string>();

    if (pros?.length) {
      for (const p of pros) {
        if (seenNames.has(p.business_name)) continue;
        seenNames.add(p.business_name);
        const dist = userLat && p.latitude ? haversineDistance(userLat, userLng!, p.latitude, p.longitude!) : undefined;
        results.push({ name: p.business_name, type: p.specialty || 'Professionista', city: p.city || '', rating: p.rating, distance: dist });
      }
    }
    if (biz?.length) {
      for (const b of biz) {
        if (seenNames.has(b.business_name)) continue;
        seenNames.add(b.business_name);
        const dist = userLat && b.latitude ? haversineDistance(userLat, userLng!, b.latitude, b.longitude!) : undefined;
        results.push({ name: b.business_name, type: b.business_type || 'Salone', city: b.city || '', rating: b.rating, distance: dist });
      }
    }
    if (profilePros?.length) {
      for (const p of profilePros) {
        const name = p.display_name || 'Professionista';
        if (seenNames.has(name)) continue;
        seenNames.add(name);
        const dist = userLat && p.latitude ? haversineDistance(userLat, userLng!, p.latitude, p.longitude!) : undefined;
        results.push({ name, type: p.user_type === 'business' ? 'Attività' : 'Professionista', city: p.city || '', rating: null, distance: dist });
      }
    }

    // Sort by distance if available, then by rating
    results.sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      if (a.distance != null) return -1;
      if (b.distance != null) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    if (results.length === 0) {
      return { found: false, message: city 
        ? `Non ho trovato professionisti o saloni a ${city}. Prova a cercare in un'altra città!`
        : 'Non ho trovato professionisti nelle vicinanze. Prova a specificare una città!' };
    }

    const top = results.slice(0, 5);
    const lines = top.map((r, i) => {
      const dist = r.distance != null ? ` (${r.distance.toFixed(1)} km)` : '';
      const stars = r.rating ? ` ⭐${r.rating}` : '';
      return `${i + 1}. ${r.name} — ${r.type}${r.city ? ', ' + r.city : ''}${stars}${dist}`;
    });

    return {
      found: true,
      count: results.length,
      message: `Ho trovato ${results.length} risultat${results.length === 1 ? 'o' : 'i'}${city ? ' a ' + city : ' vicino a te'}:\n${lines.join('\n')}`,
      summary: `Ho trovato ${results.length} professionisti${city ? ' a ' + city : ''}! I migliori: ${top.slice(0, 3).map(r => r.name).join(', ')}`,
    };
  }, [profile]);

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

  // ── Helper: get user stats summary ─────────────────────────────────────────
  const getUserStats = useCallback(async () => {
    if (!user) return 'Devi effettuare il login!';
    const [{ count: postCount }, { count: bookingCount }, { count: followerCount }] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('client_id', user.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
    ]);
    const coins = profile?.qr_coins ?? 0;
    return `📊 Le tue stats:\n• ${postCount || 0} post pubblicati\n• ${bookingCount || 0} prenotazioni\n• ${followerCount || 0} follower\n• ${coins} QR Coins`;
  }, [user, profile]);

  // ── Helper: get notifications summary ─────────────────────────────────────
  const getNotificationsSummary = useCallback(async () => {
    if (!user) return 'Devi effettuare il login!';
    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('read', false);
    if (!count || count === 0) return 'Non hai notifiche non lette! ✅';
    return `Hai ${count} notifiche non lette! 🔔`;
  }, [user]);

  // ── Helper: get upcoming bookings ─────────────────────────────────────────
  const getUpcomingBookings = useCallback(async () => {
    if (!user) return 'Devi effettuare il login!';
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('bookings')
      .select('booking_date, start_time, status')
      .eq('client_id', user.id)
      .gte('booking_date', today)
      .in('status', ['confirmed', 'pending'])
      .order('booking_date', { ascending: true })
      .limit(3);
    if (!data?.length) return 'Non hai appuntamenti in programma! 📅';
    const lines = data.map((b, i) => `${i + 1}. ${b.booking_date} alle ${b.start_time} (${b.status === 'confirmed' ? '✅' : '⏳'})`);
    return `📅 Prossimi appuntamenti:\n${lines.join('\n')}`;
  }, [user]);

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

    // ── SHOW LATEST PHOTOS / POSTS ────────────────────────────────────────
    const latestPhotosMatch = stripped.match(/(?:mostrami|mostra|vedi|apri)\s+(?:le\s+)?ultim(?:e|a)\s+foto(?:\s+pubblicat[ae])?\s+(?:di|del|della|de|da)\s+(.+)/);
    if (latestPhotosMatch) {
      const target = latestPhotosMatch[1]?.trim() ? latestPhotosMatch[1].trim() : latestPhotosMatch[2].trim();
      return {
        id: Date.now().toString(), type: 'action', text,
        response: `Ti mostro le ultime foto di ${target}...`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await goToProfile(target);
          const spokenResult = result.includes('Non ho trovato')
            ? result
            : `Ti mostro le ultime foto di ${target}.`;
          toast.success(`🌟 Stella: ${spokenResult}`);
          stellaSpeak(spokenResult);
        },
      };
    }

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

    // ── NEARBY PROFESSIONALS (with real DB results) ─────────────────────
    const nearbyPatterns = ['professionisti in zona', 'professionisti disponibili', 'professionisti vicini',
      'chi è disponibile', 'saloni vicini', 'stilisti vicini', 'parrucchieri vicini', 'chi c\'è in zona',
      'trova professionisti', 'cerca professionisti vicino', 'saloni a', 'parrucchieri a', 'professionisti a',
      'stilisti a', 'chi c\'è a', 'trova saloni', 'cerca saloni'];
    const cityExtract = stripped.match(/(?:professionisti|saloni|stilisti|parrucchieri|chi c'è)\s+(?:a|in|di|near|vicino a|nella città di)\s+(.+)/);
    const requestedCity = cityExtract?.[1]?.trim();
    
    if (nearbyPatterns.some(p => stripped.includes(p)) || requestedCity) {
      return {
        id: Date.now().toString(), type: 'search', text,
        response: requestedCity ? `Cerco professionisti a ${requestedCity}...` : 'Cerco professionisti vicino a te...', 
        requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await findNearbyProfessionals(requestedCity || profile?.city || undefined);
          if (result.found) {
            toast.success(`🌟 Stella: ${result.summary}`, { duration: 6000 });
            stellaSpeak(result.summary!);
            // Also navigate to stylists page for full list
            navigate('/stylists');
          } else {
            toast.info(`🌟 Stella: ${result.message}`, { duration: 5000 });
            stellaSpeak(result.message);
            navigate('/map-search');
          }
        },
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

    // ── CLICK / PRESS CURRENT UI ACTIONS ──────────────────────────────────
    const quickActionButtons: Record<string, string[]> = {
      prenota: ['prenota', 'book', 'book now'],
      conferma: ['conferma', 'confirm'],
      continua: ['continua', 'continue', 'prosegui'],
      salva: ['salva', 'save'],
      invia: ['invia', 'send'],
    };

    if (quickActionButtons[stripped]) {
      const targetLabel = stripped;
      return {
        id: Date.now().toString(), type: 'action', text,
        response: `Eseguo "${targetLabel}" qui nella pagina...`, requiresConfirmation: false, silent: true,
        execute: () => {
          const clicked = clickVisibleAction(quickActionButtons[targetLabel]);
          const result = clicked
            ? `Ho premuto "${targetLabel}".`
            : `Qui non vedo un pulsante "${targetLabel}".`;

          if (clicked) toast.success(`🌟 Stella: ${result}`);
          else toast.info(`🌟 Stella: ${result}`);
          stellaSpeak(result);
        },
      };
    }

    const clickActionMatch = stripped.match(/(?:clicca|premi|tocca|seleziona)\s+(.+)/);
    if (clickActionMatch) {
      const targetLabel = clickActionMatch[1].trim();
      return {
        id: Date.now().toString(), type: 'action', text,
        response: `Cerco il pulsante "${targetLabel}"...`, requiresConfirmation: false, silent: true,
        execute: () => {
          const clicked = clickVisibleAction([targetLabel]);
          const result = clicked
            ? `Ho premuto "${targetLabel}".`
            : `Qui non vedo un pulsante "${targetLabel}".`;

          if (clicked) toast.success(`🌟 Stella: ${result}`);
          else toast.info(`🌟 Stella: ${result}`);
          stellaSpeak(result);
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
    if (stripped.includes('prossimo appuntamento') || stripped.includes('prossima prenotazione') || stripped.includes('i miei appuntamenti')) {
      return { id: Date.now().toString(), type: 'info', text, response: 'Verifico le tue prenotazioni...', requiresConfirmation: false,
        execute: async () => {
          const result = await getUpcomingBookings();
          addMessage({ role: 'stella', content: result, type: 'action_result' });
          stellaSpeak(result.split('\n')[0]);
          toast.success(`🌟 Stella: ${result.split('\n')[0]}`);
        } };
    }
    if (stripped.includes('le mie statistiche') || stripped.includes('i miei dati') || stripped.includes('quanto ho') || stripped.includes('come va')) {
      return { id: Date.now().toString(), type: 'info', text, response: 'Carico le tue statistiche...', requiresConfirmation: false,
        execute: async () => {
          const result = await getUserStats();
          addMessage({ role: 'stella', content: result, type: 'action_result' });
          stellaSpeak(result.replace(/[•📊\n]/g, ', '));
          toast.success(`🌟 Stella: Ecco le tue stats!`);
        } };
    }
    if (stripped.includes('notifiche non lette') || stripped.includes('ho notifiche') || stripped.includes('quante notifiche')) {
      return { id: Date.now().toString(), type: 'info', text, response: 'Controllo le notifiche...', requiresConfirmation: false,
        execute: async () => {
          const result = await getNotificationsSummary();
          addMessage({ role: 'stella', content: result, type: 'action_result' });
          stellaSpeak(result);
          toast.success(`🌟 Stella: ${result}`);
        } };
    }

    // ── CALL ──────────────────────────────────────────────────────────────
    const callMatch = stripped.match(/(?:chiama|telefona|videochiama)\s+(.+)/);
    if (callMatch) {
      return {
        id: Date.now().toString(), type: 'call', text,
        response: `Cerco ${callMatch[1]} per la chiamata!`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await callContact(callMatch[1].trim());
          toast.success(`🌟 Stella: ${result}`);
          stellaSpeak(result);
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

    // ── COMMENT ─────────────────────────────────────────────────────────
    const commentMatch = stripped.match(/(?:commenta|scrivi un commento|lascia un commento)\s+(?:a|al post di|sulla foto di|su)\s+([^:,]+?)(?:\s*[,:]\s*|\s+(?:che|dicendo|scrivendo|con)\s+)(.+)/);
    if (commentMatch) {
      const target = commentMatch[1].trim();
      const comment = commentMatch[2].trim();
      return {
        id: Date.now().toString(), type: 'action' as StellaCommand['type'], text,
        response: `Commento sul post di ${target}...`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await commentOnPost(comment, target);
          toast.success(`🌟 Stella: ${result}`);
          stellaSpeak(result);
        },
      };
    }
    const commentSimple = stripped.match(/(?:commenta|scrivi)\s+["']?(.+?)["']?\s+(?:sull'ultimo|sul primo|sul post)/);
    if (commentSimple) {
      const comment = commentSimple[1].trim();
      return {
        id: Date.now().toString(), type: 'action' as StellaCommand['type'], text,
        response: `Commento: "${comment}"`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await commentOnPost(comment);
          toast.success(`🌟 Stella: ${result}`);
          stellaSpeak(result);
        },
      };
    }

    // ── CREATE POST ───────────────────────────────────────────────────────
    const postMatch = stripped.match(/(?:pubblica|posta|scrivi un post|crea un post)\s+(?:che\s+)?(?:dice\s+)?["']?(.+?)["']?$/);
    if (postMatch) {
      const content = postMatch[1].trim();
      return {
        id: Date.now().toString(), type: 'action' as StellaCommand['type'], text,
        response: `Pubblico il post...`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await createPost(content);
          toast.success(`🌟 Stella: ${result}`);
          stellaSpeak(result);
        },
      };
    }

    // ── UNFOLLOW ──────────────────────────────────────────────────────────
    const unfollowMatch = stripped.match(/(?:smetti di seguire|non seguire più|unfollow)\s+(.+)/);
    if (unfollowMatch) {
      const target = unfollowMatch[1].trim();
      return {
        id: Date.now().toString(), type: 'action' as StellaCommand['type'], text,
        response: `Smetto di seguire ${target}...`, requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await unfollowUser(target);
          toast.success(`🌟 Stella: ${result}`);
          stellaSpeak(result);
        },
      };
    }

    // ── CONFIRM / CANCEL BOOKING ─────────────────────────────────────────
    if (stripped.includes('conferma prenotazione') || stripped.includes('conferma appuntamento') || stripped.includes('conferma il mio appuntamento')) {
      return {
        id: Date.now().toString(), type: 'action' as StellaCommand['type'], text,
        response: 'Confermo la prenotazione...', requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await manageBooking('confirm');
          toast.success(`🌟 Stella: ${result}`);
          stellaSpeak(result);
        },
      };
    }
    if (stripped.includes('cancella prenotazione') || stripped.includes('annulla prenotazione') || stripped.includes('annulla appuntamento') || stripped.includes('disdici')) {
      return {
        id: Date.now().toString(), type: 'action' as StellaCommand['type'], text,
        response: 'Annullo la prenotazione...', requiresConfirmation: false, silent: true,
        execute: async () => {
          const result = await manageBooking('cancel');
          toast.success(`🌟 Stella: ${result}`);
          stellaSpeak(result);
        },
      };
    }

    // ── HELP ──────────────────────────────────────────────────────────────
    if (stripped.includes('aiuto') || stripped.includes('help') || stripped.includes('cosa puoi fare') || stripped.includes('comandi')) {
      return {
        id: Date.now().toString(), type: 'info', text,
        response: '🌟 Sono Stella, faccio TUTTO per te come Alexa & Siri!\n\n' +
          '👤 "mostrami profilo Mario Rossi"\n' +
          '📍 "professionisti vicini" · "cerca sulla mappa"\n' +
          '❤️ "metti like a Anna" · "segui Marco" · "smetti di seguire"\n' +
          '💬 "invia messaggio a Sara: ciao!" · "commenta bello su post di Anna"\n' +
          '📝 "pubblica: sono dal parrucchiere!" · "crea post"\n' +
          '✂️ "prenota con Studio Bella" · "conferma prenotazione" · "annulla appuntamento"\n' +
          '📱 "apri shop" · "vai alla home" · "apri wallet"\n' +
          '🎨 "prova look" · "genera sito" · "tema scuro"\n' +
          '🔍 "cerca parrucchiere" · "scorri giù" · "condividi"\n' +
          '⏰ "ricordami taglio domani" · "quanti coin ho?"\n\n' +
          'Dì "Stella" + comando — agisco SUBITO senza aprire niente! 🚀',
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
  }, [navigate, profile, user, goToProfile, likeLatestPost, followUser, unfollowUser, sendMessageTo, findProfileByName, stellaSpeak, commentOnPost, createPost, manageBooking, findNearbyProfessionals, addMessage, getUserStats, getNotificationsSummary, getUpcomingBookings, clickVisibleAction, callContact]);

  // ── AI Intent Parsing (multilingual — understands every language) ──────
  const executeAIIntent = useCallback(async (intent: string, params: any, response: string) => {
    const actionFeedback = (msg: string, icon = '🌟') => {
      toast.success(`${icon} Stella: ${msg}`, { duration: 4000 });
    };

    // Helper: delay navigation so user sees the response first
    const delayedNavigate = (route: string, delayMs = 1200) => {
      setTimeout(() => navigate(route), delayMs);
    };

    switch (intent) {
      case 'navigate':
        if (params?.route) {
          actionFeedback(response, '🚀');
          delayedNavigate(params.route);
        } else {
          actionFeedback(response, '📍');
          delayedNavigate('/map-search');
        }
        break;
      case 'search':
        actionFeedback(response, '🔍');
        delayedNavigate(`/search?q=${encodeURIComponent(params?.query || '')}`);
        break;
      case 'show_profile': {
        if (params?.name) {
          const result = await goToProfile(params.name);
          actionFeedback(result, '👤');
        }
        break;
      }
      case 'like': {
        const likeResult = await likeLatestPost(params?.target_name);
        actionFeedback(likeResult, '❤️');
        break;
      }
      case 'comment': {
        const commentResult = await commentOnPost(params?.comment_text || params?.content || 'Bellissimo! 🔥', params?.target_name);
        actionFeedback(commentResult, '💬');
        break;
      }
      case 'follow': {
        if (params?.target_name) {
          const followResult = await followUser(params.target_name);
          actionFeedback(followResult, '✅');
        }
        break;
      }
      case 'unfollow': {
        if (params?.target_name) {
          const unfollowResult = await unfollowUser(params.target_name);
          actionFeedback(unfollowResult, '🚫');
        }
        break;
      }
      case 'send_message':
        if (params?.recipient && params?.content) {
          const msgResult = await sendMessageTo(params.recipient, params.content);
          actionFeedback(msgResult, '💬');
        } else if (params?.recipient) {
          await findProfileByName(params.recipient);
          actionFeedback(response, '💬');
          delayedNavigate('/chat');
        }
        break;
      case 'create_post': {
        if (params?.content) {
          const postResult = await createPost(params.content);
          actionFeedback(postResult, '📝');
        } else {
          actionFeedback(response, '📝');
          delayedNavigate('/create-post');
        }
        break;
      }
      case 'book':
        if (params?.target_name) {
          const profiles = await findProfileByName(params.target_name);
          actionFeedback(response, '✂️');
          if (profiles.length > 0) delayedNavigate(`/stylist/${profiles[0].user_id}`);
          else delayedNavigate('/stylists');
        } else {
          actionFeedback(response, '✂️');
          delayedNavigate('/stylists');
        }
        break;
      case 'confirm_booking': {
        const confirmResult = await manageBooking('confirm');
        actionFeedback(confirmResult, '✅');
        break;
      }
      case 'cancel_booking': {
        const cancelResult = await manageBooking('cancel');
        actionFeedback(cancelResult, '❌');
        break;
      }
      case 'call':
        actionFeedback(response, '📞');
        delayedNavigate('/chat');
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
        actionFeedback(response, params?.mode === 'dark' ? '🌙' : '☀️');
        break;
      case 'share':
        if (navigator.share) navigator.share({ title: 'STYLE', url: window.location.href }).catch(() => {});
        else navigator.clipboard.writeText(window.location.href);
        actionFeedback(response, '🔗');
        break;
      case 'refresh':
        actionFeedback(response, '🔄');
        setTimeout(() => window.location.reload(), 1500);
        break;
      case 'back':
        actionFeedback(response, '⬅️');
        setTimeout(() => window.history.back(), 800);
        break;
      case 'info':
        if (params?.info_type === 'coins') {
          const coins = profile?.qr_coins ?? 0;
          actionFeedback(`Hai ${coins} QR Coins`, '💰');
        } else if (params?.info_type === 'bookings') {
          const bookingsInfo = await getUpcomingBookings();
          addMessage({ role: 'stella', content: bookingsInfo, type: 'action_result' });
          actionFeedback(bookingsInfo.split('\n')[0], '📅');
        } else if (params?.info_type === 'general') {
          const stats = await getUserStats();
          addMessage({ role: 'stella', content: stats, type: 'action_result' });
          actionFeedback('Ecco le tue statistiche!', '📊');
        } else {
          actionFeedback(response, 'ℹ️');
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
          actionFeedback(response, '⏰');
        }
        break;
      case 'suggest': {
        // Proactive suggestion based on type
        const suggestions: Record<string, { route: string; msg: string }> = {
          beauty: { route: '/ai-look', msg: 'Prova un nuovo look con l\'AI! 🎨' },
          social: { route: '/explore', msg: 'Scopri cosa c\'è di nuovo! 🔥' },
          business: { route: '/analytics', msg: 'Controlla le tue statistiche! 📊' },
          fun: { route: '/spin', msg: 'Gira la ruota della fortuna! 🎰' },
        };
        const s = suggestions[params?.suggestion_type || 'beauty'] || suggestions.beauty;
        actionFeedback(s.msg, '💡');
        delayedNavigate(s.route);
        break;
      }
      case 'find_nearby': {
        const nearbyResult = await findNearbyProfessionals(params?.city, params?.specialty);
        if (nearbyResult.found) {
          addMessage({ role: 'stella', content: nearbyResult.message, type: 'action_result' });
          actionFeedback(nearbyResult.summary!, '📍');
          delayedNavigate('/stylists', 2500);
        } else {
          addMessage({ role: 'stella', content: nearbyResult.message, type: 'action_result' });
          actionFeedback(nearbyResult.message, '📍');
          delayedNavigate('/map-search', 2500);
        }
        break;
      }
      default:
        actionFeedback(response.substring(0, 120) + (response.length > 120 ? '...' : ''), '💬');
        break;
    }
  }, [navigate, profile, user, goToProfile, likeLatestPost, followUser, unfollowUser, sendMessageTo, findProfileByName, commentOnPost, createPost, manageBooking, findNearbyProfessionals, addMessage, getUserStats, getUpcomingBookings]);

  const askAI = useCallback(async (text: string) => {
    setIsAIThinking(true);
    setInlineStatus('Sto pensando...');
    try {
      const patterns = await analyzePatterns();
      const topActions = patterns.slice(0, 5).map(p => `${p.action}(${p.count}x)`).join(', ');
      const topPages = getTopPages().slice(0, 3).join(', ');

      const { data, error } = await supabase.functions.invoke('stella-intent', {
        body: {
          text,
          context: {
            user_type: profile?.user_type || 'client',
            user_name: profile?.display_name || 'User',
            gender: (profile as any)?.gender || 'unknown',
            color_theme: (profile as any)?.color_theme || 'female',
            qr_coins: profile?.qr_coins || 0,
            current_page: window.location.pathname,
            frequent_actions: topActions || 'none',
            favorite_pages: topPages || 'none',
          },
        },
      });

      if (error) { console.error('Stella AI invoke error:', error); throw error; }
      if (!data) { console.error('Stella AI: empty response'); throw new Error('Empty AI response'); }

      const { intent, params, response: aiResponse } = data;
      const displayResponse = aiResponse || 'Sono qui per aiutarti!';

      addMessage({ role: 'stella', content: displayResponse, type: intent && intent !== 'chat' ? 'action_result' : 'text' });
      stellaSpeak(displayResponse.length > 200 ? displayResponse.substring(0, 200) + '...' : displayResponse);

      if (intent && intent !== 'chat') {
        // Siri-like: show inline status, don't open panel
        setInlineStatus(displayResponse.substring(0, 100));
        await executeAIIntent(intent, params || {}, displayResponse);
        logStellaCommand(text, intent);
      } else {
        // Chat response: show in panel
        setIsOpen(true);
        setInlineStatus(null);
      }
    } catch (err) {
      console.error('Stella AI error:', err);
      const fallback = 'Stella AI è temporaneamente offline. Dì "aiuto" per i comandi disponibili!';
      addMessage({ role: 'stella', content: fallback, type: 'text' });
      stellaSpeak(fallback);
      toast.info(`🌟 ${fallback}`);
    } finally {
      setIsAIThinking(false);
      scheduleWakeWordResume(1800);
    }
  }, [addMessage, stellaSpeak, profile, executeAIIntent, analyzePatterns, getTopPages, logStellaCommand, scheduleWakeWordResume]);



  // ── Handle command (works in background or with panel open) ────────────
  const handleCommand = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    addMessage({ role: 'user', content: text });

    const cmd = parseCommand(text);
    if (!cmd) {
      await askAI(text);
      return;
    }

    const limit = checkLimit(cmd.type);
    if (!limit.allowed) {
      const msg = `Hai raggiunto il limite di ${cmd.type} per quest'ora.`;
      addMessage({ role: 'stella', content: msg });
      stellaSpeak(msg);
      toast.warning(`🌟 Stella: ${msg}`);
      scheduleWakeWordResume();
      return;
    }

    if (cmd.requiresConfirmation && !cmd.silent) {
      setPendingCommand(cmd);
      addMessage({ role: 'stella', content: cmd.response, type: 'confirmation', pending: cmd });
      stellaSpeak(cmd.response);
      // Open panel for confirmations
      setIsOpen(true);
    } else {
      try {
        // Siri-like: execute silently with inline status, no panel
        await Promise.resolve(cmd.execute());
        recordAction(cmd.type);
        addMessage({ role: 'stella', content: cmd.response, type: 'action_result' });
        setInlineStatus(cmd.response);
        stellaSpeak(cmd.response);
        logStellaCommand(text, cmd.type);
      } catch (error) {
        console.error('Stella direct command error:', error);
        const failureMessage = 'Non sono riuscita a completare l’azione richiesta.';
        addMessage({ role: 'stella', content: failureMessage, type: 'text' });
        setInlineStatus(failureMessage);
        stellaSpeak(failureMessage);
        toast.error(`🌟 Stella: ${failureMessage}`);
      } finally {
        scheduleWakeWordResume();
      }
    }
  }, [addMessage, parseCommand, stellaSpeak, askAI, logStellaCommand, scheduleWakeWordResume]);

  handleCommandRef.current = handleCommand;

  // ── Confirm / Cancel pending action ─────────────────────────────────────
  const confirmAction = useCallback(async () => {
    if (!pendingCommand) return;
    try {
      await Promise.resolve(pendingCommand.execute());
      recordAction(pendingCommand.type);
      addMessage({ role: 'stella', content: 'Fatto! ✅', type: 'action_result' });
      stellaSpeak('Fatto!');
      toast.success('🌟 Stella: Fatto! ✅');
      logStellaCommand(pendingCommand.text, pendingCommand.type, {
        requires_confirmation: true,
        confirmed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Stella confirmation error:', error);
      const failureMessage = 'Non sono riuscita a completare l’azione confermata.';
      addMessage({ role: 'stella', content: failureMessage, type: 'text' });
      stellaSpeak(failureMessage);
      toast.error(`🌟 Stella: ${failureMessage}`);
    } finally {
      setPendingCommand(null);
      scheduleWakeWordResume();
    }
  }, [pendingCommand, addMessage, stellaSpeak, logStellaCommand, scheduleWakeWordResume]);

  const cancelAction = useCallback(() => {
    setPendingCommand(null);
    addMessage({ role: 'stella', content: 'Azione annullata.' });
    stellaSpeak('Annullato.');
    scheduleWakeWordResume(800);
  }, [addMessage, stellaSpeak, scheduleWakeWordResume]);

  const sendTextCommand = useCallback((text: string) => {
    if (!text.trim()) return;
    void handleCommand(text.trim());
  }, [handleCommand]);

  const toggleWakeWord = useCallback(() => {
    clearWakeWordResumeTimeout();

    if (wakeWordActive) {
      stopWakeWordListening();
      setWakeWordActive(false);
      setInlineStatus('Attivazione vocale disattivata.');
      return;
    }

    setWakeWordActive(true);
    setInlineStatus('Attivazione vocale attivata.');
  }, [wakeWordActive, clearWakeWordResumeTimeout, stopWakeWordListening]);

  const toggleTTS = useCallback(() => setTtsEnabled(prev => !prev), []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening(); else startListening();
  }, [isListening, startListening, stopListening]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages, isOpen, setIsOpen, wakeWordActive, ttsEnabled,
    isListening, isWakeWordListening, interimTranscript, speaking,
    pendingCommand, isSupported, isAIThinking, proactiveSuggestions,
    inlineStatus, clearInlineStatus,
    toggleWakeWord, toggleTTS, toggleListening,
    sendTextCommand, confirmAction, cancelAction,
    clearMessages,
  };
}