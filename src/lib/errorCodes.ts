/**
 * Sistema centralizzato di codici e messaggi di errore (in italiano).
 *
 * Postgres error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
 * PostgREST error codes: PGRST*
 * Supabase Auth error codes: from supabase-js messages
 */

// ─── Postgres / PostgREST error codes ──────────────────────────────────────

/** Unique constraint violation (e.g. duplicate insert) */
export const PG_UNIQUE_VIOLATION = "23505";
/** Foreign key constraint violation */
export const PG_FK_VIOLATION = "23503";
/** Not-null constraint violation */
export const PG_NOT_NULL_VIOLATION = "23502";
/** Check constraint violation */
export const PG_CHECK_VIOLATION = "23514";
/** PostgREST: query returned 0 rows when exactly 1 was expected (.single()) */
export const PGRST_NO_ROWS = "PGRST116";
/** PostgREST: multiple rows returned when exactly 1 was expected */
export const PGRST_MULTIPLE_ROWS = "PGRST100";

// ─── Postgres code → Italian message ───────────────────────────────────────

const PG_CODE_MESSAGES: Record<string, string> = {
  [PG_UNIQUE_VIOLATION]: "Elemento già presente. Non è possibile aggiungere duplicati.",
  [PG_FK_VIOLATION]: "Riferimento non valido. L'elemento correlato non esiste.",
  [PG_NOT_NULL_VIOLATION]: "Campo obbligatorio mancante.",
  [PG_CHECK_VIOLATION]: "Valore non consentito dal sistema.",
  [PGRST_NO_ROWS]: "Nessun risultato trovato.",
  [PGRST_MULTIPLE_ROWS]: "Errore interno: risultati ambigui.",
};

// ─── Supabase Auth error messages → Italian ────────────────────────────────

/**
 * Translates a Supabase Auth error message (in English) to Italian.
 * Falls back to the original message if no mapping is found.
 */
export function localizeAuthError(message: string): string {
  if (!message) return "Errore sconosciuto";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid email or password"))
    return "Credenziali non valide. Controlla email e password.";
  if (m.includes("email not confirmed"))
    return "Email non confermata. Controlla la tua casella di posta.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Questo indirizzo email è già registrato.";
  if (m.includes("password should be at least"))
    return "La password deve essere di almeno 6 caratteri.";
  if (m.includes("unable to validate email address"))
    return "Indirizzo email non valido.";
  if (m.includes("too many requests") || m.includes("rate limit"))
    return "Troppe richieste. Riprova tra qualche minuto.";
  if (m.includes("network") || m.includes("fetch"))
    return "Errore di rete. Controlla la connessione.";
  if (m.includes("expired") || m.includes("token"))
    return "Sessione scaduta. Effettua nuovamente l'accesso.";
  return message;
}

// ─── Database / generic error localization ─────────────────────────────────

/**
 * Translates a Supabase/Postgres error object (or plain message string) to an
 * Italian message suitable for display to the user.
 *
 * @param error - The error object from a Supabase query (`{ code, message }`)
 *                or a plain string message.
 * @param fallback - Optional fallback Italian message when no mapping is found.
 */
export function localizeDbError(
  error: { code?: string; message?: string } | string | null | undefined,
  fallback = "Si è verificato un errore. Riprova più tardi."
): string {
  if (!error) return fallback;

  const code = typeof error === "object" ? error.code : undefined;
  const message = typeof error === "object" ? (error.message ?? "") : error;

  if (code && PG_CODE_MESSAGES[code]) return PG_CODE_MESSAGES[code];

  // Also handle auth-flavoured messages that bubble up through DB calls
  const localized = localizeAuthError(message);
  if (localized !== message) return localized;

  return message || fallback;
}

/**
 * Convenience helper: returns `true` when the error is a unique-constraint
 * violation (Postgres code 23505).
 */
export function isUniqueViolation(error: { code?: string } | null | undefined): boolean {
  return error?.code === PG_UNIQUE_VIOLATION;
}

/**
 * Convenience helper: returns `true` when PostgREST reports that 0 rows were
 * found (PGRST116), which happens when `.single()` is used on an empty result.
 */
export function isNoRowsError(error: { code?: string } | null | undefined): boolean {
  return error?.code === PGRST_NO_ROWS;
}
