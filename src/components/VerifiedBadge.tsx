import { ShieldCheck, BadgeCheck, Building2, Store, Scissors, Stethoscope } from "lucide-react";

interface VerifiedBadgeProps {
  status?: string;
  userType?: string;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
}

const BADGE_CONFIG: Record<string, { label: string; Icon: typeof ShieldCheck }> = {
  business: { label: "Business Verificato", Icon: Building2 },
  professional: { label: "Professionista Verificato", Icon: Scissors },
  clinic: { label: "Clinica Verificata", Icon: Stethoscope },
  shop: { label: "Negozio Verificato", Icon: Store },
};

export default function VerifiedBadge({ status, userType, size = "sm", showLabel = false }: VerifiedBadgeProps) {
  if (status !== "verified") return null;

  const config = BADGE_CONFIG[userType || ""] || { label: "Verificato", Icon: BadgeCheck };
  const Icon = config.Icon;

  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  };

  if (showLabel) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold">
        <Icon className={sizeClasses[size]} />
        {config.label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center" title={config.label}>
      <Icon className={`${sizeClasses[size]} text-primary`} />
    </span>
  );
}
