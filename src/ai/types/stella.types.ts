// src/ai/types/stella.types.ts

export type StellaActionName =
  | 'open_calendar'
  | 'create_booking'
  | 'open_shop'
  | 'show_stats'
  | 'find_professionals'
  | 'add_to_cart'
  | 'get_revenue'
  | 'get_bookings'
  | 'send_message'
  | 'navigate_to'
  | 'search'
  | 'activate_work_mode';

export interface StellaActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface StellaAction {
  name: StellaActionName;
  result: StellaActionResult;
}

export interface StellaChatResponse {
  response: string;
  actions?: StellaAction[];
  needsConfirmation?: boolean;
}

export interface StellaMessage {
  id: string;
  role: 'user' | 'stella';
  content: string;
  type?: 'text' | 'confirmation' | 'action_result' | 'error';
  actions?: StellaAction[];
  timestamp: Date;
}

export interface StellaMemoryEntry {
  key: string;
  value: unknown;
  timestamp: number;
}

export interface StellaUserMemory {
  userId: string;
  preferences: Record<string, unknown>;
  frequentServices: string[];
  preferredTimes: string[];
  lastInteractions: Array<{ date: string; summary: string }>;
}

export interface StellaContextData {
  currentPage: string;
  userRole?: string;
  userName?: string;
  userId?: string;
  recentActions: string[];
  timestamp: string;
}

export interface StellaFunctionDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface StellaParsedCommand {
  functionName: StellaActionName;
  args: Record<string, unknown>;
}
