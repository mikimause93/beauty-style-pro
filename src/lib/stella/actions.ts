/** Pure async Stella action functions — no React hooks */
import { supabase } from '@/integrations/supabase/client';
import { checkRateLimit, logRateAction } from './rateLimiter';

export async function actionLikePost(userId: string, userName?: string): Promise<string> {
  const limit = checkRateLimit(userId, 'likes');
  if (!limit.allowed) return `⚠️ ${limit.reason}`;

  let postId: string | null = null;

  if (userName) {
    const { data: profile } = await supabase
      .from('profiles').select('user_id')
      .ilike('display_name', `%${userName}%`).limit(1).maybeSingle();
    if (profile) {
      const { data: posts } = await supabase.from('posts').select('id')
        .eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(1);
      if (posts?.length) postId = posts[0].id;
    }
  } else {
    const { data: posts } = await supabase.from('posts').select('id')
      .neq('user_id', userId).order('created_at', { ascending: false }).limit(1);
    if (posts?.length) postId = posts[0].id;
  }

  if (!postId) return userName ? `Nessun post trovato per ${userName}` : 'Nessun post disponibile';

  const { data: existing } = await supabase.from('post_likes').select('id')
    .eq('user_id', userId).eq('post_id', postId).maybeSingle();
  if (existing) return 'Hai già messo like a questo post ❤️';

  await supabase.from('post_likes').insert({ user_id: userId, post_id: postId });
  await logRateAction(userId, 'likes', postId);
  return `Like messo! ❤️${userName ? ` al post di ${userName}` : ''}`;
}

export async function actionCommentPost(userId: string, userName: string, comment: string): Promise<string> {
  const limit = checkRateLimit(userId, 'comments');
  if (!limit.allowed) return `⚠️ ${limit.reason}`;

  const { data: profile } = await supabase.from('profiles')
    .select('user_id, display_name').ilike('display_name', `%${userName}%`).limit(1).maybeSingle();
  if (!profile) return `Utente "${userName}" non trovato`;

  const { data: posts } = await supabase.from('posts').select('id')
    .eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(1);
  if (!posts?.length) return `${profile.display_name} non ha post`;

  await supabase.from('comments').insert({ user_id: userId, post_id: posts[0].id, message: comment });
  await logRateAction(userId, 'comments', posts[0].id);
  return `Commento pubblicato sul post di ${profile.display_name} 💬`;
}

export async function actionFollowUser(userId: string, userName: string): Promise<{ response: string; profileId?: string }> {
  const limit = checkRateLimit(userId, 'follows');
  if (!limit.allowed) return { response: `⚠️ ${limit.reason}` };

  const { data: profile } = await supabase.from('profiles')
    .select('user_id, display_name').ilike('display_name', `%${userName}%`)
    .neq('user_id', userId).limit(1).maybeSingle();
  if (!profile) return { response: `Utente "${userName}" non trovato` };

  const { data: existing } = await supabase.from('follows').select('id')
    .eq('follower_id', userId).eq('following_id', profile.user_id).maybeSingle();
  if (existing) return { response: `Segui già ${profile.display_name} 💫`, profileId: profile.user_id };

  await supabase.from('follows').insert({ follower_id: userId, following_id: profile.user_id });
  await logRateAction(userId, 'follows', profile.user_id);
  return { response: `Ora segui ${profile.display_name}! 💫`, profileId: profile.user_id };
}

export async function actionUnfollowUser(userId: string, userName: string): Promise<string> {
  const { data: profile } = await supabase.from('profiles')
    .select('user_id, display_name').ilike('display_name', `%${userName}%`)
    .neq('user_id', userId).limit(1).maybeSingle();
  if (!profile) return `Utente "${userName}" non trovato`;

  await supabase.from('follows').delete()
    .eq('follower_id', userId).eq('following_id', profile.user_id);
  return `Non segui più ${profile.display_name}`;
}

export async function actionGetProfileInfo(userName: string): Promise<{ text: string; userId?: string }> {
  const { data } = await supabase.from('profiles')
    .select('user_id, display_name, bio, category, city, follower_count, following_count, account_type')
    .ilike('display_name', `%${userName}%`).limit(1).maybeSingle();
  if (!data) return { text: `Profilo "${userName}" non trovato` };

  let info = `${data.display_name}`;
  if (data.account_type) info += ` — ${data.account_type}`;
  if (data.city) info += `, ${data.city}`;
  if (data.category) info += `, ${data.category}`;
  if (data.bio) info += `. "${data.bio.slice(0, 80)}"`;
  info += `. ${data.follower_count ?? 0} follower, ${data.following_count ?? 0} seguiti.`;
  return { text: info, userId: data.user_id };
}

export async function actionConfirmBooking(userId: string): Promise<string> {
  const { data: bookings } = await supabase.from('bookings')
    .select('id, booking_date, services(name)').eq('client_id', userId)
    .eq('status', 'pending').order('booking_date', { ascending: true }).limit(1);
  if (!bookings?.length) return 'Nessuna prenotazione in attesa di conferma';

  const b = bookings[0] as { id: string; booking_date: string; services?: { name?: string } };
  await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', b.id);
  const dateStr = new Date(b.booking_date).toLocaleString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
  return `Prenotazione confermata! ${b.services?.name ?? 'Servizio'} del ${dateStr} ✅`;
}

export async function actionSendMessage(
  userId: string, recipientName: string, content: string
): Promise<{ response: string; conversationId?: string }> {
  const limit = checkRateLimit(userId, 'messages');
  if (!limit.allowed) return { response: `⚠️ ${limit.reason}` };

  const { data: profile } = await supabase.from('profiles')
    .select('user_id, display_name').ilike('display_name', `%${recipientName}%`)
    .neq('user_id', userId).limit(1).maybeSingle();
  if (!profile) return { response: `Utente "${recipientName}" non trovato` };

  const { data: existing } = await supabase.from('conversations').select('id')
    .or(`and(participant_1.eq.${userId},participant_2.eq.${profile.user_id}),and(participant_1.eq.${profile.user_id},participant_2.eq.${userId})`)
    .limit(1).maybeSingle();

  let convId: string;
  if (existing) {
    convId = existing.id;
  } else {
    const { data: newConv } = await supabase.from('conversations')
      .insert({ participant_1: userId, participant_2: profile.user_id }).select('id').single();
    if (!newConv) return { response: 'Errore nella creazione della conversazione' };
    convId = newConv.id;
  }

  await supabase.from('messages').insert({
    conversation_id: convId, sender_id: userId, content, message_type: 'text',
  });
  await supabase.from('conversations').update({
    last_message: content, last_message_at: new Date().toISOString(),
  }).eq('id', convId);
  await logRateAction(userId, 'messages', profile.user_id);
  return { response: `Messaggio inviato a ${profile.display_name} 📨`, conversationId: convId };
}

export function actionReadScreen(): string {
  try {
    const main = document.querySelector('main') ?? document.body;
    const text = (main as HTMLElement).innerText?.slice(0, 600) ?? '';
    return text.trim() || 'Nessun contenuto leggibile nella pagina';
  } catch {
    return 'Impossibile leggere la pagina';
  }
}
