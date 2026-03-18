import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useStellaVoiceActions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─── Real actions ─────────────────────────────────────────────────────────

  /** Like the most recent post by a named user, or the latest feed post */
  const likePostByUser = useCallback(async (userName?: string): Promise<string> => {
    if (!user) return "Devi accedere per mettere like!";

    let postId: string | null = null;

    if (userName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("display_name", `%${userName}%`)
        .limit(1)
        .maybeSingle();

      if (profile) {
        const { data: posts } = await supabase
          .from("posts")
          .select("id, user_id")
          .eq("user_id", profile.user_id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (posts && posts.length > 0) postId = posts[0].id;
      }
    } else {
      const { data: posts } = await supabase
        .from("posts")
        .select("id, user_id")
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (posts && posts.length > 0) postId = posts[0].id;
    }

    if (!postId) return userName ? `Nessun post trovato per ${userName}!` : "Nessun post disponibile!";

    const { data: existing } = await supabase
      .from("post_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle();

    if (existing) return "Hai già messo like a questo post! ❤️";

    await supabase.from("post_likes").insert({ user_id: user.id, post_id: postId });
    toast.success("❤️ Like messo!");
    return `Like messo con successo! ❤️${userName ? ` al post di ${userName}` : ""}`;
  }, [user]);

  /** Add a comment on the latest post by a named user */
  const commentOnPost = useCallback(async (userName: string, comment: string): Promise<string> => {
    if (!user) return "Devi accedere per commentare!";

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .ilike("display_name", `%${userName}%`)
      .limit(1)
      .maybeSingle();

    if (!profile) return `Utente "${userName}" non trovato!`;

    const { data: posts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!posts || posts.length === 0) return `${profile.display_name} non ha post su cui commentare!`;

    await supabase.from("comments").insert({
      user_id: user.id,
      post_id: posts[0].id,
      message: comment,
    });

    toast.success("💬 Commento pubblicato!");
    return `Commento pubblicato sul post di ${profile.display_name}: "${comment}" 💬`;
  }, [user]);

  /** Follow a user by (partial) name */
  const followUserByName = useCallback(async (userName: string): Promise<string> => {
    if (!user) return "Devi accedere per seguire qualcuno!";

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .ilike("display_name", `%${userName}%`)
      .neq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!profile) return `Utente "${userName}" non trovato!`;

    const { data: existing } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.user_id)
      .maybeSingle();

    if (existing) return `Segui già ${profile.display_name}! 💫`;

    await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.user_id });
    toast.success(`Ora segui ${profile.display_name}! 💫`);
    navigate(`/profile/${profile.user_id}`);
    return `Ora segui ${profile.display_name}! 💫`;
  }, [user, navigate]);

  /** Unfollow a user by name */
  const unfollowUserByName = useCallback(async (userName: string): Promise<string> => {
    if (!user) return "Devi accedere!";

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .ilike("display_name", `%${userName}%`)
      .neq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!profile) return `Utente "${userName}" non trovato!`;

    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", profile.user_id);

    toast.success(`Non segui più ${profile.display_name}`);
    return `Non segui più ${profile.display_name}`;
  }, [user]);

  /** Read out profile info for a named user */
  const getProfileInfo = useCallback(async (userName: string): Promise<string> => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, bio, category, city, follower_count, following_count, account_type")
      .ilike("display_name", `%${userName}%`)
      .limit(1)
      .maybeSingle();

    if (!data) return `Profilo "${userName}" non trovato!`;

    let info = `${data.display_name}`;
    if (data.account_type) info += ` — tipo: ${data.account_type}`;
    if (data.city) info += `, ${data.city}`;
    if (data.category) info += `, ${data.category}`;
    if (data.bio) info += `. Bio: ${data.bio.slice(0, 100)}`;
    info += `. ${data.follower_count ?? 0} follower, ${data.following_count ?? 0} seguiti.`;

    navigate(`/profile/${data.user_id}`);
    return info;
  }, [navigate]);

  /** Confirm the oldest pending booking for the logged-in user */
  const confirmPendingBooking = useCallback(async (): Promise<string> => {
    if (!user) return "Devi accedere!";

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, status, booking_date, services(name)")
      .eq("client_id", user.id)
      .eq("status", "pending")
      .order("booking_date", { ascending: true })
      .limit(1);

    if (!bookings || bookings.length === 0) return "Nessuna prenotazione in attesa di conferma!";

    const booking = bookings[0] as any;
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", booking.id);

    const dateStr = new Date(booking.booking_date).toLocaleString("it-IT", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    });

    const serviceName = booking.services?.name || "Servizio";
    toast.success(`Prenotazione confermata! ✅`);
    navigate("/my-bookings");
    return `Prenotazione confermata! ${serviceName} del ${dateStr} ✅`;
  }, [user, navigate]);

  /** Actually send a message to a user and navigate to the conversation */
  const sendMessageToUser = useCallback(async (recipientName: string, content: string): Promise<string> => {
    if (!user) return "Devi accedere per inviare messaggi!";

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .ilike("display_name", `%${recipientName}%`)
      .neq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!profile) return `Utente "${recipientName}" non trovato!`;

    // Find or create conversation
    const { data: existingConvs } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_1.eq.${user.id},participant_2.eq.${profile.user_id}),` +
        `and(participant_1.eq.${profile.user_id},participant_2.eq.${user.id})`
      )
      .limit(1);

    let conversationId: string;
    if (existingConvs && existingConvs.length > 0) {
      conversationId = existingConvs[0].id;
    } else {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ participant_1: user.id, participant_2: profile.user_id })
        .select("id")
        .single();
      if (!newConv) return "Errore nella creazione della conversazione!";
      conversationId = newConv.id;
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      message_type: "text",
    });

    await supabase.from("conversations").update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq("id", conversationId);

    toast.success(`Messaggio inviato a ${profile.display_name}! 📨`);
    navigate(`/chat/${conversationId}`);
    return `Messaggio inviato a ${profile.display_name}: "${content}" 📨`;
  }, [user, navigate]);

  // ─── Main async command processor ─────────────────────────────────────────

  const processVoiceCommand = useCallback(async (
    transcript: string
  ): Promise<{ matched: boolean; response: string; action?: string }> => {
    const text = transcript.toLowerCase().trim();

    // ── Navigation ────────────────────────────────────────────────────────────
    if (text.includes("torna indietro") || text.includes("vai indietro") || text.includes("pagina precedente") || text === "indietro") {
      window.history.back();
      return { matched: true, response: "Torno alla pagina precedente!" };
    }
    if (text.includes("scorri su") || text.includes("vai su") || text.includes("scroll su")) {
      window.scrollBy({ top: -300, behavior: "smooth" });
      return { matched: true, response: "Scorro verso l'alto!" };
    }
    if (text.includes("scorri giù") || text.includes("vai giù") || text.includes("scorri in basso")) {
      window.scrollBy({ top: 300, behavior: "smooth" });
      return { matched: true, response: "Scorro verso il basso!" };
    }

    // ── Send message WITH content ──────────────────────────────────────────────
    const msgFull = text.match(
      /(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+([^:,]+?)(?:\s*[,:]\s*|\s+(?:che\s+dice|dicendo|scrivendo|con\s+scritto)\s+)(.+)/
    );
    if (msgFull) {
      return { matched: true, response: await sendMessageToUser(msgFull[1].trim(), msgFull[2].trim()) };
    }

    // ── Send message WITHOUT content (navigate) ───────────────────────────────
    const msgSimple = text.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+(.+)/);
    if (msgSimple) {
      navigate("/chat");
      toast.info(`Cerco "${msgSimple[1].trim()}" nella chat...`);
      return { matched: true, response: `Apro la chat — cerca ${msgSimple[1].trim()} per scrivere!` };
    }

    // ── Like ─────────────────────────────────────────────────────────────────
    const likeUser = text.match(/(?:metti|dai|aggiungi)\s+like\s+(?:al\s+post\s+di|a)\s+(.+)/);
    if (likeUser) return { matched: true, response: await likePostByUser(likeUser[1].trim()) };

    if (text.match(/metti\s+like|dai\s+like|mi\s+piace\s+(?:al\s+post|al\s+contenuto)/)) {
      return { matched: true, response: await likePostByUser() };
    }

    // ── Comment ───────────────────────────────────────────────────────────────
    const commentMatch = text.match(
      /commenta\s+(?:il\s+post\s+di|su)\s+([^:,]+?)(?:\s*[,:]\s*|\s+(?:con|dicendo|scrivendo)\s+)(.+)/
    );
    if (commentMatch) {
      return { matched: true, response: await commentOnPost(commentMatch[1].trim(), commentMatch[2].trim()) };
    }

    // ── Follow ────────────────────────────────────────────────────────────────
    const followMatch = text.match(/(?:segui|inizia\s+a\s+seguire)\s+(.+)/);
    if (followMatch) return { matched: true, response: await followUserByName(followMatch[1].trim()) };

    // ── Unfollow ──────────────────────────────────────────────────────────────
    const unfollowMatch = text.match(/(?:smetti\s+di\s+seguire|togli\s+(?:il\s+)?follow\s+(?:a|di))\s+(.+)/);
    if (unfollowMatch) return { matched: true, response: await unfollowUserByName(unfollowMatch[1].trim()) };

    // ── Profile info ──────────────────────────────────────────────────────────
    const profileMatch = text.match(
      /(?:dimmi|mostrami|fammi\s+vedere|esamina|verifica|controlla|guarda)\s+(?:il\s+)?profilo\s+(?:di\s+)?(.+)/
    );
    if (profileMatch) return { matched: true, response: await getProfileInfo(profileMatch[1].trim()) };

    // ── Confirm booking ───────────────────────────────────────────────────────
    if (
      text.includes("conferma prenotazione") ||
      text.includes("conferma appuntamento") ||
      text.includes("approva prenotazione")
    ) {
      return { matched: true, response: await confirmPendingBooking() };
    }

    // ── Call commands ─────────────────────────────────────────────────────────
    const callMatch = text.match(/(?:chiama|telefona|videochiama)\s+(.+)/);
    if (callMatch) {
      navigate("/chat");
      toast.info(`Cerco "${callMatch[1]}" per la chiamata...`);
      return { matched: true, response: `Cerco ${callMatch[1]} per la chiamata!` };
    }

    // ── Search / find ─────────────────────────────────────────────────────────
    const searchMatch = text.match(/^cerca\s+(.+)$/);
    if (searchMatch) {
      navigate(`/search?q=${encodeURIComponent(searchMatch[1].trim())}`);
      return { matched: true, response: `Cerco "${searchMatch[1].trim()}"!` };
    }

    const matchRadiusMatch = text.match(
      /cerca\s+(?:match|amici|persone|stilisti)\s+(?:a|entro|vicino|nel\s+raggio\s+di)\s*(\d+)\s*km/
    );
    if (matchRadiusMatch) {
      navigate(`/map-search?radius=${matchRadiusMatch[1]}`);
      return { matched: true, response: `Cerco match entro ${matchRadiusMatch[1]} km!` };
    }
    if (text.includes("cerca match") || text.includes("trova match")) {
      navigate("/map-search");
      return { matched: true, response: "Apro la mappa dei match vicino a te!" };
    }

    // ── Page navigation commands ──────────────────────────────────────────────
    if (text.includes("vai alla home") || text.includes("apri home") || text.includes("torna alla home")) {
      navigate("/"); return { matched: true, response: "Ti porto alla home!" };
    }
    if (text.includes("apri chat") || text.includes("vai alla chat") || text.includes("messaggi")) {
      navigate("/chat"); return { matched: true, response: "Apro la chat!" };
    }
    if (text.includes("apri notifiche") || text.includes("dimmi le notifiche") || text.includes("tutte le notifiche")) {
      navigate("/notifications"); return { matched: true, response: "Ecco le tue notifiche!" };
    }
    if (text.includes("apri profilo") || text.includes("vai al mio profilo") || text.includes("mostra profilo")) {
      navigate("/profile"); return { matched: true, response: "Ecco il tuo profilo!" };
    }
    if (text.includes("apri wallet") || text.includes("vai al wallet") || text.includes("portafoglio")) {
      navigate("/wallet"); return { matched: true, response: "Apro il tuo wallet!" };
    }
    if (text.includes("prenota") && !text.includes("prenotazione")) {
      navigate("/stylists"); return { matched: true, response: "Ti mostro i professionisti disponibili!" };
    }
    if (text.includes("le mie prenotazioni") || text.includes("mostra prenotazioni")) {
      navigate("/my-bookings"); return { matched: true, response: "Ecco le tue prenotazioni!" };
    }
    if (text.includes("apri mappa") || text.includes("cerca sulla mappa")) {
      navigate("/map-search"); return { matched: true, response: "Apro la mappa!" };
    }
    if (text.includes("vai allo shop") || text.includes("apri shop") || text.includes("negozio")) {
      navigate("/shop"); return { matched: true, response: "Apro lo shop!" };
    }
    if (text.includes("apri missioni") || text.includes("vai alle missioni")) {
      navigate("/missions"); return { matched: true, response: "Ecco le tue missioni!" };
    }
    if (text.includes("gira la ruota") || text.includes("ruota della fortuna")) {
      navigate("/spin"); return { matched: true, response: "Apro la ruota della fortuna!" };
    }
    if (text.includes("vai in live") || text.includes("apri live")) {
      navigate("/live"); return { matched: true, response: "Ti porto nel live!" };
    }
    if (text.includes("apri radio") || text.includes("musica")) {
      navigate("/radio"); return { matched: true, response: "Apro la radio!" };
    }
    if (text.includes("impostazioni")) {
      navigate("/settings"); return { matched: true, response: "Apro le impostazioni!" };
    }
    if (text.includes("esplora")) {
      navigate("/explore"); return { matched: true, response: "Apro esplora!" };
    }
    if (text.includes("crea post") || text.includes("pubblica post")) {
      navigate("/create-post"); return { matched: true, response: "Apro la creazione post!" };
    }
    if (text.includes("classifica") || text.includes("leaderboard")) {
      navigate("/leaderboard"); return { matched: true, response: "Apro la classifica!" };
    }
    if (text.includes("sfide") || text.includes("challenge")) {
      navigate("/challenges"); return { matched: true, response: "Ecco le sfide attive!" };
    }
    if (text.includes("shorts") || text.includes("video brevi")) {
      navigate("/shorts"); return { matched: true, response: "Apro i video shorts!" };
    }
    if (text.includes("eventi")) {
      navigate("/events"); return { matched: true, response: "Ecco gli eventi!" };
    }
    if (text.includes("marketplace")) {
      navigate("/marketplace"); return { matched: true, response: "Apro il marketplace!" };
    }
    if (text.includes("spa") || text.includes("terme") || text.includes("benessere")) {
      navigate("/spa-terme"); return { matched: true, response: "Ecco le Spa e Terme!" };
    }
    if (text.includes("quiz")) {
      navigate("/quiz-live"); return { matched: true, response: "Apro il Quiz Live!" };
    }
    if (text.includes("referral") || text.includes("invita amici")) {
      navigate("/referral"); return { matched: true, response: "Apro il programma referral!" };
    }
    if (text.includes("offerte")) {
      navigate("/offers"); return { matched: true, response: "Apro le offerte!" };
    }
    if (text.includes("leggi notifiche")) {
      navigate("/notifications"); return { matched: true, response: "Vado alle notifiche!" };
    }

    // ── Theme ─────────────────────────────────────────────────────────────────
    if (text.includes("tema chiaro") || text.includes("modalità chiara") || text.includes("light mode")) {
      return { matched: true, response: "Attivo il tema chiaro!", action: "theme:light" };
    }
    if (text.includes("tema scuro") || text.includes("modalità scura") || text.includes("dark mode")) {
      return { matched: true, response: "Attivo il tema scuro!", action: "theme:dark" };
    }

    return {
      matched: false,
      response:
        "Non ho capito il comando. Puoi dirmi: 'apri chat', 'invia messaggio a [nome]: [testo]', " +
        "'metti like a [nome]', 'commenta [nome]: [testo]', 'segui [nome]', " +
        "'esamina profilo di [nome]', 'conferma prenotazione', 'cerca [termine]', " +
        "o programmare azioni con 'tra X minuti / alle HH:MM'.",
    };
  }, [
    navigate,
    likePostByUser,
    commentOnPost,
    followUserByName,
    unfollowUserByName,
    getProfileInfo,
    confirmPendingBooking,
    sendMessageToUser,
  ]);

  return { processVoiceCommand };
}
