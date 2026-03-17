/**
 * Shared ChatMsg type used by AIChatContext, AIChatMessages and AIAssistantPage.
 * Extended with fields required for real-time sync, multi-role support and
 * future voice/media messages.
 */
export interface ChatMsg {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  /** Unix timestamp (ms) when the message was created */
  createdAt: number;
  status?: "sending" | "sent" | "error";
  type?: "text" | "voice" | "image";
  userId?: string;
}
