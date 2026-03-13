import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useApplause(postId: string) {
  const { user } = useAuth();
  const [applauded, setApplauded] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user || !postId) return;
    // Check from post_likes with a special convention - we use a separate local state
    // Since we don't have a separate table, we track applause client-side per session
  }, [user, postId]);

  const toggleApplause = useCallback(async () => {
    if (!user) return;
    setApplauded(prev => !prev);
    setCount(prev => applauded ? Math.max(prev - 1, 0) : prev + 1);
  }, [user, applauded]);

  return { applauded, count, setCount, toggleApplause };
}
