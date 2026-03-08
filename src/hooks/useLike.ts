import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useLike(postId: string) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user || !postId) return;
    supabase
      .from("post_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [user, postId]);

  const toggleLike = useCallback(async () => {
    if (!user) { toast.error("Accedi per mettere like"); return; }
    if (liked) {
      await supabase.from("post_likes").delete().eq("user_id", user.id).eq("post_id", postId);
      setLiked(false);
      setCount(prev => Math.max(prev - 1, 0));
    } else {
      await supabase.from("post_likes").insert({ user_id: user.id, post_id: postId });
      setLiked(true);
      setCount(prev => prev + 1);
    }
  }, [user, postId, liked]);

  return { liked, count, setCount, toggleLike };
}
