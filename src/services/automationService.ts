/**
 * automationService.ts — Beauty Style Pro v2.0.0
 * Rules Engine: trigger → condition → action per professionisti e saloni.
 * Persiste le regole su Supabase (tabella automation_rules).
 */

import { supabase } from "@/integrations/supabase/client";

// ── Tipi ────────────────────────────────────────────────────────────────────

export type TriggerType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_REMINDER_24H"
  | "BOOKING_REMINDER_1H"
  | "CLIENT_NEARBY"
  | "NEW_FOLLOWER"
  | "NEW_REVIEW"
  | "MESSAGE_RECEIVED"
  | "SHOP_ORDER";

export type ConditionOperator = "eq" | "gt" | "lt" | "gte" | "lte" | "contains";

export interface AutomationCondition {
  field: string;          // es. "client.appointment_count"
  operator: ConditionOperator;
  value: unknown;
}

export type ActionType =
  | "send_message"
  | "send_push_notification"
  | "ai_stella_call"
  | "share_location"
  | "confirm_booking"
  | "send_promo"
  | "add_qrcoin";

export interface AutomationAction {
  type: ActionType;
  params: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  ownerId: string;
  name: string;
  active: boolean;
  trigger: TriggerType;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
}

export type NewAutomationRule = Omit<AutomationRule, "id" | "createdAt" | "updatedAt">;

// ── CRUD ────────────────────────────────────────────────────────────────────

/** Recupera tutte le regole dell'utente. */
export async function listAutomationRules(ownerId: string): Promise<AutomationRule[]> {
  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** Crea una nuova regola. */
export async function createAutomationRule(rule: NewAutomationRule): Promise<AutomationRule> {
  const { data, error } = await supabase
    .from("automation_rules")
    .insert({
      owner_id: rule.ownerId,
      name: rule.name,
      active: rule.active,
      trigger: rule.trigger,
      conditions: rule.conditions,
      actions: rule.actions,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

/** Aggiorna una regola esistente. */
export async function updateAutomationRule(
  id: string,
  updates: Partial<Omit<AutomationRule, "id" | "ownerId" | "createdAt" | "updatedAt">>,
): Promise<AutomationRule> {
  const { data, error } = await supabase
    .from("automation_rules")
    .update({
      name: updates.name,
      active: updates.active,
      trigger: updates.trigger,
      conditions: updates.conditions,
      actions: updates.actions,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

/** Elimina una regola. */
export async function deleteAutomationRule(id: string): Promise<void> {
  const { error } = await supabase.from("automation_rules").delete().eq("id", id);
  if (error) throw error;
}

/** Attiva/disattiva una regola. */
export async function toggleAutomationRule(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from("automation_rules")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}

// ── Evaluator ───────────────────────────────────────────────────────────────

/** Valuta tutte le condizioni di una regola rispetto al contesto dato. */
export function evaluateConditions(
  conditions: AutomationCondition[],
  context: Record<string, unknown>,
): boolean {
  return conditions.every(({ field, operator, value }) => {
    const actual = field.split(".").reduce<unknown>((obj, key) => {
      if (obj && typeof obj === "object") return (obj as Record<string, unknown>)[key];
      return undefined;
    }, context);

    switch (operator) {
      case "eq": return actual === value;
      case "gt": return (actual as number) > (value as number);
      case "lt": return (actual as number) < (value as number);
      case "gte": return (actual as number) >= (value as number);
      case "lte": return (actual as number) <= (value as number);
      case "contains":
        return typeof actual === "string" && actual.includes(String(value));
      default:
        return false;
    }
  });
}

// ── Mapper ──────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): AutomationRule {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    name: row.name as string,
    active: row.active as boolean,
    trigger: row.trigger as TriggerType,
    conditions: (row.conditions ?? []) as AutomationCondition[],
    actions: (row.actions ?? []) as AutomationAction[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
