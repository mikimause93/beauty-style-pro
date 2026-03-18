import { supabase } from '@/integrations/supabase/client';
import { RateLimitKey, RATE_LIMITS } from './types';

function storageKey(userId: string, key: RateLimitKey, period: 'hour' | 'day') {
  return `stella_rate_${userId}_${key}_${period}`;
}

function getPeriodStart(period: 'hour' | 'day'): number {
  const now = new Date();
  if (period === 'hour') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();
  }
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function getCount(userId: string, key: RateLimitKey, period: 'hour' | 'day'): number {
  try {
    const raw = localStorage.getItem(storageKey(userId, key, period));
    if (!raw) return 0;
    const parsed: { count: number; reset: number } = JSON.parse(raw);
    if (Date.now() > parsed.reset) return 0;
    return parsed.count;
  } catch {
    return 0;
  }
}

function incrementCount(userId: string, key: RateLimitKey, period: 'hour' | 'day'): void {
  try {
    const reset = getPeriodStart(period) + (period === 'hour' ? 3_600_000 : 86_400_000);
    const current = getCount(userId, key, period);
    localStorage.setItem(storageKey(userId, key, period), JSON.stringify({ count: current + 1, reset }));
  } catch { /* ignore */ }
}

export function checkRateLimit(userId: string, key: RateLimitKey): { allowed: boolean; reason?: string } {
  const hourCount = getCount(userId, key, 'hour');
  const dayCount = getCount(userId, key, 'day');
  const hourLimit = RATE_LIMITS.per_hour[key];
  const dayLimit = RATE_LIMITS.per_day[key];

  if (hourCount >= hourLimit) {
    return { allowed: false, reason: `Limite orario raggiunto: max ${hourLimit} ${key} per ora` };
  }
  if (dayCount >= dayLimit) {
    return { allowed: false, reason: `Limite giornaliero raggiunto: max ${dayLimit} ${key} al giorno` };
  }
  return { allowed: true };
}

export async function logRateAction(userId: string, key: RateLimitKey, targetId?: string): Promise<void> {
  incrementCount(userId, key, 'hour');
  incrementCount(userId, key, 'day');
  try {
    await supabase.from('stella_action_log').insert({
      user_id: userId,
      action_type: key,
      target_id: targetId || null,
    });
  } catch { /* table may not exist yet */ }
}
