import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ChevronLeft, Plus, Trash2, Video, Eye, GripVertical, Loader2, AlertCircle, Save } from "lucide-react";

const CATEGORIES = ["Capelli", "Unghie", "Makeup", "Skincare", "Sopracciglia", "Massaggio", "Business", "Social Media", "Altro"];
const LEVELS = ["Principiante", "Intermedio", "Avanzato", "Esperto"];

interface LessonItem {
  id?: string;
  tempId: string;
  title: string;
  duration_minutes: string;
  video_url: string;
  is_preview: boolean;
  position: number;
  description: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface CourseForm {
  title: string;
  description: string;
  category: string;
  level: string;
  price: string;
  is_free: boolean;
  thumbnail_url: string;
  is_published: boolean;
}

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseForm>({
    title: "",
    description: "",
    category: "",
    level: "Principiante",
    price: "",
    is_free: true,
    thumbnail_url: "",
    is_published: false,
  });
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"info" | "curriculum">("info");

  useEffect(() => {
    if (id) fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    setLoading(true);
    const [courseRes, lessonsRes] = await Promise.all([
      supabase.from("courses").select("*").eq("id", id!).maybeSingle(),
      supabase.from("lessons").select("*").eq("course_id", id!).order("position"),
    ]);

    if (courseRes.error || !courseRes.data) {
      toast.error("Corso non trovato");
      navigate(-1);
      return;
    }

    const c = courseRes.data as any;
    setCourse({
      title: c.title ?? "",
      description: c.description ?? "",
      category: c.category ?? "",
      level: c.level ?? "Principiante",
      price: c.price?.toString() ?? "",
      is_free: c.is_free ?? true,
      thumbnail_url: c.thumbnail_url ?? "",
      is_published: c.is_published ?? false,
    });

    setLessons(
      ((lessonsRes.data as any[]) ?? []).map((l) => ({
        id: l.id,
        tempId: l.id,
        title: l.title ?? "",
        duration_minutes: l.duration_minutes?.toString() ?? "",
        video_url: l.video_url ?? "",
        is_preview: l.is_preview ?? false,
        position: l.position ?? 1,
        description: l.description ?? "",
        isNew: false,
      }))
    );
    setLoading(false);
  };

  const updateCourse = (field: keyof CourseForm, value: string | boolean) =>
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
        isNew: true,
      },
    ]);
  };

  const updateLesson = (tempId: string, field: keyof LessonItem, value: string | boolean | number) =>
    setLessons((prev) => prev.map((l) => (l.tempId === tempId ? { ...l, [field]: value } : l)));

  const removeLesson = async (lesson: LessonItem) => {
    if (lesson.id && !lesson.isNew) {
      const { error } = await supabase.from("lessons").delete().eq("id", lesson.id);
      if (error) { toast.error("Errore eliminazione lezione"); return; }
    }
    setLessons((prev) => prev.filter((l) => l.tempId !== lesson.tempId).map((l, i) => ({ ...l, position: i + 1 })));
    toast.success("Lezione rimossa");
  };

  const handleSave = async () => {
    if (!user || !id) return;
    if (!course.title.trim()) { toast.error("Il titolo è obbligatorio"); return; }
    setSaving(true);

    try {
      const { error: courseError } = await supabase
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
        .eq("id", id);

      if (courseError) { toast.error("Errore aggiornamento corso"); setSaving(false); return; }

      // Process lessons
      for (const lesson of lessons) {
        if (lesson.isNew && lesson.title.trim()) {
          await supabase.from("lessons").insert({
            course_id: id,
            title: lesson.title,
            duration_minutes: parseInt(lesson.duration_minutes) || null,
            video_url: lesson.video_url || null,
            is_preview: lesson.is_preview,
            position: lesson.position,
            description: lesson.description || null,
            is_published: course.is_published,
          });
        } else if (!lesson.isNew && lesson.id && lesson.title.trim()) {
          await supabase.from("lessons").update({
            title: lesson.title,
            duration_minutes: parseInt(lesson.duration_minutes) || null,
            video_url: lesson.video_url || null,
            is_preview: lesson.is_preview,
            position: lesson.position,
            description: lesson.description || null,
          }).eq("id", lesson.id);
        }
      }

      toast.success("Corso aggiornato con successo!");
    } catch {
      toast.error("Errore durante il salvataggio");
    }
    setSaving(false);
  };

  const handleTogglePublish = async () => {
    if (!id) return;
    const newStatus = !course.is_published;
    const { error } = await supabase.from("courses").update({ is_published: newStatus }).eq("id", id);
    if (error) { toast.error("Errore cambio stato"); return; }
    if (newStatus) {
      await supabase.from("lessons").update({ is_published: true }).eq("course_id", id);
    }
    updateCourse("is_published", newStatus);
    toast.success(newStatus ? "Corso pubblicato!" : "Corso messo in bozza");
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
        <h1 className="font-semibold text-sm flex-1 truncate">Modifica Corso</h1>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${course.is_published ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
          {course.is_published ? "Pubblicato" : "Bozza"}
        </div>
      </div>

      {/* Section tabs */}
      <div className="px-4 flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveSection("info")}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeSection === "info" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
        >
          Informazioni
        </button>
        <button
          onClick={() => setActiveSection("curriculum")}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeSection === "curriculum" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
        >
          Programma ({lessons.length})
        </button>
      </div>

      <div className="px-4 py-4 pb-36 space-y-4">
        {/* Info section */}
        {activeSection === "info" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Titolo *</label>
              <input
                value={course.title}
                onChange={(e) => updateCourse("title", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrizione</label>
              <textarea
                value={course.description}
                onChange={(e) => updateCourse("description", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <select
                  value={course.category}
                  onChange={(e) => updateCourse("category", e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Seleziona</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Livello</label>
                <select
                  value={course.level}
                  onChange={(e) => updateCourse("level", e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                >
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
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
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">URL Copertina</label>
              <input
                value={course.thumbnail_url}
                onChange={(e) => updateCourse("thumbnail_url", e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary transition-colors"
              />
              {course.thumbnail_url && (
                <img src={course.thumbnail_url} alt="" className="w-full h-36 object-cover rounded-xl" onError={(e) => (e.currentTarget.style.display = "none")} />
              )}
            </div>
          </>
        )}

        {/* Programma section */}
        {activeSection === "curriculum" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{lessons.length} lezioni totali</p>
              <button
                onClick={addLesson}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Aggiungi
              </button>
            </div>

            {lessons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nessuna lezione</p>
              </div>
            ) : (
              lessons.map((lesson) => (
                <div key={lesson.tempId} className={`chrome-card p-4 space-y-3 ${lesson.isNew ? "border-primary/30" : ""}`}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground flex-1">
                      Lezione {lesson.position} {lesson.isNew && <span className="text-primary">• Nuova</span>}
                    </span>
                    <button onClick={() => removeLesson(lesson)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
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
                      className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary"
                    />
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs flex-1">Preview</span>
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
                    placeholder="URL video"
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-16 left-0 right-0 z-40 glass px-4 py-3 border-t border-border">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={handleTogglePublish}
            className={`py-3 px-4 rounded-xl text-sm font-medium border transition-colors ${
              course.is_published
                ? "border-destructive/50 text-destructive hover:bg-destructive/10"
                : "border-green-500/50 text-green-400 hover:bg-green-500/10"
            }`}
          >
            {course.is_published ? "Togli Pubblica" : "Pubblica"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 shadow-glow disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvataggio..." : "Salva Modifiche"}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
