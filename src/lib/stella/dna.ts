/** Stella DNA — learning engine: remembers user behavior and personalises responses */
import { supabase } from '@/integrations/supabase/client';
import type { DNAProfile, PersonaType, StellaEvent } from './types';

const cache = new Map<string, DNAProfile>();

function defaultDNA(userId: string): DNAProfile {
  return {
    userId,
    favoriteRoutes: [],
    communicationStyle: 'casual',
    activeHours: [],
    interests: [],
    persona: 'explorer',
    recentCommands: [],
    totalInteractions: 0,
    customShortcuts: {},
  };
}

export function inferPersona(dna: Pick<DNAProfile, 'favoriteRoutes' | 'recentCommands' | 'totalInteractions'>): PersonaType {
  const routes = dna.favoriteRoutes.join(' ');
  const cmds = dna.recentCommands.join(' ');
  const combined = `${routes} ${cmds}`.toLowerCase();

  if (combined.includes('/create-post') || combined.includes('/go-live') || combined.includes('live')) return 'creator';
  if (combined.includes('/shop') || combined.includes('compra') || combined.includes('acquista')) return 'shopper';
  if (combined.includes('/booking') || combined.includes('/stylists') || combined.includes('prenota')) return 'professional';
  if (dna.totalInteractions > 50 && (combined.includes('segui') || combined.includes('/leaderboard'))) return 'influencer';
  return 'explorer';
}

export function getCachedDNA(userId: string): DNAProfile | null {
  return cache.get(userId) ?? null;
}

export async function loadDNA(userId: string): Promise<DNAProfile> {
  if (cache.has(userId)) return cache.get(userId)!;

  try {
    const { data } = await supabase.from('stella_dna').select('*')
      .eq('user_id', userId).maybeSingle();
    if (data) {
      const dna: DNAProfile = {
        userId,
        favoriteRoutes: data.favorite_routes ?? [],
        communicationStyle: data.communication_style ?? 'casual',
        activeHours: data.active_hours ?? [],
        interests: data.interests ?? [],
        persona: (data.persona as PersonaType) ?? 'explorer',
        recentCommands: Array.isArray(data.recent_commands) ? data.recent_commands : [],
        totalInteractions: data.total_interactions ?? 0,
        customShortcuts: typeof data.custom_shortcuts === 'object' ? (data.custom_shortcuts as Record<string, string>) : {},
      };
      cache.set(userId, dna);
      return dna;
    }
  } catch { /* table not yet created — use defaults */ }

  const dna = defaultDNA(userId);
  cache.set(userId, dna);
  return dna;
}

export async function learnFromEvent(userId: string, event: StellaEvent): Promise<void> {
  const dna = cache.get(userId) ?? defaultDNA(userId);

  // Update in-memory
  dna.totalInteractions += 1;

  if (event.type === 'command' && typeof event.data.text === 'string') {
    dna.recentCommands = [event.data.text, ...dna.recentCommands].slice(0, 30);
  }
  if (event.type === 'navigation' && typeof event.pagePath === 'string') {
    const route = event.pagePath;
    const existing = dna.favoriteRoutes.filter(r => r !== route);
    dna.favoriteRoutes = [route, ...existing].slice(0, 20);
  }
  if (event.type === 'search' && typeof event.data.query === 'string') {
    const topic = event.data.query as string;
    if (!dna.interests.includes(topic)) {
      dna.interests = [topic, ...dna.interests].slice(0, 20);
    }
  }

  // Re-infer persona
  dna.persona = inferPersona(dna);

  // Update active hours
  const hour = new Date().getHours();
  if (!dna.activeHours.includes(hour)) {
    dna.activeHours = [...dna.activeHours, hour].slice(-24);
  }

  cache.set(userId, dna);

  // Persist to DB (gracefully)
  try {
    await supabase.from('stella_dna').upsert({
      user_id: userId,
      favorite_routes: dna.favoriteRoutes,
      communication_style: dna.communicationStyle,
      active_hours: dna.activeHours,
      interests: dna.interests,
      persona: dna.persona,
      recent_commands: dna.recentCommands,
      total_interactions: dna.totalInteractions,
      custom_shortcuts: dna.customShortcuts,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch { /* ignore */ }

  // Log event (gracefully)
  try {
    await supabase.from('stella_events').insert({
      user_id: userId,
      event_type: event.type,
      event_data: event.data,
      page_path: event.pagePath ?? window.location.pathname,
    });
  } catch { /* ignore */ }
}

export function getPersonalizedGreeting(dna: DNAProfile | null, displayName?: string): string {
  const hour = new Date().getHours();
  const name = displayName ? ` ${displayName}` : '';

  let timeGreet: string;
  if (hour < 12) timeGreet = `Buongiorno${name}! ☀️`;
  else if (hour < 18) timeGreet = `Buon pomeriggio${name}! 🌤️`;
  else timeGreet = `Buonasera${name}! 🌙`;

  if (!dna || dna.totalInteractions === 0) {
    return `${timeGreet} Sono Stella AI. Dimmi cosa posso fare per te!`;
  }

  const persona = dna.persona;
  const suffixes: Record<PersonaType, string> = {
    creator: 'Pronto a creare qualcosa di straordinario?',
    shopper: 'Vuoi scoprire le ultime offerte?',
    professional: 'Hai prenotazioni o appuntamenti in arrivo?',
    influencer: "Controlliamo le tue notifiche e i tuoi follower?",
    explorer: 'Cosa scopriamo oggi?',
  };

  return `${timeGreet} ${suffixes[persona]}`;
}

export function getSmartSuggestions(dna: DNAProfile | null): string[] {
  if (!dna) return ['Apri chat', 'Prenota un servizio', 'Esplora'];
  const persona = dna.persona;
  const suggestions: Record<PersonaType, string[]> = {
    creator: ['Vai in live', 'Crea un nuovo post', 'Controlla le tue stats'],
    shopper: ['Apri lo shop', 'Guarda le offerte', 'Controlla i QR Coins'],
    professional: ['Le mie prenotazioni', 'Cerca professionisti vicini', 'Apri wallet'],
    influencer: ['Apri notifiche', 'Classifica follower', 'Crea un post'],
    explorer: ['Cerca match vicini', 'Esplora', 'Apri la mappa'],
  };
  return suggestions[persona];
}
