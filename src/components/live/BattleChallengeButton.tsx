import { useState } from "react";
import { Swords, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  streamId: string;
  currentProfessionalId?: string;
  currentName?: string;
}

export default function BattleChallengeButton({ streamId, currentProfessionalId, currentName }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProfessionals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("professionals")
      .select("id, business_name, user_id, rating, city")
      .neq("user_id", user?.id || "")
      .order("rating", { ascending: false })
      .limit(20);
    setProfessionals(data || []);
    setLoading(false);
  };

  const openModal = () => {
    setOpen(true);
    fetchProfessionals();
  };

  const challenge = async (pro: any) => {
    if (!user) return;
    const { data, error } = await supabase.from("live_battles").insert({
      stream_id: streamId,
      host_a_id: user.id,
      host_b_id: pro.user_id,
      host_a_name: currentName || "Sfidante A",
      host_b_name: pro.business_name,
      status: "live",
      category: "taglio",
      prize_pool: 100,
    }).select().single();

    if (error) { toast.error("Errore nella creazione della battle"); return; }
    toast.success(`Battle avviata con ${pro.business_name}!`);
    setOpen(false);
    navigate(`/live-battle?id=${(data as any).id}`);
  };

  const filtered = professionals.filter(p =>
    p.business_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <button onClick={openModal} className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
        <Swords className="w-4 h-4 text-destructive" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full glass rounded-t-3xl p-5 pb-10 max-h-[70vh] slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Swords className="w-5 h-5 text-destructive" /> Sfida un Professionista
              </h3>
              <button onClick={() => setOpen(false)}><X className="w-6 h-6 text-muted-foreground" /></button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cerca professionista..."
                className="w-full h-11 rounded-xl bg-card border border-border pl-10 pr-4 text-sm"
              />
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Caricamento...</div>
              ) : filtered.map(pro => (
                <button
                  key={pro.id}
                  onClick={() => challenge(pro)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-destructive/30 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-accent overflow-hidden shrink-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${pro.id}`} alt="" className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{pro.business_name}</p>
                    <p className="text-xs text-muted-foreground">{pro.city || "Italia"} · {pro.rating || 0}</p>
                  </div>
                  <span className="text-xs font-bold text-destructive flex items-center gap-1"><Swords className="w-3 h-3" /> Sfida</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
