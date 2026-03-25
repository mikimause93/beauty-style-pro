// src/ai/actions/StellaBooking.ts
import { supabase } from '@/integrations/supabase/client';
import type { StellaActionResult } from '../types/stella.types';

export async function createBookingAction(
  payload: { professionalId?: string; serviceId?: string; date?: string; time?: string },
  userId: string
): Promise<StellaActionResult> {
  if (!payload.professionalId || !payload.serviceId || !payload.date || !payload.time) {
    return { success: false, message: 'Dati prenotazione incompleti. Specifica professionista, servizio, data e orario.' };
  }

  try {
    const { error } = await supabase.from('bookings').insert({
      client_id: userId,
      professional_id: payload.professionalId,
      service_id: payload.serviceId,
      booking_date: payload.date,
      booking_time: payload.time,
      status: 'pending',
    });

    if (error) throw error;
    return { success: true, message: `✅ Prenotazione creata per il ${payload.date} alle ${payload.time}!` };
  } catch {
    return { success: false, message: 'Errore nella creazione della prenotazione. Riprova.' };
  }
}

export async function getBookingsAction(
  payload: { date?: string; status?: string },
  userId: string
): Promise<StellaActionResult> {
  try {
    let query = supabase
      .from('bookings')
      .select('id, booking_date, booking_time, status, services(name)')
      .eq('client_id', userId)
      .order('booking_date', { ascending: true });

    if (payload.status) query = query.eq('status', payload.status);
    if (payload.date) query = query.eq('booking_date', payload.date);

    const { data, error } = await query.limit(5);
    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, message: 'Nessuna prenotazione trovata.', data: [] };
    }

    const list = data
      .map(b => `• ${b.booking_date} ${b.booking_time} — ${b.status}`)
      .join('\n');

    return { success: true, message: `📅 Le tue prenotazioni:\n${list}`, data };
  } catch {
    return { success: false, message: 'Errore nel recupero delle prenotazioni.' };
  }
}
