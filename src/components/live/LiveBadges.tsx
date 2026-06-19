import { Crown, Eye, Users, MessageCircle, Flame, Shield } from "lucide-react";

interface LiveBadgesProps {
  badges: string[];
}

const BADGE_CONFIG: Record<string, { icon: React.ReactNode; label: string; gradient: string }> = {
  moderator: {
    icon: <Shield className="w-3.5 h-3.5" />,
    label: "Moderatore",
    gradient: "from-teal-500 to-cyan-500",
  },
  top_contributor: {
    icon: <Crown className="w-3.5 h-3.5" />,
    label: "Top Contributor",
    gradient: "from-yellow-500 to-amber-500",
  },
  active_viewer: {
    icon: <Eye className="w-3.5 h-3.5" />,
    label: "Active Viewer",
    gradient: "from-blue-500 to-cyan-500",
  },
  inviter: {
    icon: <Users className="w-3.5 h-3.5" />,
    label: "Inviter",
    gradient: "from-green-500 to-emerald-500",
  },
  chatter: {
    icon: <MessageCircle className="w-3.5 h-3.5" />,
    label: "Chatter",
    gradient: "from-purple-500 to-pink-500",
  },
  streak: {
    icon: <Flame className="w-3.5 h-3.5" />,
    label: "On Fire",
    gradient: "from-orange-500 to-red-500",
  },
};

export default function LiveBadges({ badges }: LiveBadgesProps) {
  if (!badges.length) return null;

  return (
    <div className="flex gap-1.5 flex-wrap">
      {badges.map(badge => {
        const config = BADGE_CONFIG[badge];
        if (!config) return null;
        return (
          <span
            key={badge}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${config.gradient}`}
          >
            {config.icon}
            {config.label}
          </span>
        );
      })}
    </div>
  );
}
