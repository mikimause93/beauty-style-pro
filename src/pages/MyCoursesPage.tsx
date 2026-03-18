import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import CertificateGenerator from "@/components/CertificateGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCourseProgress } from "@/hooks/useCourseProgress";
import { toast } from "sonner";
import { BookOpen, Award, CheckCircle, Play, Star, Download, AlertCircle } from "lucide-react";

interface CourseData {
  id: string;
  title: string;
  thumbnail_url: string | null;
  level: string | null;
  category: string | null;
  price: number | null;
  is_free: boolean | null;
}

interface EnrollmentWithCourse {
  id: string;
  course_id: string;
  progress: number;
  completed_at: string | null;
  created_at: string;
  course: CourseData | null;
}

interface CertificateWithCourse {
  id: string;
  course_id: string;
  certificate_url: string | null;
  created_at: string;
  course: { title: string } | null;
}

function CourseProgressCard({ enrollment, onContinue }: { enrollment: EnrollmentWithCourse; onContinue: (id: string) => void }) {
  const { getCompletionPercentage } = useCourseProgress(enrollment.course_id);
  const pct = enrollment.progress ?? getCompletionPercentage();

  return (
    <div className="chrome-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {enrollment.course?.thumbnail_url ? (
            <img src={enrollment.course.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gradient-primary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground/70" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{enrollment.course?.title ?? "Corso"}</h3>
          {enrollment.course?.level && (
            <span className="text-xs text-muted-foreground">{enrollment.course.level}</span>
          )}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-primary">{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={() => onContinue(enrollment.course_id)}
        className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 shadow-glow"
      >
        <Play className="w-4 h-4" />
        Continua
      </button>
    </div>
  );
}

export default function MyCoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"in_corso" | "completati" | "certificati">("in_corso");
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [certificates, setCertificates] = useState<CertificateWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [certCourseId, setCertCourseId] = useState<string | null>(null);
  const [certCourseTitle, setCertCourseTitle] = useState("");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [enrollRes, certRes] = await Promise.all([
      supabase
        .from("enrollments")
        .select("*, course:course_id(*)")
        .eq("user_id", user!.id),
      supabase
        .from("certificates")
        .select("*, course:course_id(title)")
        .eq("user_id", user!.id),
    ]);
    if (enrollRes.error) toast.error("Errore nel caricamento delle iscrizioni");
    else setEnrollments((enrollRes.data as EnrollmentWithCourse[]) ?? []);
    setCertificates((certRes.data as CertificateWithCourse[]) ?? []);
    setLoading(false);
  };

  const inCorso = enrollments.filter((e) => !e.completed_at && e.progress < 100);
  const completati = enrollments.filter((e) => e.completed_at || e.progress === 100);

  const handleContinue = async (courseId: string) => {
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", courseId)
      .eq("is_published", true)
      .order("position")
      .limit(1);
    const firstLesson = lessons?.[0];
    if (firstLesson) navigate(`/formation/lesson/${firstLesson.id}`);
    else navigate(`/formation/course/${courseId}`);
  };

  const tabs = [
    { key: "in_corso" as const, label: "In Corso", count: inCorso.length },
    { key: "completati" as const, label: "Completati", count: completati.length },
    { key: "certificati" as const, label: "Certificati", count: certificates.length },
  ];

  return (
    <MobileLayout>
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold">I Miei Corsi</h1>
        <p className="text-sm text-muted-foreground mt-1">Il tuo percorso formativo</p>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 pb-32">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* In Corso */}
            {tab === "in_corso" && (
              <div className="space-y-3">
                {inCorso.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium mb-1">Nessun corso in corso</p>
                    <p className="text-xs mb-4">Iscriviti a un corso per iniziare</p>
                    <button onClick={() => navigate("/formation")} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
                      Esplora Corsi
                    </button>
                  </div>
                ) : (
                  inCorso.map((e) => (
                    <CourseProgressCard key={e.id} enrollment={e} onContinue={handleContinue} />
                  ))
                )}
              </div>
            )}

            {/* Completati */}
            {tab === "completati" && (
              <div className="space-y-3">
                {completati.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium mb-1">Nessun corso completato</p>
                    <p className="text-xs">Completa i tuoi corsi per vederli qui</p>
                  </div>
                ) : (
                  completati.map((e) => (
                    <div key={e.id} className="chrome-card p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          {e.course?.thumbnail_url ? (
                            <img src={e.course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full gradient-primary flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-primary-foreground/70" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{e.course?.title ?? "Corso"}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <CheckCircle className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs text-primary font-medium">Completato</span>
                          </div>
                          {e.completed_at && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(e.completed_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Rating prompt */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-1">Valuta:</span>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} className="p-0.5">
                            <Star className="w-4 h-4 text-muted-foreground hover:text-yellow-400 hover:fill-yellow-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Certificati */}
            {tab === "certificati" && (
              <div className="space-y-3">
                {certificates.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium mb-1">Nessun certificato ancora</p>
                    <p className="text-xs">Completa un corso per guadagnare il tuo certificato</p>
                  </div>
                ) : (
                  certificates.map((cert) => (
                    <div key={cert.id} className="chrome-card p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{cert.course?.title ?? "Corso"}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(cert.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {cert.certificate_url ? (
                          <a
                            href={cert.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Scarica
                          </a>
                        ) : (
                          <button
                            onClick={() => { setCertCourseId(cert.course_id); setCertCourseTitle(cert.course?.title ?? ""); }}
                            className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
                          >
                            <Award className="w-4 h-4" />
                            Genera Certificato
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Inline cert generator modal */}
      {certCourseId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4">
          <div className="chrome-card w-full max-w-lg rounded-2xl p-6 space-y-4 slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" /> Genera Certificato
              </h3>
              <button onClick={() => setCertCourseId(null)} className="p-1 rounded-full hover:bg-muted/50">
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
            <CertificateGenerator
              courseId={certCourseId}
              courseTitle={certCourseTitle}
              onGenerated={() => { fetchData(); setCertCourseId(null); }}
            />
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
