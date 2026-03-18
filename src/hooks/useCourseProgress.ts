import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface LessonProgress { lesson_id: string; completed: boolean; completed_at: string | null; }

export function useCourseProgress(courseId: string) {
  const { user } = useAuth();
  const [lessonsProgress, setLessonsProgress] = useState<LessonProgress[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && courseId) loadProgress();
    else setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, courseId]);

  const loadProgress = async () => {
    setLoading(true);
    const { data: lessons } = await supabase.from('lessons').select('id').eq('course_id', courseId);
    if (!lessons) { setLoading(false); return; }
    setTotalLessons(lessons.length);
    const { data: progress } = await supabase.from('lesson_progress').select('*').eq('user_id', user!.id).in('lesson_id', lessons.map(l => l.id));
    setLessonsProgress(progress || []);
    setLoading(false);
  };

  const markLessonComplete = async (lessonId: string) => {
    await supabase.from('lesson_progress').upsert({ user_id: user!.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() });
    await loadProgress();
  };

  const isLessonCompleted = (lessonId: string) => lessonsProgress.some(p => p.lesson_id === lessonId && p.completed);

  const getCompletionPercentage = () => {
    if (totalLessons === 0) return 0;
    return Math.round((lessonsProgress.filter(p => p.completed).length / totalLessons) * 100);
  };

  return { lessonsProgress, totalLessons, loading, markLessonComplete, isLessonCompleted, getCompletionPercentage, refresh: loadProgress };
}
