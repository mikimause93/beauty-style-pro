import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WhatsAppButtonProps {
  userId: string;
  name?: string;
  context?: "stylist" | "booking" | "service" | "product" | "job";
  serviceName?: string;
  className?: string;
  compact?: boolean;
}

export default function WhatsAppButton({ userId, name, context = "service", serviceName, className, compact }: WhatsAppButtonProps) {
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("phone").eq("user_id", userId).maybeSingle()
      .then(({ data }) => { if (data?.phone) setPhone(data.phone); });
  }, [userId]);

  const openWhatsApp = () => {
    if (!phone) { toast.info("Numero WhatsApp non disponibile per questo profilo"); return; }
    const cleanPhone = phone.replace(/\s+/g, "").replace(/^0/, "+39");
    const finalPhone = cleanPhone.startsWith("+") ? cleanPhone : `+39${cleanPhone}`;

    const messages: Record<string, string> = {
      stylist: `Ciao ${name || ""}! Ti ho trovato su STYLE e vorrei prenotare un appuntamento. Puoi indicarmi le tue disponibilità?`,
      booking: `Ciao ${name || ""}! Ho prenotato ${serviceName ? `"${serviceName}" ` : ""}su STYLE. Vorrei confermare i dettagli dell'appuntamento.`,
      service: `Ciao ${name || ""}! Sono interessato/a ai tuoi servizi su STYLE${serviceName ? ` (${serviceName})` : ""}. Possiamo parlarne?`,
      product: `Ciao ${name || ""}! Ho visto un tuo prodotto su STYLE e vorrei maggiori informazioni per l'acquisto.`,
      job: `Ciao ${name || ""}! Ho visto il tuo annuncio di lavoro su STYLE e sono interessato/a. Possiamo parlarne?`,
    };

    const msg = messages[context] || messages.service;
    window.open(`https://wa.me/${finalPhone.replace("+", "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (compact) {
    return (
      <button onClick={openWhatsApp} className={className || "w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center"}>
        <WhatsAppIcon className="w-5 h-5 text-emerald-500" />
      </button>
    );
  }

  return (
    <button onClick={openWhatsApp}
      className={className || "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold"}>
      <WhatsAppIcon className="w-3.5 h-3.5" />
      WhatsApp
    </button>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.634-1.215A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.591-5.934-1.621l-.425-.253-2.748.721.733-2.68-.278-.442A9.78 9.78 0 012.182 12c0-5.415 4.403-9.818 9.818-9.818S21.818 6.585 21.818 12 17.415 21.818 12 21.818z"/>
    </svg>
  );
}
