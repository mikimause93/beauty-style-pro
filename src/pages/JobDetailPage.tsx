import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { aiJobMatch } from "@/lib/ai";
import MobileLayout from "@/components/layout/MobileLayout";
import ShareMenu from "@/components/ShareMenu";
import { ArrowLeft, MapPin, Clock, Briefcase, DollarSign, Star, Send, CheckCircle2, MessageCircle, Share2, Sparkles, Eye as EyeIcon, FileText, Lightbulb, Phone } from "lucide-react";
import { toast } from "sonner";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  const fetchJob = async () => {
    const { data } = await supabase
      .from("job_posts")
      .select("*, professionals(business_name, city, rating, user_id), businesses(business_name, city, logo_url, rating, user_id)")
      .eq("id", id!)
      .single();
    setJob(data);
    if (user) {
      const { data: existing } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_post_id", id!)
        .eq("applicant_id", user.id)
        .maybeSingle();
      setAlreadyApplied(!!existing);
    }
    if (data) {
      await supabase.from("job_posts").update({ view_count: (data.view_count || 0) + 1 }).eq("id", id!);
    }
    setLoading(false);
  };

  const handleApply = async () => {
    if (!user) { navigate("/auth"); return; }
    setApplying(true);
    const userSkills = profile?.skills || [];
    const requiredSkills = job?.required_skills || [];
    const exp = profile?.experience_years || 0;

    // Try AI analysis first
    let matchScore = 0;
    let analysis: any = {};
    try {
      const aiResult = await aiJobMatch(userSkills, exp, requiredSkills, job?.description || "");
      matchScore = aiResult?.matchScore || 0;
      analysis = aiResult || {};
      setAiAnalysis(aiResult);
    } catch {
      // Fallback to basic matching
      if (requiredSkills.length > 0 && userSkills.length > 0) {
        const matching = userSkills.filter((s: string) =>
          requiredSkills.some((r: string) => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase()))
        );
        matchScore = Math.round((matching.length / requiredSkills.length) * 100);
      }
      matchScore = Math.min(100, matchScore + Math.min(exp * 10, 30));
      analysis = { skillsMatch: matchScore, experienceYears: exp };
    }

    const { error } = await supabase.from("job_applications").insert({
      job_post_id: id,
      applicant_id: user.id,
      cover_letter: coverLetter || null,
      cv_url: profile?.cv_url || null,
      portfolio_urls: profile?.portfolio_urls || [],
      ai_match_score: matchScore,
      ai_recommended: matchScore >= 60,
      ai_analysis: analysis,
    });

    if (error) {
      if (error.code === "23505") toast.error("Hai già inviato la candidatura");
      else toast.error(error.message);
    } else {
      await supabase.from("job_posts").update({ application_count: (job.application_count || 0) + 1 }).eq("id", id!);
      setAlreadyApplied(true);
      setShowApplyForm(false);
      toast.success("Candidatura inviata!");
    }
    setApplying(false);
  };

  const handleWhatsAppApply = () => {
    const employer = job?.businesses || job?.professionals;
    const name = employer?.business_name || "Datore";
    const text = encodeURIComponent(
      `Ciao ${name}! Mi candido per la posizione "${job?.title}" trovata su Style App. Ecco il mio profilo: ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleChatApply = () => {
    navigate("/chat/1"); // Opens chat with employer
    toast.success("Aperta chat diretta con il datore di lavoro");
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (!job) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <p className="text-muted-foreground">Annuncio non trovato</p>
          <button onClick={() => navigate("/hr")} className="mt-4 text-primary text-sm font-semibold">Torna agli annunci</button>
        </div>
      </MobileLayout>
    );
  }

  const employer = job.businesses || job.professionals;
  const employerName = employer?.business_name || "Anonimo";
  const typeLabels: Record<string, string> = {
    full_time: "Full-time", part_time: "Part-time", freelance: "Freelance",
    internship: "Stage", contract: "Contratto",
  };

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold truncate flex-1">{job.title}</h1>
        <button onClick={() => setShowShare(true)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <Share2 className="w-4 h-4" />
        </button>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Employer card */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
              {employerName[0]}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">{employerName}</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> {job.location}
                {employer?.rating > 0 && (<><Star className="w-3 h-3 text-gold fill-gold" /> {employer.rating}</>)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{job.category}</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              <Briefcase className="w-3 h-3 inline mr-1" />{typeLabels[job.employment_type] || job.employment_type}
            </span>
            {job.salary_min && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                <DollarSign className="w-3 h-3 inline" />{job.salary_min}€{job.salary_max ? ` - ${job.salary_max}€` : "+"}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-semibold text-sm mb-2">Descrizione</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Skills */}
        {job.required_skills?.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Competenze richieste</h3>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-muted font-medium">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        {job.benefits?.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Benefit</h3>
            <div className="space-y-1.5">
              {job.benefits.map((b: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> {b}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><EyeIcon className="w-3 h-3" /> {job.view_count || 0} visualizzazioni</span>
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {job.application_count || 0} candidature</span>
        </div>

        {/* Apply form */}
        {showApplyForm && !alreadyApplied && (
          <div className="p-4 rounded-2xl bg-card border border-primary/30 space-y-3">
            <h3 className="font-semibold text-sm">La tua candidatura</h3>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Perché sei il candidato ideale? (opzionale)"
              rows={4}
              className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {profile?.cv_url ? (
              <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> CV già caricato nel profilo</p>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Puoi caricare il CV nelle impostazioni profilo</p>
            )}

            {/* Multiple apply methods */}
            <div className="space-y-2">
              <button
                onClick={handleApply}
                disabled={applying}
                className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {applying ? "Invio..." : <><Send className="w-4 h-4" /> Invia Candidatura</>}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleChatApply}
                  className="flex-1 h-10 rounded-xl bg-card border border-border font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4 text-primary" /> Via Chat
                </button>
                <button
                  onClick={handleWhatsAppApply}
                  className="flex-1 h-10 rounded-xl bg-green-600 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-4 h-4" /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {!showApplyForm && (
        <div className="sticky bottom-16 p-4 glass">
          {alreadyApplied ? (
            <div className="h-12 rounded-xl bg-green-500/10 text-green-600 font-semibold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Candidatura inviata
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => user ? setShowApplyForm(true) : navigate("/auth")}
                className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-glow flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Candidati Ora
              </button>
              <div className="flex gap-2">
                <button onClick={handleChatApply} className="flex-1 h-10 rounded-xl bg-card border border-border font-semibold text-xs flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-primary" /> Chat Diretta
                </button>
                <button onClick={handleWhatsAppApply} className="flex-1 h-10 rounded-xl bg-green-600 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5">
                  <Phone className="w-4 h-4" /> WhatsApp
                </button>
                <button onClick={() => setShowShare(true)} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Share Menu */}
      {showShare && (
        <ShareMenu
          title={`${job.title} - ${employerName}`}
          description={`${job.category} · ${job.location} · ${typeLabels[job.employment_type] || job.employment_type}`}
          onClose={() => setShowShare(false)}
          onChatShare={handleChatApply}
        />
      )}
    </MobileLayout>
  );
}
