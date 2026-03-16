import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// ======= POSTS =======
export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles:user_id(display_name, avatar_url, user_type)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: { caption: string; image_url?: string; post_type?: string; user_id: string }) => {
      const { data, error } = await supabase.from("posts").insert(post).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
}

// ======= PROFESSIONALS =======
export function useProfessionals() {
  return useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*, profiles:user_id(display_name, avatar_url)")
        .order("rating", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ======= SERVICES =======
export function useServices(professionalId?: string) {
  return useQuery({
    queryKey: ["services", professionalId],
    queryFn: async () => {
      let query = supabase.from("services").select("*").eq("active", true);
      if (professionalId) query = query.eq("professional_id", professionalId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!professionalId,
  });
}

// ======= BOOKINGS =======
export function useMyBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, professionals(business_name), services(name, price)")
        .eq("client_id", user!.id)
        .order("booking_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking: {
      client_id: string;
      professional_id: string;
      service_id?: string;
      booking_date: string;
      start_time: string;
      total_price?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase.from("bookings").insert(booking).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

// ======= CHALLENGES =======
export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("active", true)
        .gte("end_date", new Date().toISOString())
        .order("featured", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyParticipations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["participations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_participations")
        .select("*, challenges(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ======= EVENTS =======
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .in("status", ["scheduled", "live"])
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

// ======= PRODUCTS =======
export function useProducts(category?: string) {
  return useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      let query = supabase.from("products").select("*").eq("active", true);
      if (category) query = query.eq("category", category);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ======= FOLLOWS =======
export function useToggleFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ followerId, followingId, isFollowing }: { followerId: string; followingId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        const { error } = await supabase.from("follows").delete().match({ follower_id: followerId, following_id: followingId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follows"] }),
  });
}

// ======= POST LIKES =======
export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { postId: string; userId: string; isLiked: boolean }) => {
      if (isLiked) {
        await supabase.from("post_likes").delete().match({ post_id: postId, user_id: userId });
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
}

// ======= NOTIFICATIONS =======
export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ======= SPIN =======
export function useSpin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, prizeType, prizeValue, prizeDescription }: {
      userId: string;
      prizeType: string;
      prizeValue: number;
      prizeDescription: string;
    }) => {
      const { data, error } = await supabase.from("spin_results").insert({
        user_id: userId,
        prize_type: prizeType,
        prize_value: prizeValue,
        prize_description: prizeDescription,
      }).select().single();
      if (error) throw error;

      // Update QR coins if prize type is QR_COIN
      if (prizeType === "QR_COIN") {
        // Credits will be handled via profile update
        await supabase
          .from("profiles")
          .update({ qr_coins: prizeValue } as never)
          .eq("user_id", userId);
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}

// ======= REFERRAL =======
export function useMyReferralCode() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["referral_code", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ======= SMART REMINDERS =======
export function useSmartRemindersCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["smart_reminders_count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabase
        .from("smart_reminders")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("status", "active")
        .lte("next_suggested_date", today);
        
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}
