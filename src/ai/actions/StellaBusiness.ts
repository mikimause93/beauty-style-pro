// src/ai/actions/StellaBusiness.ts
import { supabase } from '@/integrations/supabase/client';
import type { StellaActionResult } from '../types/stella.types';

type Period = 'today' | 'week' | 'month';

function periodToRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from: string;
  if (period === 'today') {
    from = to;
  } else if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    from = d.toISOString().slice(0, 10);
  } else {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    from = d.toISOString().slice(0, 10);
  }
  return { from, to };
}

export async function getRevenueAction(
  payload: { period?: string },
  userId: string
): Promise<StellaActionResult> {
  const period = (payload.period as Period) || 'month';
  const { from, to } = periodToRange(period);

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('total_price, booking_date')
      .eq('professional_id', userId)
      .eq('status', 'completed')
      .gte('booking_date', from)
      .lte('booking_date', to);

    if (error) throw error;

    const total = (data ?? []).reduce((sum, b) => sum + (b.total_price ?? 0), 0);
    const count = (data ?? []).length;
    const label = period === 'today' ? 'oggi' : period === 'week' ? 'questa settimana' : 'questo mese';

    return {
      success: true,
      message: `💰 Incasso ${label}: €${total.toFixed(2)} (${count} prenotazioni completate)`,
      data: { total, count },
    };
  } catch {
    return { success: false, message: 'Errore nel recupero degli incassi.' };
  }
}

export async function getStatsAction(
  payload: { period?: string },
  userId: string
): Promise<StellaActionResult> {
  const period = (payload.period as Period) || 'month';
  const { from, to } = periodToRange(period);

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('status, total_price')
      .or(`professional_id.eq.${userId},client_id.eq.${userId}`)
      .gte('booking_date', from)
      .lte('booking_date', to);

    if (error) throw error;

    const bookings = data ?? [];
    const completed = bookings.filter(b => b.status === 'completed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const revenue = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price ?? 0), 0);

    const label = period === 'today' ? 'oggi' : period === 'week' ? 'questa settimana' : 'questo mese';

    return {
      success: true,
      message: `📊 Statistiche ${label}:\n• Completate: ${completed}\n• In attesa: ${pending}\n• Incasso: €${revenue.toFixed(2)}`,
      data: { completed, pending, revenue },
    };
  } catch {
    return { success: false, message: 'Errore nel recupero delle statistiche.' };
  }
}

export async function findProfessionalsAction(
  payload: { category?: string; city?: string; service?: string }
): Promise<StellaActionResult> {
  try {
    let query = supabase
      .from('professionals')
      .select('id, display_name, category, city, rating')
      .limit(5);

    if (payload.category) query = query.ilike('category', `%${payload.category}%`);
    if (payload.city) query = query.ilike('city', `%${payload.city}%`);

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, message: 'Nessun professionista trovato con questi criteri.', data: [] };
    }

    const list = data
      .map(p => `• ${p.display_name} — ${p.category} (${p.city ?? 'N/D'}) ⭐${p.rating ?? 'N/D'}`)
      .join('\n');

    return { success: true, message: `👩‍💼 Professionisti trovati:\n${list}`, data };
  } catch {
    return { success: false, message: 'Errore nella ricerca professionisti.' };
  }
}
