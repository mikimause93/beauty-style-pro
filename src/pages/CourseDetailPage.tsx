import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollment } from "@/hooks/useEnrollment";
import { useCourseProgress } from "@/hooks/useCourseProgress";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Star, Users, Clock, Lock, CheckCircle, Play, BookOpen, Award,
  ChevronLeft, AlertCircle
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  duration_minutes: number | null;
  position: number;
  is_preview: boolean;
  video_url: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number | null;
  is_free: boolean | null;
  level: string | null;
  category: string | null;
  enrolled_count: number | null;
  rating: number | null;
  rating_count: number | null;
  creator_id: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"contenuto" | "istruttore" | "recensioni">("contenuto");
  const [enrolling, setEnrolling] = useState(false);

  const { enrollment, isEnrolled, enroll } = useEnrollment(id ?? "");
  const { isLessonCompleted } = useCourseProgress(id ?? "");

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    const [courseRes, lessonsRes, reviewsRes] = await Promise.all([
      supabase
        .from("courses")
        .select("*, profiles:creator_id(display_name, avatar_url)")
        .eq("id", id!)
        .maybeSingle(),
      supabase
        .from("lessons")
        .select("*")
        .eq("course_id", id!)
        .eq("is_published", true)
        .order("position"),
      supabase
        .from("course_reviews")
        .select("*, profiles:user_id(display_name, avatar_url)")
        .eq("course_id", id!)
        .limit(10),
    ]);

    if (courseRes.error) toast.error("Errore nel caricamento del corso");
    else setCourse(courseRes.data as Course);

    setLessons((lessonsRes.data as Lesson[]) ?? []);
    setReviews((reviewsRes.data as Review[]) ?? []);
    setLoading(false);
  };

  const handleEnroll = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!course) return;
    setEnrolling(true);
    if (course.is_free || !course.price) {
      const ok = await enroll(0, "free");
      if (ok) toast.success("Iscrizione completata!");
      else toast.error("Errore durante l'iscrizione");
    } else {
      navigate(`/checkout?course_id=${id}`);
    }
    setEnrolling(false);
  };

  const firstIncompleteLesson = lessons.find((l) => !isLessonCompleted(l.id))?.id ?? lessons[0]?.id;

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
      />
    ));

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      </MobileLayout>
    );
  }

  if (!course) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">Corso non trovato.</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
            Torna Indietro
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <div className="sticky top-0 z-30 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted/50 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-sm truncate flex-1">{course.title}</h1>
      </div>

      {/* Hero */}
      <div className="relative">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-52 object-cover" />
        ) : (
          <div className="w-full h-52 gradient-primary flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-primary-foreground/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          {course.level && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium mb-2 inline-block">
              {course.level}
            </span>
          )}
          <h2 className="text-xl font-bold text-foreground leading-tight">{course.title}</h2>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          {renderStars(course.rating ?? 0)}
          <span className="text-sm font-semibold ml-1">{(course.rating ?? 0).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({course.rating_count ?? 0})</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Users className="w-4 h-4" />
          <span>{course.enrolled_count ?? 0} iscritti</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Clock className="w-4 h-4" />
          <span>{lessons.length} lezioni</span>
        </div>
      </div>

      {/* Creator */}
      {course.profiles && (
        <div className="px-4 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {course.profiles.avatar_url ? (
              <img src={course.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {(course.profiles.display_name ?? "?")[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Istruttore</p>
            <p className="text-sm font-medium">{course.profiles.display_name ?? "Sconosciuto"}</p>
          </div>
        </div>
      )}

      {/* Enrollment status */}
      {isEnrolled && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">Sei iscritto a questo corso</span>
          {enrollment?.progress !== undefined && (
            <span className="ml-auto text-xs text-muted-foreground">{enrollment.progress}% completato</span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="sticky top-14 z-20 glass px-4 flex gap-1 border-b border-border">
        {(["contenuto", "istruttore", "recensioni"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            {tab === "contenuto" ? "Contenuto" : tab === "istruttore" ? "Istruttore" : "Recensioni"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 pt-4 pb-32">
        {activeTab === "contenuto" && (
          <div className="space-y-2">
            {lessons.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna lezione disponibile</p>
              </div>
            ) : (
              lessons.map((lesson, idx) => {
                const completed = isLessonCompleted(lesson.id);
                const accessible = isEnrolled || lesson.is_preview;
                return (
                  <button
                    key={lesson.id}
                    disabled={!accessible}
                    onClick={() => accessible && navigate(`/formation/lesson/${lesson.id}`)}
                    className={`w-full chrome-card p-3 flex items-center gap-3 text-left transition-all ${
                      accessible ? "hover:border-primary/30 cursor-pointer" : "opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
                      {completed ? (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      ) : accessible ? (
                        <Play className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {idx + 1}. {lesson.title}
                      </p>
                      {lesson.duration_minutes && (
                        <p className="text-xs text-muted-foreground">{lesson.duration_minutes} min</p>
                      )}
                    </div>
                    {lesson.is_preview && !isEnrolled && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium flex-shrink-0">
                        Anteprima
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {activeTab === "istruttore" && (
          <div className="chrome-card p-5 space-y-3">
            {course.profiles ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {course.profiles.avatar_url ? (
                      <img src={course.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                        {(course.profiles.display_name ?? "?")[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{course.profiles.display_name}</h3>
                    <p className="text-sm text-muted-foreground">Istruttore Beauty Style Pro</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Esperto nel settore beauty con anni di esperienza nell'insegnamento e nella formazione professionale.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Informazioni sull'istruttore non disponibili.</p>
            )}
          </div>
        )}

        {activeTab === "recensioni" && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Star className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna recensione ancora</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="chrome-card p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {review.profiles?.avatar_url ? (
                        <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {(review.profiles?.display_name ?? "?")[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{review.profiles?.display_name ?? "Utente"}</p>
                      <div className="flex">{renderStars(review.rating)}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 glass px-4 py-3 border-t border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div>
            <p className="text-lg font-bold">
              {course.is_free || !course.price ? "Gratuito" : `€${course.price}`}
            </p>
          </div>
          <div className="flex-1">
            {isEnrolled ? (
              <button
                onClick={() => firstIncompleteLesson && navigate(`/formation/lesson/${firstIncompleteLesson}`)}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow"
              >
                Continua il Corso
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-60"
              >
                {enrolling ? "Iscrizione in corso..." : "Iscriviti Ora"}
              </button>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
