/**
 * AutomationCard.tsx — Beauty Style Pro v2.0.0
 * Card per una singola regola di automazione.
 * Mostra trigger, condizioni, azioni e controlli di attivazione/eliminazione.
 */

import { Zap, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { AutomationRule, TriggerType, ActionType } from "@/services/automationService";

const TRIGGER_LABELS: Record<TriggerType, string> = {
  BOOKING_CREATED: "Prenotazione creata",
  BOOKING_CONFIRMED: "Prenotazione confermata",
  BOOKING_REMINDER_24H: "Promemoria 24h prima",
  BOOKING_REMINDER_1H: "Promemoria 1h prima",
  CLIENT_NEARBY: "Cliente nelle vicinanze",
  NEW_FOLLOWER: "Nuovo follower",
  NEW_REVIEW: "Nuova recensione",
  MESSAGE_RECEIVED: "Messaggio ricevuto",
  SHOP_ORDER: "Ordine shop",
};

const ACTION_LABELS: Record<ActionType, string> = {
  send_message: "📩 Invia messaggio",
  send_push_notification: "🔔 Notifica push",
  ai_stella_call: "🤖 Chiama Stella AI",
  share_location: "📍 Condividi posizione",
  confirm_booking: "✅ Conferma prenotazione",
  send_promo: "🎁 Invia promozione",
  add_qrcoin: "🪙 Aggiungi QRCoin",
};

const TRIGGER_COLORS: Record<TriggerType, string> = {
  BOOKING_CREATED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  BOOKING_CONFIRMED: "bg-green-500/10 text-green-400 border-green-500/20",
  BOOKING_REMINDER_24H: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  BOOKING_REMINDER_1H: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  CLIENT_NEARBY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  NEW_FOLLOWER: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  NEW_REVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  MESSAGE_RECEIVED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  SHOP_ORDER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

interface AutomationCardProps {
  rule: AutomationRule;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export default function AutomationCard({ rule, onToggle, onDelete }: AutomationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border rounded-2xl transition-all ${
        rule.active ? "border-purple-500/30 bg-purple-500/5" : "border-border bg-card"
      }`}
    >
      {/* Header riga principale */}
      <div className="flex items-center gap-3 p-4">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            rule.active ? "bg-purple-500/20" : "bg-muted"
          }`}
        >
          <Zap className={`w-4 h-4 ${rule.active ? "text-purple-400" : "text-muted-foreground"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">{rule.name}</p>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                TRIGGER_COLORS[rule.trigger]
              }`}
            >
              {TRIGGER_LABELS[rule.trigger]}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {rule.actions.length} azione{rule.actions.length !== 1 ? "i" : "e"}
            {rule.conditions.length > 0 && ` · ${rule.conditions.length} condizione${rule.conditions.length !== 1 ? "i" : "e"}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle espandi */}
          <button
            type="button"
            aria-label={expanded ? "Comprimi" : "Espandi"}
            onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Toggle attivazione */}
          <button
            type="button"
            aria-label={rule.active ? "Disattiva" : "Attiva"}
            onClick={() => onToggle(rule.id, !rule.active)}
          >
            {rule.active ? (
              <ToggleRight className="w-6 h-6 text-purple-400" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-muted-foreground" />
            )}
          </button>

          {/* Elimina */}
          <button
            type="button"
            aria-label="Elimina regola"
            onClick={() => onDelete(rule.id)}
            className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Dettagli espansi */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          {/* Azioni */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Azioni</p>
            <div className="space-y-1">
              {rule.actions.map((action, i) => (
                <div
                  key={i}
                  className="text-xs bg-muted rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <span>{ACTION_LABELS[action.type]}</span>
                  {action.params.message && (
                    <span className="text-muted-foreground truncate">
                      — "{String(action.params.message).slice(0, 40)}…"
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Condizioni */}
          {rule.conditions.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Condizioni
              </p>
              <div className="space-y-1">
                {rule.conditions.map((cond, i) => (
                  <div
                    key={i}
                    className="text-xs bg-muted rounded-lg px-3 py-2 font-mono"
                  >
                    {cond.field} {cond.operator} {String(cond.value)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date creazione */}
          <p className="text-[10px] text-muted-foreground">
            Creata il{" "}
            {new Date(rule.createdAt).toLocaleDateString("it-IT", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
