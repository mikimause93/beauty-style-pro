/**
 * RulesEngine.tsx — Beauty Style Pro v2.0.0
 * UI Rules Engine: lista, crea, attiva/disattiva le automazioni del professionista.
 */

import { useState, useEffect, useCallback } from "react";
import { Plus, Zap, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  AutomationRule,
  TriggerType,
  ActionType,
  listAutomationRules,
  createAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,
} from "@/services/automationService";
import AutomationCard from "./AutomationCard";

const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: "BOOKING_CREATED", label: "Prenotazione creata" },
  { value: "BOOKING_CONFIRMED", label: "Prenotazione confermata" },
  { value: "BOOKING_REMINDER_24H", label: "Promemoria 24h prima" },
  { value: "BOOKING_REMINDER_1H", label: "Promemoria 1h prima" },
  { value: "CLIENT_NEARBY", label: "Cliente nelle vicinanze" },
  { value: "NEW_FOLLOWER", label: "Nuovo follower" },
  { value: "NEW_REVIEW", label: "Nuova recensione" },
  { value: "MESSAGE_RECEIVED", label: "Messaggio ricevuto" },
  { value: "SHOP_ORDER", label: "Ordine shop" },
];

const ACTION_OPTIONS: { value: ActionType; label: string }[] = [
  { value: "send_message", label: "Invia messaggio" },
  { value: "send_push_notification", label: "Notifica push" },
  { value: "confirm_booking", label: "Conferma prenotazione" },
  { value: "send_promo", label: "Invia promozione" },
  { value: "add_qrcoin", label: "Aggiungi QRCoin" },
  { value: "ai_stella_call", label: "Chiama Stella AI" },
];

interface NewRuleForm {
  name: string;
  trigger: TriggerType;
  actionType: ActionType;
  actionMessage: string;
}

const DEFAULT_FORM: NewRuleForm = {
  name: "",
  trigger: "BOOKING_REMINDER_1H",
  actionType: "send_message",
  actionMessage: "",
};

export default function RulesEngine() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewRuleForm>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const loadRules = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await listAutomationRules(user.id);
      setRules(data);
    } catch {
      toast.error("Errore caricamento automazioni");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadRules(); }, [loadRules]);

  const handleCreate = useCallback(async () => {
    if (!user?.id || !form.name.trim()) {
      toast.error("Inserisci un nome per la regola");
      return;
    }
    setIsSaving(true);
    try {
      const rule = await createAutomationRule({
        ownerId: user.id,
        name: form.name.trim(),
        active: true,
        trigger: form.trigger,
        conditions: [],
        actions: [
          {
            type: form.actionType,
            params: form.actionMessage ? { message: form.actionMessage } : {},
          },
        ],
      });
      setRules(prev => [rule, ...prev]);
      setForm(DEFAULT_FORM);
      setShowForm(false);
      toast.success("Automazione creata!");
    } catch {
      toast.error("Errore creazione automazione");
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, form]);

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    try {
      await toggleAutomationRule(id, active);
      setRules(prev => prev.map(r => r.id === id ? { ...r, active } : r));
    } catch {
      toast.error("Errore aggiornamento automazione");
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteAutomationRule(id);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success("Automazione eliminata");
    } catch {
      toast.error("Errore eliminazione automazione");
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold">Automazioni</h2>
          <p className="text-xs text-muted-foreground">
            {rules.filter(r => r.active).length} attive su {rules.length} totali
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(o => !o)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuova
        </button>
      </div>

      {/* Form nuova regola */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Nuova automazione</h3>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); }}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Nome regola (es. Promemoria clienti VIP)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          <div>
            <label className="text-xs text-muted-foreground">Quando (trigger)</label>
            <select
              value={form.trigger}
              onChange={e => setForm(f => ({ ...f, trigger: e.target.value as TriggerType }))}
              className="w-full mt-1 bg-muted rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {TRIGGER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Allora (azione)</label>
            <select
              value={form.actionType}
              onChange={e => setForm(f => ({ ...f, actionType: e.target.value as ActionType }))}
              className="w-full mt-1 bg-muted rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {ACTION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {(form.actionType === "send_message" || form.actionType === "send_push_notification") && (
            <textarea
              placeholder="Testo del messaggio (usa [nome] per il nome del cliente)"
              value={form.actionMessage}
              onChange={e => setForm(f => ({ ...f, actionMessage: e.target.value }))}
              rows={3}
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            />
          )}

          <button
            type="button"
            onClick={handleCreate}
            disabled={isSaving || !form.name.trim()}
            className="w-full py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isSaving ? "Creazione..." : "Crea automazione"}
          </button>
        </div>
      )}

      {/* Lista regole */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nessuna automazione ancora.</p>
          <p className="text-xs opacity-70">Crea la prima per automatizzare il tuo salone!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <AutomationCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
