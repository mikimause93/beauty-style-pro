import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import safeStorage from '@/lib/safeStorage';

interface UserPattern {
  action: string;
  count: number;
  lastUsed: string;
  avgHour: number; // average hour of day this action is used
}

interface ProactiveSuggestion {
  text: string;
  command: string;
  reason: string;
  priority: number;
}

/**
 * Stella Learning Engine
 * Analyzes user behavior patterns from stella_commands history
 * and generates proactive suggestions based on habits.
 */
export function useStellaLearning() {
  const { user, profile } = useAuth();
  const patternsRef = useRef<UserPattern[]>([]);
  const lastAnalysis = useRef<number>(0);

  // Analyze command history to detect patterns
  const analyzePatterns = useCallback(async (): Promise<UserPattern[]> => {
    if (!user) return [];

    // Only re-analyze every 5 minutes
    if (Date.now() - lastAnalysis.current < 300000 && patternsRef.current.length > 0) {
      return patternsRef.current;
    }

    try {
      const { data: commands } = await supabase
        .from('stella_commands')
        .select('command_type, command_text, executed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('executed_at', { ascending: false })
        .limit(200);

      if (!commands?.length) return [];

      // Group by command_type and calculate frequency
      const typeMap = new Map<string, { count: number; hours: number[]; lastUsed: string }>();

      for (const cmd of commands) {
        const type = cmd.command_type || 'unknown';
        const existing = typeMap.get(type) || { count: 0, hours: [], lastUsed: cmd.executed_at || '' };
        existing.count++;
        if (cmd.executed_at) {
          const hour = new Date(cmd.executed_at).getHours();
          existing.hours.push(hour);
          if (!existing.lastUsed || cmd.executed_at > existing.lastUsed) {
            existing.lastUsed = cmd.executed_at;
          }
        }
        typeMap.set(type, existing);
      }

      const patterns: UserPattern[] = [];
      for (const [action, data] of typeMap) {
        const avgHour = data.hours.length > 0
          ? Math.round(data.hours.reduce((a, b) => a + b, 0) / data.hours.length)
          : 12;
        patterns.push({
          action, count: data.count,
          lastUsed: data.lastUsed, avgHour,
        });
      }

      patterns.sort((a, b) => b.count - a.count);
      patternsRef.current = patterns;
      lastAnalysis.current = Date.now();

      // Cache patterns
      safeStorage.setJSON('stella_patterns', patterns);

      return patterns;
    } catch {
      return patternsRef.current;
    }
  }, [user]);

  // Generate proactive suggestions based on patterns + context
  const getProactiveSuggestions = useCallback(async (): Promise<ProactiveSuggestion[]> => {
    const patterns = await analyzePatterns();
    const suggestions: ProactiveSuggestion[] = [];
    const currentHour = new Date().getHours();
    const currentPage = window.location.pathname;
    const dayOfWeek = new Date().getDay();
    const coins = profile?.qr_coins ?? 0;

    // 1. Time-based suggestions from habits
    for (const pattern of patterns.slice(0, 5)) {
      const hourDiff = Math.abs(currentHour - pattern.avgHour);
      if (hourDiff <= 2 && pattern.count >= 3) {
        const suggestionMap: Record<string, { text: string; command: string }> = {
          navigate: { text: 'Di solito a quest\'ora navighi l\'app — vuoi che ti porti da qualche parte?', command: 'cosa posso fare?' },
          like: { text: 'È ora dei tuoi like quotidiani! Vuoi che metta like ai post più recenti?', command: 'metti like' },
          search: { text: 'Vuoi cercare qualcosa di nuovo oggi?', command: 'apri esplora' },
          book: { text: 'Hai bisogno di prenotare un appuntamento?', command: 'prenota' },
          comment: { text: 'Vuoi interagire con qualche post?', command: 'apri home' },
          message: { text: 'Vuoi scrivere a qualcuno?', command: 'apri chat' },
        };
        const s = suggestionMap[pattern.action];
        if (s) {
          suggestions.push({ ...s, reason: `Lo fai spesso intorno alle ${pattern.avgHour}:00`, priority: pattern.count });
        }
      }
    }

    // 2. Context-based suggestions
    if (currentPage === '/' || currentPage === '/index') {
      if (currentHour >= 8 && currentHour <= 10) {
        suggestions.push({ text: 'Buongiorno! Vuoi controllare le notifiche?', command: 'apri notifiche', reason: 'Routine mattutina', priority: 5 });
      }
      if (currentHour >= 20) {
        suggestions.push({ text: 'Vuoi dare un\'occhiata ai video shorts prima di dormire?', command: 'apri shorts', reason: 'Relax serale', priority: 3 });
      }
    }

    // 3. Engagement suggestions
    if (coins > 50) {
      suggestions.push({ text: `Hai ${coins} QR Coins! Vuoi girare la ruota della fortuna?`, command: 'gira la ruota', reason: 'Coins disponibili', priority: 4 });
    }

    // 4. Day-specific suggestions
    if (dayOfWeek === 1) { // Monday
      suggestions.push({ text: 'Nuovo lunedì, nuova settimana! Vuoi controllare le missioni?', command: 'apri missioni', reason: 'Inizio settimana', priority: 2 });
    }
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday/Saturday
      suggestions.push({ text: 'Weekend in arrivo! Vuoi prenotare un trattamento?', command: 'prenota', reason: 'Weekend', priority: 4 });
    }

    // 5. User type specific
    if (profile?.user_type === 'professional' || profile?.user_type === 'business') {
      if (currentHour >= 9 && currentHour <= 11) {
        suggestions.push({ text: 'Vuoi controllare le tue statistiche o le prenotazioni?', command: 'apri analytics', reason: 'Business check mattutino', priority: 5 });
      }
    }

    // Sort by priority
    suggestions.sort((a, b) => b.priority - a.priority);

    return suggestions.slice(0, 3);
  }, [analyzePatterns, profile]);

  // Track page visits for learning
  const trackPageVisit = useCallback((page: string) => {
    if (!user) return;
    // Silently log navigation patterns
    const visits = safeStorage.getJSON<Record<string, number>>('stella_page_visits', {});
    visits[page] = (visits[page] || 0) + 1;
    safeStorage.setJSON('stella_page_visits', visits);
  }, [user]);

  // Get most visited pages
  const getTopPages = useCallback((): string[] => {
    const visits = safeStorage.getJSON<Record<string, number>>('stella_page_visits', {});
    return Object.entries(visits)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([page]) => page);
  }, []);

  // Load cached patterns on mount
  useEffect(() => {
    const cached = safeStorage.getJSON<UserPattern[]>('stella_patterns', []);
    if (cached.length) patternsRef.current = cached;
  }, []);

  return {
    analyzePatterns,
    getProactiveSuggestions,
    trackPageVisit,
    getTopPages,
  };
}
