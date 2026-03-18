import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Trash2, BookOpen, Video, Eye, GripVertical, CheckCircle } from "lucide-react";

const CATEGORIES = ["Capelli", "Unghie", "Makeup", "Skincare", "Sopracciglia", "Massaggio", "Business", "Social Media", "Altro"];
const LEVELS = ["Principiante", "Intermedio", "Avanzato", "Esperto"];

interface LessonDraft {
  tempId: string;
  title: string;
  duration_minutes: string;
  video_url: string;
  is_preview: boolean;
  position: number;
  description: string;
}

interface CourseDraft {
  title: string;
  description: string;
  category: string;
  level: string;
  price: string;
  is_free: boolean;
  thumbnail_url: string;
  preview_video_url: string;
}

export default function CreateCoursePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);

  const [course, setCourse] = useState<CourseDraft>({
    title: "",
    description: "",
    category: "",
    level: "Principiante",
    price: "",
    is_free: true,
    thumbnail_url: "",
    preview_video_url: "",
  });

  const [lessons, setLessons] = useState<LessonDraft[]>([]);

  const updateCourse = (field: keyof CourseDraft, value: string | boolean) =>
    setCourse((prev) => ({ ...prev, [field]: value }));

  const addLesson = () => {
    setLessons((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        title: "",
        duration_minutes: "",
        video_url: "",
        is_preview: false,
        position: prev.length + 1,
        description: "",
      },
    ]);
  };

  const updateLesson = (tempId: string, field: keyof LessonDraft, value: string | boolean | number) =>
    setLessons((prev) => prev.map((l) => (l.tempId === tempId ? { ...l, [field]: value } : l)));

  const removeLesson = (tempId: string) =>
    setLessons((prev) => prev.filter((l) => l.tempId !== tempId).map((l, i) => ({ ...l, position: i + 1 })));

  const saveDraft = async () => {
    if (!user || !course.title.trim()) { toast.error("Inserisci almeno un titolo"); return null; }
    setSaving(true);
    try {
      if (savedCourseId) {
        await supabase
          .from("courses")
          .update({
            title: course.title,
            description: course.description || null,
            category: course.category || null,
            level: course.level || null,
            price: course.is_free ? 0 : parseFloat(course.price) || 0,
            is_free: course.is_free,
            thumbnail_url: course.thumbnail_url || null,
          })
          .eq("id", savedCourseId);
        toast.success("Bozza salvata");
        setSaving(false);
        return savedCourseId;
      } else {
        const { data, error } = await supabase
          .from("courses")
          .insert({
            title: course.title,
            description: course.description || null,
            category: course.category || null,
            level: course.level || null,
            price: course.is_free ? 0 : parseFloat(course.price) || 0,
            is_free: course.is_free,
            thumbnail_url: course.thumbnail_url || null,
            creator_id: user.id,
            is_published: false,
          })
          .select("id")
          .single();
        if (error) { toast.error("Errore salvataggio bozza"); setSaving(false); return null; }
        setSavedCourseId(data.id);
        toast.success("Bozza salvata");
        setSaving(false);
        return data.id;
      }
    } catch {
      toast.error("Errore salvataggio bozza");
      setSaving(false);
      return null;
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!course.title.trim()) { toast.error("Il titolo è obbligatorio"); return; }
      const cid = await saveDraft();
      if (!cid) return;
    }
    if (step === 2 && savedCourseId) {
      // Upsert lessons as draft
      for (const lesson of lessons) {
        if (!lesson.title.trim()) continue;
        await supabase.from("lessons").insert({
          course_id: savedCourseId,
          title: lesson.title,
          duration_minutes: parseInt(lesson.duration_minutes) || null,
          video_url: lesson.video_url || null,
          is_preview: lesson.is_preview,
          position: lesson.position,
          description: lesson.description || null,
          is_published: false,
        });
      }
      toast.success("Lezioni salvate");
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handlePublish = async () => {
    const cid = savedCourseId ?? (await saveDraft());
    if (!cid) return;
    setPublishing(true);
    try {
      // Publish lessons
      await supabase.from("lessons").update({ is_published: true }).eq("course_id", cid);
      // Publish course
      const { error } = await supabase
        .from("courses")
        .update({
          is_published: true,
          thumbnail_url: course.thumbnail_url || null,
        })
        .eq("id", cid);
      if (error) { toast.error("Errore pubblicazione corso"); setPublishing(false); return; }
      toast.success("Corso pubblicato con successo! 🎉");
      navigate("/formation/creator-dashboard");
    } catch {
      toast.error("Errore pubblicazione corso");
    }
    setPublishing(false);
  };

  const stepLabels = ["Informazioni", "Programma", "Anteprima"];

  return (
    <MobileLayout>
      {/* Header */}
      <div className="sticky top-0 z-30 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate(-1))} className="p-2 rounded-full hover:bg-muted/50 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-sm flex-1">Crea Nuovo Corso</h1>
        <span className="text-xs text-muted-foreground">{step}/3</span>
      </div>

      {/* Step progress */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                i + 1 < step ? "gradient-primary text-primary-foreground" :
                i + 1 === step ? "border-2 border-primary text-primary" :
                "border border-muted text-muted-foreground"
              }`}>
                {i + 1 < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs truncate ${i + 1 === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
              {i < stepLabels.length - 1 && <div className={`h-px flex-1 ${i + 1 < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-32 space-y-4">
        {/* Step 1: Informazioni */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titolo del Corso *</label>
              <input
                value={course.title}
                onChange={(e) => updateCourse("title", e.target.value)}
                placeholder="es. Taglio Capelli Professionale"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrizione</label>
              <textarea
                value={course.description}
                onChange={(e) => updateCourse("description", e.target.value)}
                placeholder="Descrivi cosa imparano gli studenti..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <select
                value={course.category}
                onChange={(e) => updateCourse("category", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Seleziona categoria</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Livello</label>
              <select
                value={course.level}
                onChange={(e) => updateCourse("level", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="chrome-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Corso Gratuito</span>
                <button
                  onClick={() => updateCourse("is_free", !course.is_free)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${course.is_free ? "gradient-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${course.is_free ? "translate-x-7" : "translate-x-1"}`} />
                </button>
              </div>
              {!course.is_free && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Prezzo (€)</label>
                  <input
                    type="number"
                    value={course.price}
                    onChange={(e) => updateCourse("price", e.target.value)}
                    placeholder="es. 29.99"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Programma */
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Lezioni ({lessons.length})</h2>
              <button
                onClick={addLesson}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Lezione
              </button>
            </div>

            {lessons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nessuna lezione ancora</p>
                <p className="text-xs">Clicca "Aggiungi Lezione" per iniziare</p>
              </div>
            ) : (
              lessons.map((lesson) => (
                <div key={lesson.tempId} className="chrome-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground flex-1">Lezione {lesson.position}</span>
                    <button onClick={() => removeLesson(lesson.tempId)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    value={lesson.title}
                    onChange={(e) => updateLesson(lesson.tempId, "title", e.target.value)}
                    placeholder="Titolo lezione"
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                  />

                  <input
                    value={lesson.description}
                    onChange={(e) => updateLesson(lesson.tempId, "description", e.target.value)}
                    placeholder="Descrizione (opzionale)"
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={lesson.duration_minutes}
                      onChange={(e) => updateLesson(lesson.tempId, "duration_minutes", e.target.value)}
                      placeholder="Durata (min)"
                      className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground flex-1">Anteprima</span>
                      <button
                        onClick={() => updateLesson(lesson.tempId, "is_preview", !lesson.is_preview)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${lesson.is_preview ? "gradient-primary" : "bg-muted"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${lesson.is_preview ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>

                  <input
                    value={lesson.video_url}
                    onChange={(e) => updateLesson(lesson.tempId, "video_url", e.target.value)}
                    placeholder="URL video (https://...)"
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Step 3: Preview & Publish */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="chrome-card p-4 space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Riepilogo Corso
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Titolo</span>
                  <span className="font-medium truncate max-w-[60%] text-right">{course.title || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoria</span>
                  <span className="font-medium">{course.category || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livello</span>
                  <span className="font-medium">{course.level || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prezzo</span>
                  <span className="font-medium">{course.is_free ? "Gratuito" : `€${course.price}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lezioni</span>
                  <span className="font-medium">{lessons.length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">URL Immagine di Copertina</label>
              <input
                value={course.thumbnail_url}
                onChange={(e) => updateCourse("thumbnail_url", e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
              />
              {course.thumbnail_url && (
                <img src={course.thumbnail_url} alt="Preview" className="w-full h-36 object-cover rounded-xl" onError={(e) => (e.currentTarget.style.display = "none")} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">URL Video Anteprima</label>
              <input
                value={course.preview_video_url}
                onChange={(e) => updateCourse("preview_video_url", e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="chrome-card p-4 border border-yellow-500/20 bg-yellow-500/5">
              <p className="text-sm text-yellow-400 font-medium mb-1">⚠️ Prima di pubblicare</p>
              <p className="text-xs text-muted-foreground">
                Assicurati che tutti i contenuti rispettino le linee guida della community. Una volta pubblicato, il corso sarà visibile a tutti gli utenti.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-16 left-0 right-0 z-40 glass px-4 py-3 border-t border-border">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={saveDraft}
            disabled={saving}
            className="flex-1 py-3 rounded-xl chrome-card text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salva Bozza"}
          </button>
          {step < 3 ? (
            <button
              onClick={handleNextStep}
              className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 shadow-glow"
            >
              Avanti
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-glow disabled:opacity-60"
            >
              {publishing ? "Pubblicazione..." : "Pubblica Corso 🚀"}
            </button>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
