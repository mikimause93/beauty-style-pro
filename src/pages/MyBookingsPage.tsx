import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Calendar, Clock, ChevronRight } from "lucide-react";

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    if (user) fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*, professionals(business_name), services(name, price)")
      .eq("client_id", user!.id)
      .order("booking_date", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = bookings.filter(b => b.booking_date >= today && b.status !== "cancelled");
  const past = bookings.filter(b => b.booking_date < today || b.status === "cancelled");

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-500",
    confirmed: "bg-emerald-500/15 text-emerald-500",
    completed: "bg-primary/15 text-primary",
    cancelled: "bg-destructive/15 text-destructive",
  };

  const items = tab === "upcoming" ? upcoming : past;

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Le Mie Prenotazioni</h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-3">
        {(["upcoming", "past"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t === "upcoming" ? "Prossime" : "Passate"}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {tab === "upcoming" ? "Nessuna prenotazione in programma" : "Nessuna prenotazione passata"}
            </p>
            <button
              onClick={() => navigate("/stylists")}
              className="mt-4 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold"
            >
              Prenota Ora
            </button>
          </div>
        ) : (
          items.map(b => (
            <button
              key={b.id}
              onClick={() => navigate(`/my-bookings/${b.id}`)}
              className="w-full text-left p-4 rounded-2xl bg-card border border-border flex items-center gap-3 hover:bg-muted/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{b.services?.name || "Servizio"}</p>
                <p className="text-xs text-muted-foreground">{b.professionals?.business_name || "Professionista"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {b.booking_date}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {b.start_time}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColors[b.status] || statusColors.pending}`}>
                  {b.status}
                </span>
                <span className="text-sm font-bold text-primary">€{b.total_price || b.services?.price || 0}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </div>
    </MobileLayout>
  );
}
