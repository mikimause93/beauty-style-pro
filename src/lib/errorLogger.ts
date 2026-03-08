import { supabase } from "@/integrations/supabase/client";

type ErrorType = "auth" | "database" | "storage" | "chat" | "payment" | "api" | "realtime" | "ui" | "unknown";
type Severity = "info" | "warn" | "error" | "critical";

interface LogEntry {
  error_type: ErrorType;
  message: string;
  stack?: string;
  user_id?: string;
  page_path?: string;
  metadata?: Record<string, any>;
  severity?: Severity;
}

const logBuffer: LogEntry[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

async function flushLogs() {
  if (logBuffer.length === 0) return;
  const batch = logBuffer.splice(0, logBuffer.length);
  try {
    await (supabase as any).from("error_logs").insert(batch);
  } catch {
    // silently fail — don't cause cascading errors
    console.warn("[ErrorLogger] Failed to flush", batch.length, "logs");
  }
}

function scheduleFlush() {
  if (flushTimeout) return;
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushLogs();
  }, 2000);
}

export function logError(entry: LogEntry) {
  const enriched = {
    ...entry,
    severity: entry.severity || "error",
    page_path: entry.page_path || window.location.pathname,
    metadata: entry.metadata || {},
  };
  console.error(`[${enriched.error_type.toUpperCase()}]`, enriched.message, enriched.metadata);
  logBuffer.push(enriched);
  scheduleFlush();
}

export function logInfo(type: ErrorType, message: string, metadata?: Record<string, any>) {
  logError({ error_type: type, message, severity: "info", metadata });
}

export function logWarn(type: ErrorType, message: string, metadata?: Record<string, any>) {
  logError({ error_type: type, message, severity: "warn", metadata });
}

// Global error handler
export function initGlobalErrorHandler() {
  window.addEventListener("error", (e) => {
    logError({
      error_type: "ui",
      message: e.message,
      stack: e.error?.stack,
      severity: "critical",
      metadata: { filename: e.filename, lineno: e.lineno },
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    logError({
      error_type: "unknown",
      message: String(e.reason?.message || e.reason),
      stack: e.reason?.stack,
      severity: "critical",
    });
  });
}
