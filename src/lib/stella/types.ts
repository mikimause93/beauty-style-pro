export type RateLimitKey = 'likes' | 'comments' | 'messages' | 'follows';

export const RATE_LIMITS = {
  per_hour: { likes: 30, comments: 10, messages: 20, follows: 15 },
  per_day:  { likes: 200, comments: 50, messages: 100, follows: 50 },
  cooldown_ms: 2000,
} as const;

export const CONFIRM_REQUIRED = new Set<string>(['message', 'book', 'comment']);

export interface CommandResult {
  matched: boolean;
  response: string;
  action?: string;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  executeConfirmed?: () => Promise<string>;
  scheduled?: boolean;
}

export interface ScheduledAction {
  id: string;
  description: string;
  scheduledAt: number;
  command: string;
  status: 'pending' | 'executed' | 'cancelled' | 'failed';
}

export type PersonaType = 'creator' | 'professional' | 'shopper' | 'explorer' | 'influencer';

export interface DNAProfile {
  userId: string;
  favoriteRoutes: string[];
  communicationStyle: 'casual' | 'formal';
  activeHours: number[];
  interests: string[];
  persona: PersonaType;
  recentCommands: string[];
  totalInteractions: number;
  customShortcuts: Record<string, string>;
}

export interface StellaEvent {
  type: 'command' | 'navigation' | 'like' | 'comment' | 'search' | 'booking' | 'follow';
  data: Record<string, unknown>;
  pagePath?: string;
}

export interface PendingConfirmation {
  id: string;
  prompt: string;
  execute: () => Promise<string>;
}
