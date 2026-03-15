import { Heart, MessageCircle, Share2, Bookmark, MapPin, Euro, Briefcase, Clock, Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface FeedJobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    category: string;
    employment_type: string;
    location: string;
    salary_min?: number | null;
    salary_max?: number | null;
    required_skills?: string[] | null;
    created_at: string;
    professionals?: { business_name: string; city?: string | null } | null;
    businesses?: { business_name: string; logo_url?: string | null } | null;
  };
}

const typeLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
  internship: "Stage",
  contract: "Contratto",
};

export default function FeedJobCard({ job }: FeedJobCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 30) + 5);
  const [saved, setSaved] = useState(false);

  const employer = job.businesses || job.professionals;
  const employerName = employer?.business_name || "Anonimo";

  const formatTimeAgo = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}g`;
  };

  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      {/* Header with JOB badge */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
          {employerName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{employerName}</p>
            <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Briefcase className="w-2.5 h-2.5" /> Lavoro
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{formatTimeAgo(job.created_at)} · {job.location}</p>
        </div>
      </div>

      {/* Job Content */}
      <div className="px-4 pb-3">
        <h3 className="font-bold text-base mb-1">{job.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{job.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
            {job.category}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" /> {typeLabels[job.employment_type] || job.employment_type}
          </span>
          {job.salary_min && (
            <span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-[10px] font-semibold flex items-center gap-1">
              <Euro className="w-3 h-3" /> {job.salary_min}€{job.salary_max ? ` - ${job.salary_max}€` : "+"}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {job.location}
          </span>
        </div>

        {/* Skills */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {job.required_skills.slice(0, 4).map((skill, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full border border-border text-[10px] text-muted-foreground">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* CANDIDATI button — prominent */}
        <button
          onClick={() => {
            if (!user) { navigate("/auth"); return; }
            navigate(`/hr/job/${job.id}`);
          }}
          className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 mb-3 shadow-glow"
        >
          <Send className="w-4 h-4" /> Candidati Ora
        </button>
      </div>

      {/* Actions — like, comment, share, save */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <button onClick={() => { setLiked(!liked); setLikeCount(prev => prev + (liked ? -1 : 1)); }} className="flex items-center gap-1.5 group">
            <Heart className={`w-[22px] h-[22px] transition-all duration-200 ${liked ? "text-primary fill-primary scale-110" : "text-muted-foreground group-hover:text-foreground"}`} />
            <span className="text-xs font-medium text-muted-foreground">{likeCount}</span>
          </button>
          <button onClick={() => navigate(`/hr/job/${job.id}`)} className="flex items-center gap-1.5 group">
            <MessageCircle className="w-[22px] h-[22px] text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-xs font-medium text-muted-foreground">Commenta</span>
          </button>
          <button className="group">
            <Share2 className="w-[22px] h-[22px] text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          <div className="flex-1" />
          <button onClick={() => setSaved(!saved)}>
            <Bookmark className={`w-[22px] h-[22px] transition-all duration-200 ${saved ? "text-primary fill-primary" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
