import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import beauty1 from "@/assets/beauty-1.jpg";
import beauty2 from "@/assets/beauty-2.jpg";
import stylist1 from "@/assets/stylist-1.jpg";

const fallbackEvents = [
  {
    id: "1", title: "Workshop Balayage Pro",
    description: "Impara le tecniche avanzate di balayage con i migliori professionisti del settore",
    event_type: "workshop", cover_image: beauty1,
    start_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 7 * 86400000 + 10800000).toISOString(),
    is_online: true, max_participants: 50, price: 29.99, status: "scheduled", participant_count: 23,
  },
  {
    id: "2", title: "Masterclass Colore Avanzato",
    description: "Tecniche di colorazione professionale con Martina Rossi",
    event_type: "masterclass", cover_image: beauty2,
    start_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 14 * 86400000 + 7200000).toISOString(),
    is_online: false, max_participants: 30, price: 49.99, status: "scheduled", participant_count: 18,
  },
  {
    id: "3", title: "Live Q&A: Beauty Trends 2026",
    description: "Scopri le ultime tendenze beauty con i top stylist italiani",
    event_type: "q_and_a", cover_image: stylist1,
    start_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 3 * 86400000 + 3600000).toISOString(),
    is_online: true, max_participants: 100, price: 0, status: "scheduled", participant_count: 67,
  },
];

const typeLabels: Record<string, string> = {
  workshop: "Workshop", masterclass: "Masterclass", webinar: "Webinar", live_demo: "Live Demo", q_and_a: "Q&A",
};
const typeColors: Record<string, string> = {
  workshop: "bg-primary/20 text-primary", masterclass: "bg-secondary/20 text-secondary",
  webinar: "bg-gold/20 text-gold", live_demo: "bg-live/20 text-live", q_and_a: "bg-success/20 text-success",
};
const coverFallbacks = [beauty1, beauty2, stylist1];

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState(fallbackEvents);
  const [joinedEvents, setJoinedEvents] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState("Tutti");

  useEffect(() => {
    loadEvents();
    if (user) loadMyParticipations();
  }, [user]);

  const loadEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("status", ["scheduled", "live"])
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });
    if (data && data.length > 0) {
      setEvents(data.map((e, i) => ({ ...e, cover_image: e.cover_image || coverFallbacks[i % 3] })));
    }
  };

  const loadMyParticipations = async () => {
    const { data } = await supabase
      .from("event_participants")
      .select("event_id")
      .eq("user_id", user!.id);
    if (data) setJoinedEvents(data.map(d => d.event_id));
  };

  const handleJoin = async (eventId: string) => {
    if (!user) { toast.error("Devi effettuare l'accesso"); navigate("/auth"); return; }
    if (joinedEvents.includes(eventId)) {
      // Leave event
      await supabase.from("event_participants").delete().eq("event_id", eventId).eq("user_id", user.id);
      setJoinedEvents(prev => prev.filter(id => id !== eventId));
      toast.info("Iscrizione annullata");
      return;
    }
    const { error } = await supabase.from("event_participants").insert({ event_id: eventId, user_id: user.id });
    if (error) { toast.error("Errore nell'iscrizione"); return; }
    setJoinedEvents(prev => [...prev, eventId]);
    toast.success("Ti sei iscritto all'evento! 🎉");
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  const filters = ["Tutti", "Workshop", "Masterclass", "Q&A", "Live Demo"];
  const filteredEvents = activeFilter === "Tutti"
    ? events
    : events.filter(e => typeLabels[e.event_type]?.toLowerCase() === activeFilter.toLowerCase());

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Eventi & Workshop</h1>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map(tab => (
            <button key={tab} onClick={() => setActiveFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === tab ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {filteredEvents.map((event, i) => (
          <div key={event.id} className="rounded-2xl overflow-hidden bg-card shadow-card fade-in">
            <div className="relative aspect-video">
              <img src={typeof event.cover_image === "string" && event.cover_image.startsWith("http") ? event.cover_image : coverFallbacks[i % 3]}
                alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${typeColors[event.event_type] || "bg-muted text-muted-foreground"}`}>
                  {typeLabels[event.event_type] || event.event_type}
                </span>
              </div>
              {event.is_online && (
                <div className="absolute top-3 right-3 flex items-center gap-1 glass px-2 py-1 rounded-full">
                  <Video className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-medium">Online</span>
                </div>
              )}
              {Number(event.price) === 0 && (
                <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-success text-primary-foreground text-[10px] font-bold">GRATIS</div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-display font-bold text-base mb-1">{event.title}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="w-3.5 h-3.5" /><span>{formatDate(event.start_date)}</span></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" /><span>{formatTime(event.start_date)} - {formatTime(event.end_date)}</span></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="w-3.5 h-3.5" /><span>{event.participant_count}/{event.max_participants} partecipanti</span></div>
              </div>
              <div className="flex items-center justify-between">
                {Number(event.price) > 0 && <span className="text-lg font-bold text-gradient-primary">€{Number(event.price).toFixed(2)}</span>}
                <button onClick={() => handleJoin(event.id)}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    joinedEvents.includes(event.id)
                      ? "bg-success/20 text-success"
                      : "gradient-primary text-primary-foreground shadow-glow hover:scale-105"
                  }`}>
                  {joinedEvents.includes(event.id) ? "✓ Iscritto" : "Iscriviti"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MobileLayout>
  );
}
