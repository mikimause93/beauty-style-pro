import { useEffect, useState } from "react";
import { ArrowLeft, PhoneCall, Sparkles, Clock, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Mode = "off" | "schedule" | "always";

interface Settings {
  mode: Mode;
  schedule: { days: number[]; from: string; to: string; timezone: string };
  greeting_text: string;
  auto_book_enabled: boolean;
  take_message_enabled: boolean;
  transfer_enabled: boolean;
  translation_enabled: boolean;
}

const DAYS = [
  { v: 1, l: "Lun" }, { v: 2, l: "Mar" }, { v: 3, l: "Mer" },
  { v: 4, l: "Gio" }, { v: 5, l: "Ven" }, { v: 6, l: "Sab" }, { v: 0, l: "Dom" },
];

const DEFAULT: Settings = {
  mode: "off",
  schedule: { days: [1, 2, 3, 4, 5], from: "20:00", to: "08:00", timezone: "Europe/Rome" },
  greeting_text: "Ciao, sono Stella, l'assistente AI. Al momento non posso rispondere di persona. Come posso aiutarti?",
  auto_book_enabled: true,
  take_message_enabled: true,
  transfer_enabled: true,
  translation_enabled: true,
};

export default function CallAutoAnswerSettingsPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [s, setS] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("call_auto_answer_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setS({
          mode: data.mode as Mode,
          schedule: (data.schedule as Settings["schedule"]) || DEFAULT.schedule,
          greeting_text: data.greeting_text,
          auto_book_enabled: data.auto_book_enabled,
          take_message_enabled: data.take_message_enabled,
          transfer_enabled: data.transfer_enabled,
          translation_enabled: data.translation_enabled,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("call_auto_answer_settings").upsert({
      user_id: user.id,
      mode: s.mode,
      schedule: s.schedule,
      greeting_text: s.greeting_text,
      auto_book_enabled: s.auto_book_enabled,
      take_message_enabled: s.take_message_enabled,
      transfer_enabled: s.transfer_enabled,
      translation_enabled: s.translation_enabled,
    });
    setSaving(false);
    if (error) toast.error("Errore nel salvataggio");
    else toast.success("Segreteria Stella aggiornata ✨");
  };

  const toggleDay = (d: number) => {
    setS((p) => ({
      ...p,
      schedule: {
        ...p.schedule,
        days: p.schedule.days.includes(d) ? p.schedule.days.filter((x) => x !== d) : [...p.schedule.days, d],
      },
    }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" aria-label="Indietro" onClick={() => nav(-1)} className="text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-primary" /> Segreteria AI Stella
          </h1>
          <p className="text-xs text-muted-foreground">Rispondi alle chiamate anche quando non ci sei</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div className="rounded-2xl border p-4 bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Quando Stella risponde</h2>
          </div>
          {(["off", "schedule", "always"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-label={`Modalità ${m}`}
              onClick={() => setS((p) => ({ ...p, mode: m }))}
              className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                s.mode === m ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <div className="font-medium text-sm">
                {m === "off" && "Disattivata"}
                {m === "schedule" && "Solo fuori orario"}
                {m === "always" && "Sempre (segreteria attiva)"}
              </div>
              <div className="text-muted-foreground mt-0.5">
                {m === "off" && "Le chiamate suonano normalmente."}
                {m === "schedule" && "Stella risponde nei giorni/orari scelti."}
                {m === "always" && "Stella filtra tutte le chiamate in entrata."}
              </div>
            </button>
          ))}
        </div>

        {s.mode === "schedule" && (
          <div className="rounded-2xl border p-4 bg-card space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Fascia oraria</h2>
            </div>
            <div className="flex gap-1 flex-wrap">
              {DAYS.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  aria-label={d.l}
                  onClick={() => toggleDay(d.v)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${
                    s.schedule.days.includes(d.v) ? "bg-primary text-primary-foreground border-primary" : "border-border"
                  }`}
                >
                  {d.l}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Da</Label>
                <Input type="time" value={s.schedule.from} onChange={(e) => setS((p) => ({ ...p, schedule: { ...p.schedule, from: e.target.value } }))} />
              </div>
              <div>
                <Label className="text-xs">A</Label>
                <Input type="time" value={s.schedule.to} onChange={(e) => setS((p) => ({ ...p, schedule: { ...p.schedule, to: e.target.value } }))} />
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border p-4 bg-card space-y-3">
          <Label className="text-xs font-semibold">Saluto di Stella</Label>
          <Textarea rows={3} value={s.greeting_text} onChange={(e) => setS((p) => ({ ...p, greeting_text: e.target.value }))} />
          <p className="text-[10px] text-muted-foreground">Verrà pronunciato con voce naturale ElevenLabs.</p>
        </div>

        <div className="rounded-2xl border p-4 bg-card space-y-3">
          <h2 className="font-semibold text-sm">Cosa può fare Stella durante la chiamata</h2>
          {[
            { k: "auto_book_enabled" as const, t: "Prendere appuntamenti", d: "Crea prenotazioni a nome del chiamante" },
            { k: "take_message_enabled" as const, t: "Lasciare un messaggio", d: "Trascrive il messaggio e te lo invia in chat" },
            { k: "transfer_enabled" as const, t: "Trasferire a te", d: "Se sei disponibile, ti passa la chiamata" },
            { k: "translation_enabled" as const, t: "Traduzione vocale live", d: "Traduce la voce del chiamante nella tua lingua" },
          ].map((row) => (
            <div key={row.k} className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{row.t}</div>
                <div className="text-[11px] text-muted-foreground">{row.d}</div>
              </div>
              <Switch checked={s[row.k]} onCheckedChange={(v) => setS((p) => ({ ...p, [row.k]: v }))} />
            </div>
          ))}
        </div>

        <Button type="button" aria-label="Salva impostazioni" className="w-full" onClick={save} disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> {saving ? "Salvataggio..." : "Salva"}
        </Button>
      </div>
    </div>
  );
}