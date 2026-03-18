import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import CertificateGenerator from "@/components/CertificateGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useCourseProgress } from "@/hooks/useCourseProgress";
import { useEnrollment } from "@/hooks/useEnrollment";
import { toast } from "sonner";
import {
  Play, Pause, ChevronLeft, ChevronRight, CheckCircle, Award, X, AlertCircle
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  video_url: string | null;
  duration_minutes: number | null;
  position: number;
  course_id: string;
  description: string | null;
  course: { title: string; creator_id: string } | null;
}

export default function LessonPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const courseId = lesson?.course_id ?? "";
  const { markLessonComplete, isLessonCompleted, getCompletionPercentage, totalLessons, lessonsProgress, refresh } = useCourseProgress(courseId);
  const { isEnrolled } = useEnrollment(courseId);

  useEffect(() => {
    if (id) fetchLesson();
  }, [id]);

  useEffect(() => {
    if (courseId) fetchAllLessons();
  }, [courseId]);

  const fetchLesson = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lessons")
      .select("*, course:course_id(title, creator_id)")
      .eq("id", id!)
      .maybeSingle();
    if (error) toast.error("Errore nel caricamento della lezione");
    else setLesson(data as Lesson);
    setLoading(false);
  };

  const fetchAllLessons = async () => {
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .eq("is_published", true)
      .order("position");
    setAllLessons((data as Lesson[]) ?? []);
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleMarkComplete = async () => {
    if (!lesson) return;
    setMarkingComplete(true);
    await markLessonComplete(lesson.id);
    await refresh();
    toast.success("Lezione completata! 🎉");
    setMarkingComplete(false);

    const completedCount = lessonsProgress.filter((p) => p.completed).length + 1;
    if (completedCount >= totalLessons && totalLessons > 0) {
      setShowCertModal(true);
      return;
    }

    const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
    const next = allLessons[currentIndex + 1];
    if (next) navigate(`/formation/lesson/${next.id}`);
  };

  const currentIndex = allLessons.findIndex((l) => l.id === id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const completionPct = getCompletionPercentage();

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      </MobileLayout>
    );
  }

  if (!lesson) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">Lezione non trovata.</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
            Torna Indietro
          </button>
        </div>
      </MobileLayout>
    );
  }

  const isCompleted = isLessonCompleted(lesson.id);

  return (
    <MobileLayout>
      {/* Header */}
      <div className="sticky top-0 z-30 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted/50 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{lesson.course?.title}</p>
          <h1 className="text-sm font-semibold truncate">{lesson.title}</h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full gradient-primary transition-all duration-500"
          style={{ width: `${completionPct}%` }}
        />
      </div>
      <div className="px-4 py-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Progresso corso
        </span>
        <span className="text-xs font-medium text-primary">{completionPct}%</span>
      </div>

      {/* Video player */}
      <div className="relative bg-black aspect-video w-full">
        {lesson.video_url ? (
          <>
            <video
              ref={videoRef}
              src={lesson.video_url}
              className="w-full h-full object-contain"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              controls
            />
            <button
              onClick={handleTogglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
                {playing ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </div>
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <Play className="w-12 h-12 text-white/40" />
            <p className="text-white/60 text-sm">Video non disponibile</p>
          </div>
        )}
      </div>

      {/* Lesson info */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold flex-1">{lesson.title}</h2>
          {isCompleted && (
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
          )}
        </div>
        {lesson.duration_minutes && (
          <p className="text-xs text-muted-foreground mt-1">{lesson.duration_minutes} minuti</p>
        )}
        {lesson.description && (
          <p className="text-sm text-muted-foreground mt-3">{lesson.description}</p>
        )}
      </div>

      {/* Navigation + complete button */}
      <div className="px-4 pt-4 pb-6 space-y-3">
        {/* Nav arrows */}
        <div className="flex gap-2">
          <button
            onClick={() => prevLesson && navigate(`/formation/lesson/${prevLesson.id}`)}
            disabled={!prevLesson}
            className="flex-1 py-2.5 rounded-xl chrome-card flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-40 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Precedente
          </button>
          <button
            onClick={() => nextLesson && navigate(`/formation/lesson/${nextLesson.id}`)}
            disabled={!nextLesson}
            className="flex-1 py-2.5 rounded-xl chrome-card flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-40 transition-all"
          >
            Successiva
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mark complete button */}
        {!isCompleted ? (
          <button
            onClick={handleMarkComplete}
            disabled={markingComplete}
            className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <CheckCircle className="w-5 h-5" />
            {markingComplete ? "Salvataggio..." : "Lezione Completata ✓"}
          </button>
        ) : (
          <div className="w-full py-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold text-sm">Lezione già completata</span>
          </div>
        )}
      </div>

      {/* Lesson list */}
      {allLessons.length > 0 && (
        <div className="px-4 pb-32">
          <h3 className="text-sm font-semibold mb-3">Tutte le lezioni</h3>
          <div className="space-y-2">
            {allLessons.map((l, idx) => {
              const done = isLessonCompleted(l.id);
              const active = l.id === id;
              return (
                <button
                  key={l.id}
                  onClick={() => navigate(`/formation/lesson/${l.id}`)}
                  className={`w-full chrome-card p-3 flex items-center gap-3 text-left transition-all ${
                    active ? "border-primary/50" : "hover:border-primary/20"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    active ? "gradient-primary text-primary-foreground" : done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-sm truncate ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {l.title}
                  </span>
                  {l.duration_minutes && (
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{l.duration_minutes}m</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificate modal */}
      {showCertModal && lesson.course && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4">
          <div className="chrome-card w-full max-w-lg rounded-2xl p-6 space-y-4 slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-7 h-7 text-yellow-400" />
                <h3 className="text-lg font-bold">Corso Completato! 🎉</h3>
              </div>
              <button onClick={() => setShowCertModal(false)} className="p-1 rounded-full hover:bg-muted/50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Complimenti! Hai completato <strong>{lesson.course.title}</strong>. Genera ora il tuo certificato.
            </p>
            <CertificateGenerator
              courseId={courseId}
              courseTitle={lesson.course.title}
              onGenerated={() => toast.success("Certificato pronto!")}
            />
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
