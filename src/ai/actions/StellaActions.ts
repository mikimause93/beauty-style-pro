// src/ai/actions/StellaActions.ts
import { createBookingAction, getBookingsAction } from './StellaBooking';
import { addToCartAction } from './StellaShop';
import { sendMessageAction } from './StellaChat';
import { getRevenueAction, getStatsAction, findProfessionalsAction } from './StellaBusiness';
import type { StellaActionName, StellaActionResult } from '../types/stella.types';

export async function runAction(
  action: StellaActionName | string,
  payload: Record<string, unknown>,
  userId: string,
  navigate: (path: string) => void
): Promise<StellaActionResult> {
  switch (action) {
    case 'open_calendar':
      navigate('/my-bookings');
      return { success: true, message: '📅 Apro la tua agenda!' };

    case 'create_booking':
      navigate('/booking');
      return createBookingAction(payload as Parameters<typeof createBookingAction>[0], userId);

    case 'open_shop':
      navigate('/shop');
      return { success: true, message: '🛍️ Apro lo shop!' };

    case 'show_stats':
      navigate('/analytics');
      return getStatsAction(payload as { period?: string }, userId);

    case 'find_professionals':
      navigate('/stylists');
      return findProfessionalsAction(payload as Parameters<typeof findProfessionalsAction>[0]);

    case 'add_to_cart':
      return addToCartAction(payload as Parameters<typeof addToCartAction>[0], userId);

    case 'get_revenue':
      navigate('/analytics');
      return getRevenueAction(payload as { period?: string }, userId);

    case 'get_bookings':
      navigate('/my-bookings');
      return getBookingsAction(payload as Parameters<typeof getBookingsAction>[0], userId);

    case 'send_message':
      navigate('/chat');
      return sendMessageAction(payload as Parameters<typeof sendMessageAction>[0], userId);

    case 'navigate_to': {
      const path = (payload.path as string) || '/';
      navigate(path);
      return { success: true, message: `🚀 Navigo verso ${path}` };
    }

    case 'search': {
      const query = encodeURIComponent((payload.query as string) || '');
      navigate(`/search?q=${query}`);
      return { success: true, message: `🔍 Cerco "${payload.query}"` };
    }

    case 'activate_work_mode':
      navigate('/professional-dashboard');
      return { success: true, message: '💼 Modalità lavoro attivata!' };

    default:
      return { success: false, message: `Azione non riconosciuta: ${action}` };
  }
}
