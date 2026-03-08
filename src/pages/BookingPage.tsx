import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Star, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import stylist2 from "@/assets/stylist-2.jpg";

const services = [
  { id: "1", name: "Taglio Donna", price: 35, duration: 45 },
  { id: "2", name: "Colore + Piega", price: 65, duration: 90 },
  { id: "3", name: "Balayage", price: 120, duration: 120 },
  { id: "4", name: "Piega", price: 25, duration: 30 },
  { id: "5", name: "Trattamento Keratina", price: 80, duration: 60 },
];

const locationOptions = [
  { id: "center", label: "In Salone", icon: "🏢" },
  { id: "home", label: "A Domicilio", icon: "🏠" },
  { id: "online", label: "Online", icon: "💻" },
];

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

const colorOptions = ["Sportivo", "Klav", "Neon"];

export default function BookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("Sportivo");
  const [selectedLocation, setSelectedLocation] = useState("center");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  const handleConfirm = async () => {
    if (!user) {
      toast.error("Devi effettuare l'accesso per prenotare");
      navigate("/auth");
      return;
    }
    if (!selectedService || !selectedTime) {
      toast.error("Seleziona servizio e orario");
      return;
    }

    setLoading(true);
    // For demo, we use a placeholder professional_id
    // In production this would come from the stylist profile page
    const { error } = await supabase.from("bookings").insert({
      client_id: user.id,
      professional_id: "00000000-0000-0000-0000-000000000000", // placeholder
      booking_date: selectedDate,
      start_time: selectedTime,
      total_price: services.find(s => s.id === selectedService)?.price,
      notes,
    });

    if (error) {
      toast.error("Errore nella prenotazione");
    } else {
      setConfirmed(true);
      toast.success("Prenotazione confermata! ✨");
    }
    setLoading(false);
  };

  if (confirmed) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center fade-in">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Prenotazione Confermata!</h2>
          <p className="text-muted-foreground mb-6">
            {services.find(s => s.id === selectedService)?.name} · {selectedDate} alle {selectedTime}
          </p>
          <button onClick={() => navigate("/")} className="px-6 py-3 rounded-full gradient-primary text-primary-foreground font-semibold">
            Torna alla Home
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold">Booking Appointment</h1>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Stylist Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card">
          <img src={stylist2} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-primary" />
          <div className="flex-1">
            <p className="font-semibold">Martina Rossi</p>
            <p className="text-xs text-muted-foreground">💇‍♀️ Hairstylist · Milano</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 text-gold fill-gold" />
              <span className="text-xs font-semibold">4.9</span>
              <span className="text-xs text-muted-foreground">(127 reviews)</span>
            </div>
          </div>
        </div>

        {/* Color Tabs */}
        <div className="flex gap-2">
          {colorOptions.map(c => (
            <button
              key={c}
              onClick={() => setSelectedColor(c)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedColor === c ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Services */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Seleziona Servizio
          </h3>
          <div className="space-y-2">
            {services.map(service => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedService === service.id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-card hover:bg-muted"
                }`}
              >
                <div className="text-left">
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.duration} min</p>
                </div>
                <span className="text-sm font-bold text-primary">€{service.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <CalendarIcon className="w-4 h-4 inline mr-1" /> Seleziona Data
          </h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {dates.map(date => {
              const dateStr = date.toISOString().split("T")[0];
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center min-w-[52px] py-2 px-2 rounded-xl transition-all ${
                    isSelected ? "gradient-primary text-primary-foreground" : "bg-card"
                  }`}
                >
                  <span className="text-[10px] font-medium">{dayNames[date.getDay()]}</span>
                  <span className="text-lg font-bold">{date.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selection */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Clock className="w-4 h-4 inline mr-1" /> Seleziona Orario
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedTime === time
                    ? "gradient-primary text-primary-foreground"
                    : "bg-card hover:bg-muted"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Note aggiuntive (opzionale)..."
            rows={2}
            className="w-full rounded-xl bg-card border border-border p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Summary & Confirm */}
        {selectedService && selectedTime && (
          <div className="rounded-2xl gradient-card border border-border p-4 shadow-card slide-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Totale</span>
              <span className="text-xl font-bold text-gradient-primary">
                €{services.find(s => s.id === selectedService)?.price}
              </span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold shadow-glow disabled:opacity-50"
            >
              {loading ? "Confermando..." : "Confirm Booking"}
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
