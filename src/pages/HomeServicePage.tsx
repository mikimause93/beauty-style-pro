import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Home, MapPin, Calendar, Clock, CreditCard, MessageCircle, Star, Check, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import stylist2 from "@/assets/stylist-2.jpg";

const mockServices = [
  { id: "1", name: "Taglio Donna a Domicilio", price: 50, duration: 60 },
  { id: "2", name: "Colore + Piega a Domicilio", price: 85, duration: 120 },
  { id: "3", name: "Balayage a Domicilio", price: 150, duration: 150 },
  { id: "4", name: "Piega a Domicilio", price: 35, duration: 45 },
];

const timeSlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export default function HomeServicePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedServiceData = mockServices.find((s) => s.id === selectedService);

  const handleConfirm = async () => {
    if (!user) {
      toast.error("Accedi per prenotare");
      navigate("/auth");
      return;
    }
    if (!address.trim()) {
      toast.error("Inserisci il tuo indirizzo");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("Prenotazione a domicilio confermata! Il professionista verrà da te.");
    setLoading(false);
    navigate("/profile");
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split("T")[0];
  });

  return (
    <MobileLayout>
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-bold flex items-center gap-2">
          <Home className="w-5 h-5 text-accent" /> Servizio a Domicilio
        </h1>
      </header>

      {/* Steps */}
      <div className="flex gap-1 px-4 mt-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? "gradient-primary" : "bg-muted"}`} />
        ))}
      </div>

      <div className="p-4">
        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="space-y-4 fade-in">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <img src={stylist2} alt="" className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <p className="text-sm font-bold">Professionista selezionato</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-gold fill-gold" />
                  <span className="text-xs">4.9</span>
                  <span className="text-xs text-muted-foreground">· Viene a domicilio</span>
                </div>
              </div>
            </div>

            <h2 className="text-sm font-bold mt-4">Scegli il servizio</h2>
            <div className="space-y-2">
              {mockServices.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                    selectedService === s.id ? "bg-primary/10 border-primary border" : "bg-card border border-border"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.duration} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">€{s.price}</p>
                    {selectedService === s.id && <Check className="w-4 h-4 text-primary ml-auto mt-1" />}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => selectedService ? setStep(2) : toast.error("Seleziona un servizio")}
              className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
            >
              Continua →
            </button>
          </div>
        )}

        {/* Step 2: Date, Time & Address */}
        {step === 2 && (
          <div className="space-y-4 fade-in">
            <h2 className="text-sm font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Scegli data e orario</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {dates.map((d) => {
                const date = new Date(d);
                const day = date.toLocaleDateString("it-IT", { weekday: "short" });
                const num = date.getDate();
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`flex-shrink-0 w-16 py-2 rounded-xl text-center transition-all ${
                      selectedDate === d ? "gradient-primary text-primary-foreground" : "bg-card border border-border"
                    }`}
                  >
                    <p className="text-xs uppercase">{day}</p>
                    <p className="text-lg font-bold">{num}</p>
                  </button>
                );
              })}
            </div>

            <h2 className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Orario</h2>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedTime === t ? "gradient-primary text-primary-foreground" : "bg-card border border-border"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <h2 className="text-sm font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Indirizzo di servizio
            </h2>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Via, numero civico, città, CAP..."
              className="w-full h-12 rounded-xl bg-card border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <h2 className="text-sm font-bold flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> Note aggiuntive</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Es: Citofono secondo piano, parcheggio disponibile..."
              className="w-full h-20 rounded-xl bg-card border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />

            <button
              onClick={() => {
                if (!selectedDate || !selectedTime) return toast.error("Seleziona data e orario");
                if (!address.trim()) return toast.error("Inserisci l'indirizzo");
                setStep(3);
              }}
              className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
            >
              Continua →
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4 fade-in">
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" /> Riepilogo Prenotazione
              </h2>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Servizio</span>
                <span className="text-xs font-semibold">{selectedServiceData?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Data</span>
                <span className="text-xs font-semibold">{new Date(selectedDate).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Orario</span>
                <span className="text-xs font-semibold">{selectedTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Durata</span>
                <span className="text-xs font-semibold">{selectedServiceData?.duration} min</span>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold">Indirizzo</p>
                    <p className="text-xs text-muted-foreground">{address}</p>
                  </div>
                </div>
              </div>

              {notes && (
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-secondary mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold">Note</p>
                    <p className="text-xs text-muted-foreground">{notes}</p>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-sm font-bold">Totale</span>
                <div className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4 text-gold" />
                  <span className="text-lg font-bold text-primary">€{selectedServiceData?.price}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Supplemento domicilio incluso nel prezzo
              </p>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-glow"
            >
              {loading ? (
                "Prenotazione in corso..."
              ) : (
                <>
                  <Home className="w-4 h-4" /> Conferma Prenotazione a Domicilio
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
