import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Enrollment {
  id: string;
  course_id: string;
  progress: number;
  completed_at: string | null;
  created_at: string;
}

export function useEnrollment(courseId: string) {
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && courseId) loadEnrollment();
    else setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, courseId]);

  const loadEnrollment = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user!.id)
        .eq('course_id', courseId)
        .maybeSingle();
      setEnrollment(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const enroll = async (paymentAmount = 0, paymentMethod = 'free') => {
    if (!user) return false;
    const { error } = await supabase.from('enrollments').insert({
      user_id: user.id,
      course_id: courseId,
      payment_amount: paymentAmount,
      payment_method: paymentMethod,
      progress: 0,
    });
    if (!error) { await loadEnrollment(); return true; }
    return false;
  };

  const updateProgress = async (progress: number) => {
    if (!enrollment) return;
    await supabase.from('enrollments').update({ progress }).eq('id', enrollment.id);
    setEnrollment({ ...enrollment, progress });
  };

  const markAsCompleted = async () => {
    if (!enrollment) return;
    const now = new Date().toISOString();
    await supabase.from('enrollments').update({ completed_at: now, progress: 100 }).eq('id', enrollment.id);
    setEnrollment({ ...enrollment, completed_at: now, progress: 100 });
  };

  return { enrollment, loading, isEnrolled: !!enrollment, enroll, updateProgress, markAsCompleted, refresh: loadEnrollment };
}
