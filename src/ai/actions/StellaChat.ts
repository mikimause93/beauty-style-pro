// src/ai/actions/StellaChat.ts
import { supabase } from '@/integrations/supabase/client';
import type { StellaActionResult } from '../types/stella.types';

export async function sendMessageAction(
  payload: { clientId?: string; message?: string },
  userId: string
): Promise<StellaActionResult> {
  if (!payload.clientId || !payload.message) {
    return { success: false, message: 'Specifica destinatario e messaggio.' };
  }

  try {
    // Find or create conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .or(`user1_id.eq.${payload.clientId},user2_id.eq.${payload.clientId}`)
      .maybeSingle();

    let conversationId = conv?.id;

    if (!conversationId) {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({ user1_id: userId, user2_id: payload.clientId })
        .select('id')
        .single();
      if (convErr) throw convErr;
      conversationId = newConv.id;
    }

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: payload.message,
    });

    if (error) throw error;
    return { success: true, message: `✉️ Messaggio inviato!` };
  } catch {
    return { success: false, message: 'Errore nell\'invio del messaggio.' };
  }
}
