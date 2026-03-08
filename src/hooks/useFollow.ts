import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!targetUserId) return;
    checkFollowStatus();
    fetchCounts();
  }, [targetUserId, user?.id]);

  const checkFollowStatus = async () => {
    if (!user || !targetUserId) return;
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const fetchCounts = async () => {
    if (!targetUserId) return;
    const { data } = await supabase
      .from("profiles")
      .select("follower_count, following_count")
      .eq("user_id", targetUserId)
      .single();
    if (data) {
      setFollowerCount(data.follower_count || 0);
      setFollowingCount(data.following_count || 0);
    }
  };

  const toggleFollow = useCallback(async () => {
    if (!user) {
      toast.error("Accedi per seguire");
      return false;
    }
    if (!targetUserId || targetUserId === user.id) return false;
    setLoading(true);

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(prev - 1, 0));
        toast.success("Non segui più");
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success("Ora segui! ❤️");
      }
    } catch {
      toast.error("Errore, riprova");
    } finally {
      setLoading(false);
    }
    return true;
  }, [user, targetUserId, isFollowing]);

  return { isFollowing, followerCount, followingCount, toggleFollow, loading };
}
