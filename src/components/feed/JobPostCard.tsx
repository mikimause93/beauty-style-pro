import { MapPin, Briefcase, DollarSign, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface JobPostCardProps {
  job: {
    id: string;
    title: string;
    category: string;
    employment_type: string;
    location: string;
    salary_min?: number | null;
    salary_max?: number | null;
    required_skills?: string[];
    application_count?: number | null;
    created_at: string;
    professionals?: { business_name: string } | null;
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

export default function JobPostCard({ job }: JobPostCardProps) {
  const navigate = useNavigate();
  const employer = job.businesses || job.professionals;
  const employerName = employer?.business_name || "Anonimo";

  return (
    <button
      onClick={() => navigate(`/hr/job/${job.id}`)}
      className="w-full text-left p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
          {employerName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm truncate">{job.title}</h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground">{employerName}</p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
              {typeLabels[job.employment_type] || job.employment_type}
            </span>
            {job.salary_min && (
              <span className="text-xs text-green-600 font-medium">
                {job.salary_min}€{job.salary_max ? `-${job.salary_max}€` : "+"}
              </span>
            )}
          </div>

          {job.required_skills && job.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {job.required_skills.slice(0, 3).map((skill, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                  {skill}
                </span>
              ))}
              {job.required_skills.length > 3 && (
                <span className="text-xs text-muted-foreground">+{job.required_skills.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
