import { CheckCircle, Download, Calendar, Clock, MapPin, User, CreditCard, Hash } from "lucide-react";

interface ReceiptProps {
  booking: {
    id: string;
    booking_date: string;
    start_time: string;
    total_price: number | null;
    notes: string | null;
    status: string;
  };
  professional: {
    business_name: string;
    city: string | null;
  } | null;
  service: {
    name: string;
    duration_minutes: number;
  } | null;
  clientName: string;
}

export default function BookingReceipt({ booking, professional, service, clientName }: ReceiptProps) {
  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="gradient-primary p-5 text-center">
        <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-display font-bold text-primary-foreground">Prenotazione Confermata</h3>
        <p className="text-xs text-primary-foreground/70 mt-1">Ricevuta di conferma</p>
      </div>

      {/* Details */}
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">ID Prenotazione</p>
            <p className="text-xs font-mono font-medium">{booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="text-sm font-medium">{clientName}</p>
          </div>
        </div>

        {professional && (
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Professionista</p>
              <p className="text-sm font-medium">{professional.business_name}</p>
              {professional.city && <p className="text-[11px] text-muted-foreground">{professional.city}</p>}
            </div>
          </div>
        )}

        {service && (
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Servizio</p>
              <p className="text-sm font-medium">{service.name}</p>
              <p className="text-[11px] text-muted-foreground">{service.duration_minutes} min</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="text-sm font-medium">{new Date(booking.booking_date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Orario</p>
            <p className="text-sm font-medium">{booking.start_time}</p>
          </div>
        </div>

        {booking.notes && (
          <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-0.5">Note:</p>
            {booking.notes}
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">Totale</span>
          <span className="text-xl font-display font-bold text-primary">€{booking.total_price || 0}</span>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground pt-2">
          STYLE · {new Date().toLocaleDateString("it-IT")} · Grazie per la prenotazione!
        </p>
      </div>
    </div>
  );
}
