import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Home, Monitor } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowLeft, Clock, MapPin, Star, CheckCircle } from "lucide-react";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchService();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchService = async () => {
    const { data } = await supabase
      .from("services")
      .select("*, professionals(business_name, city, rating)")
      .eq("id", id!)
      .maybeSingle();
    setService(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (!service) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <p className="text-muted-foreground">Servizio non trovato</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-primary text-sm font-semibold">Indietro</button>
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
        <h1 className="text-lg font-display font-bold truncate">{service.name}</h1>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Category Badge */}
        {service.category && (
          <span className="px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold">
            {service.category}
          </span>
        )}

        {/* Service Name & Price */}
        <div>
          <h2 className="text-2xl font-display font-bold">{service.name}</h2>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-3xl font-bold text-primary">€{service.price}</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{service.duration_minutes} min</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Descrizione</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
          </div>
        )}

        {/* Professional */}
        {service.professionals && (
          <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold">
              {service.professionals.business_name?.[0] || "P"}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{service.professionals.business_name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {service.professionals.city && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{service.professionals.city}</span>}
                {service.professionals.rating > 0 && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-gold fill-gold" />{service.professionals.rating}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Location Options */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Disponibile</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { Icon: Building2, label: "In Salone" },
              { Icon: Home, label: "A Domicilio" },
              { Icon: Monitor, label: "Online" },
            ].map(loc => (
              <div key={loc.label} className="flex flex-col items-center py-3 rounded-xl bg-card border border-border">
                <loc.Icon className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs font-medium text-muted-foreground">{loc.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What's Included */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Cosa include</h3>
          {["Consulenza professionale", "Prodotti premium", "Consigli post-trattamento"].map(item => (
            <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-16 p-4 glass flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Totale</p>
          <p className="text-xl font-bold">€{service.price}</p>
        </div>
        <button
          onClick={() => navigate(`/booking`)}
          className="flex-1 py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-glow"
        >
          Prenota Ora
        </button>
      </div>
    </MobileLayout>
  );
}
