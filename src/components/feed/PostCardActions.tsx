import { Briefcase, CalendarDays, ShoppingBag, Banknote, MessageCircle as ChatIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface PostCardActionsProps {
  postType: string | null;
  postId: string;
  userId: string;
  userType?: string;
}

export default function PostCardActions({ postType, postId, userId, userType }: PostCardActionsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isJob = postType === "job";
  const isService = (postType === "service" || userType === "professional" || userType === "business") && userType !== "client";
  const isProduct = postType === "product";

  const goAuth = () => { if (!user) { navigate("/auth"); return true; } return false; };

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {isJob && (
        <button onClick={() => { if (goAuth()) return; navigate(`/hr/job/${postId}`); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
          <Briefcase className="w-3 h-3" /> Candidati
        </button>
      )}
      {isService && (
        <button onClick={() => { if (goAuth()) return; navigate(`/booking/${userId}`); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
          <CalendarDays className="w-3 h-3" /> Prenota
        </button>
      )}
      {isProduct && (
        <button onClick={() => navigate(`/shop`)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
          <ShoppingBag className="w-3 h-3" /> Acquista
        </button>
      )}
      {(isJob || isService || isProduct) && (
        <>
          <button onClick={() => { if (goAuth()) return; navigate(`/chat`); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-foreground text-[10px] font-semibold">
            <ChatIcon className="w-3 h-3" /> Chat
          </button>
          <button onClick={() => {
            const phone = ""; // would come from profile
            window.open(`https://wa.me/${phone}`, "_blank");
          }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-semibold">
            WhatsApp
          </button>
        </>
      )}
    </div>
  );
}
