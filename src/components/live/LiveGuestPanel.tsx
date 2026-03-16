import { useState, useEffect } from "react";
import { Mic, MicOff, X, Check, Clock, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isUniqueViolation } from "@/lib/errorCodes";

interface LiveGuestPanelProps {
  streamId: string;
  isHost: boolean;
  onClose: () => void;
}

interface GuestRequest {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

export default function LiveGuestPanel({ streamId, isHost, onClose }: LiveGuestPanelProps) {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<GuestRequest[]>([]);
  const [myRequest, setMyRequest] = useState<GuestRequest | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
    // Realtime subscription
    const channel = supabase
      .channel(`guests-${streamId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_guests", filter: `stream_id=eq.${streamId}` },
        () => fetchRequests()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("live_guests")
      .select("*")
      .eq("stream_id", streamId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch profiles for each
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enriched = data.map(d => ({ ...d, profile: profileMap.get(d.user_id) }));
      setRequests(enriched);
      if (user) {
        const mine = enriched.find(r => r.user_id === user.id);
        setMyRequest(mine || null);
      }
    }
  };

  const requestJoin = async () => {
    if (!user) { toast.error("Devi effettuare l'accesso"); return; }
    setLoading(true);
    const { error } = await supabase.from("live_guests").insert({
      stream_id: streamId,
      user_id: user.id,
      message: message || null,
      status: "pending",
    });
    if (error) {
      if (isUniqueViolation(error)) toast.error("Hai già inviato una richiesta");
      else toast.error("Errore nell'invio della richiesta");
    } else {
      toast.success("🎤 Richiesta inviata! Attendi l'approvazione del professionista");
    }
    setLoading(false);
  };

  const handleRequest = async (guestId: string, action: "accepted" | "rejected") => {
    const updates: any = { status: action };
    if (action === "accepted") updates.joined_at = new Date().toISOString();
    await supabase.from("live_guests").update(updates).eq("id", guestId);
    toast.success(action === "accepted" ? "✅ Ospite accettato!" : "❌ Richiesta rifiutata");
  };

  const leaveGuest = async () => {
    if (!myRequest) return;
    await supabase.from("live_guests").update({ status: "left", left_at: new Date().toISOString() }).eq("id", myRequest.id);
    toast("Hai lasciato la live come ospite");
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const activeGuests = requests.filter(r => r.status === "accepted");

  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full glass rounded-t-3xl p-5 pb-28 max-h-[70vh] overflow-y-auto slide-up">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" /> {isHost ? "Gestione Ospiti" : "Richiedi di Parlare"}
          </h3>
          <button onClick={onClose}><X className="w-6 h-6 text-muted-foreground" /></button>
        </div>

        {/* Active Guests */}
        {activeGuests.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">🎤 In diretta ora</p>
            <div className="space-y-2">
              {activeGuests.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="relative">
                    <img src={g.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.user_id}`}
                      alt="" className="w-10 h-10 rounded-full border-2 border-primary" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Mic className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{g.profile?.display_name || "Ospite"}</p>
                    <p className="text-[10px] text-primary font-semibold">In diretta 🔴</p>
                  </div>
                  {(isHost || g.user_id === user?.id) && (
                    <button onClick={() => isHost ? handleRequest(g.id, "rejected") : leaveGuest()}
                      className="px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-bold">
                      <MicOff className="w-3 h-3 inline mr-1" /> {isHost ? "Rimuovi" : "Esci"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Host: Pending Requests */}
        {isHost && pendingRequests.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              ⏳ Richieste in attesa ({pendingRequests.length})
            </p>
            <div className="space-y-2">
              {pendingRequests.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                  <img src={g.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${g.user_id}`}
                    alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{g.profile?.display_name || "Utente"}</p>
                    {g.message && <p className="text-[10px] text-muted-foreground truncate">"{g.message}"</p>}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleRequest(g.id, "accepted")}
                      className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </button>
                    <button onClick={() => handleRequest(g.id, "rejected")}
                      className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Viewer: Request to Join */}
        {!isHost && !myRequest && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vuoi parlare con il professionista? Invia una richiesta per entrare nella live come ospite!
            </p>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Messaggio per il professionista (opzionale)"
              className="w-full h-11 rounded-xl bg-card border border-border px-4 text-sm"
            />
            <button
              onClick={requestJoin}
              disabled={loading}
              className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Mic className="w-5 h-5" /> Richiedi di Parlare 🎤
            </button>
          </div>
        )}

        {/* Viewer: Request Status */}
        {!isHost && myRequest && (
          <div className="text-center py-6">
            {myRequest.status === "pending" && (
              <>
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-muted-foreground animate-pulse" />
                </div>
                <p className="font-bold">Richiesta in attesa...</p>
                <p className="text-sm text-muted-foreground mt-1">Il professionista deciderà a breve</p>
              </>
            )}
            {myRequest.status === "accepted" && (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Mic className="w-8 h-8 text-primary" />
                </div>
                <p className="font-bold text-primary">Sei in diretta! 🎤</p>
                <button onClick={leaveGuest} className="mt-3 px-6 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-bold">
                  Esci dalla live
                </button>
              </>
            )}
            {myRequest.status === "rejected" && (
              <>
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <MicOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-bold">Richiesta non accettata</p>
                <p className="text-sm text-muted-foreground mt-1">Potrai riprovare nella prossima live</p>
              </>
            )}
          </div>
        )}

        {/* Empty state for host */}
        {isHost && pendingRequests.length === 0 && activeGuests.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-bold">Nessuna richiesta ancora</p>
            <p className="text-sm text-muted-foreground mt-1">Quando gli spettatori vorranno parlare, le vedrai qui</p>
          </div>
        )}
      </div>
    </div>
  );
}
