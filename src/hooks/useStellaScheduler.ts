import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

export interface ScheduledAction {
  id: string;
  description: string;
  scheduledAt: number; // timestamp ms
  command: string;
  status: 'pending' | 'executed' | 'cancelled';
}

type AsyncExecutor = (command: string) => Promise<{ matched: boolean; response: string; action?: string }>;

/**
 * Parse Italian time/delay expressions from a command string.
 * Returns { ms: milliseconds until action, cleanText: command with time removed } or ms=null if none found.
 *
 * Supported patterns:
 *   "tra X minuti"  "tra X ore"
 *   "alle HH:MM"    "alle HH"
 *   "stasera alle HH"
 *   "domani alle HH:MM"
 *   "stamattina alle HH"
 */
export function parseItalianTime(text: string): { ms: number | null; cleanText: string } {
  const now = new Date();

  // "tra X secondi"
  const secMatch = text.match(/\btra\s+(\d+)\s+second[io]\b/i);
  if (secMatch) {
    const ms = parseInt(secMatch[1]) * 1000;
    return { ms, cleanText: text.replace(secMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  // "tra X minuti"
  const minMatch = text.match(/\btra\s+(\d+)\s+minut[io]\b/i);
  if (minMatch) {
    const ms = parseInt(minMatch[1]) * 60_000;
    return { ms, cleanText: text.replace(minMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  // "tra X ore"
  const hrMatch = text.match(/\btra\s+(\d+)\s+or[ae]\b/i);
  if (hrMatch) {
    const ms = parseInt(hrMatch[1]) * 3_600_000;
    return { ms, cleanText: text.replace(hrMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  // "domani alle HH:MM" or "domani alle HH"
  const domaniMatch = text.match(/\bdomani\s+alle?\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (domaniMatch) {
    const h = parseInt(domaniMatch[1]);
    const m = domaniMatch[2] ? parseInt(domaniMatch[2]) : 0;
    const target = new Date(now);
    target.setDate(target.getDate() + 1);
    target.setHours(h, m, 0, 0);
    const ms = target.getTime() - now.getTime();
    return { ms: Math.max(ms, 0), cleanText: text.replace(domaniMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  // "stasera alle HH" – treat single digit as evening if < 12
  const staseraMatch = text.match(/\bstasera\s+alle?\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (staseraMatch) {
    let h = parseInt(staseraMatch[1]);
    const m = staseraMatch[2] ? parseInt(staseraMatch[2]) : 0;
    if (h < 12) h += 12;
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const ms = target.getTime() - now.getTime();
    return { ms, cleanText: text.replace(staseraMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  // "stamattina alle HH"
  const stamMatch = text.match(/\bstamattina\s+alle?\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (stamMatch) {
    const h = parseInt(stamMatch[1]);
    const m = stamMatch[2] ? parseInt(stamMatch[2]) : 0;
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const ms = target.getTime() - now.getTime();
    return { ms, cleanText: text.replace(stamMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  // "alle HH:MM" or "alle HH" (generic)
  const alleMatch = text.match(/\balle?\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (alleMatch) {
    const h = parseInt(alleMatch[1]);
    const m = alleMatch[2] ? parseInt(alleMatch[2]) : 0;
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1); // next occurrence
    const ms = target.getTime() - now.getTime();
    return { ms, cleanText: text.replace(alleMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  return { ms: null, cleanText: text };
}

/** Human-readable delay label in Italian */
export function formatDelay(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} secondi`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} minuti`;
  if (ms < 86_400_000) {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.round((ms % 3_600_000) / 60_000);
    return m > 0 ? `${h}h ${m}m` : `${h} ore`;
  }
  return `${Math.round(ms / 86_400_000)} giorni`;
}

export function useStellaScheduler(executor: AsyncExecutor) {
  const [scheduledActions, setScheduledActions] = useState<ScheduledAction[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  const scheduleAction = useCallback((command: string, ms: number, description: string): string => {
    const id = `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const scheduledAt = Date.now() + ms;

    setScheduledActions(prev => [...prev, { id, description, scheduledAt, command, status: 'pending' }]);

    const timer = setTimeout(async () => {
      try {
        const result = await executor(command);
        toast.success(`⏰ Stella: ${result.response}`, { duration: 6000 });
      } catch {
        toast.error('Errore nell\'esecuzione dell\'azione programmata');
      }
      setScheduledActions(prev => prev.map(a => a.id === id ? { ...a, status: 'executed' } : a));
      delete timersRef.current[id];
    }, ms);

    timersRef.current[id] = timer;
    toast.success(`⏰ Azione programmata tra ${formatDelay(ms)}!`, { duration: 4000 });
    return id;
  }, [executor]);

  const cancelAction = useCallback((id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setScheduledActions(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    toast.success('Azione annullata ✓');
  }, []);

  const clearDone = useCallback(() => {
    setScheduledActions(prev => prev.filter(a => a.status === 'pending'));
  }, []);

  const pendingActions = scheduledActions.filter(a => a.status === 'pending');

  return { scheduledActions, pendingActions, scheduleAction, cancelAction, clearDone };
}
