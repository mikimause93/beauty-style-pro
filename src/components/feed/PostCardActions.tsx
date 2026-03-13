import { Briefcase, CalendarDays, ShoppingBag, MessageCircle as ChatIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PostCardActionsProps {
  postType: string | null;
  postId: string;
  userId: string;
  userType?: string;
}

export default function PostCardActions({ postType, postId, userId, userType }: PostCardActionsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phone, setPhone] = useState("");

  const isJob = postType === "job";
  const isService = (postType === "service" || userType === "professional" || userType === "business") && userType !== "client";
  const isProduct = postType === "product";

  // Fetch phone from profile
  useEffect(() => {
    if (isJob || isService || isProduct) {
      supabase.from("profiles").select("phone").eq("user_id", userId).maybeSingle()
        .then(({ data }) => { if (data?.phone) setPhone(data.phone); });
    }
  }, [userId, isJob, isService, isProduct]);

  const goAuth = () => { if (!user) { navigate("/auth"); return true; } return false; };

  const openWhatsApp = () => {
    const cleanPhone = phone.replace(/\s+/g, "").replace(/^0/, "+39");
    const finalPhone = cleanPhone.startsWith("+") ? cleanPhone : `+39${cleanPhone}`;
    const msg = encodeURIComponent("Ciao! Ti ho trovato su STYLE e vorrei maggiori informazioni.");
    window.open(`https://wa.me/${finalPhone.replace("+", "")}?text=${msg}`, "_blank");
  };

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
          <button onClick={openWhatsApp}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold">
            WhatsApp {phone && <span className="opacity-70">{phone}</span>}
          </button>
        </>
      )}
    </div>
  );
}
