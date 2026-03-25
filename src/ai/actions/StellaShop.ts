// src/ai/actions/StellaShop.ts
import { supabase } from '@/integrations/supabase/client';
import type { StellaActionResult } from '../types/stella.types';

export async function addToCartAction(
  payload: { productId?: string; quantity?: number },
  userId: string
): Promise<StellaActionResult> {
  if (!payload.productId || !payload.quantity) {
    return { success: false, message: 'Specifica prodotto e quantità.' };
  }

  try {
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', payload.productId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + payload.quantity })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('cart_items').insert({
        user_id: userId,
        product_id: payload.productId,
        quantity: payload.quantity,
      });
      if (error) throw error;
    }

    return { success: true, message: `🛒 Prodotto aggiunto al carrello (qty: ${payload.quantity})!` };
  } catch {
    return { success: false, message: 'Errore nell\'aggiunta al carrello.' };
  }
}
