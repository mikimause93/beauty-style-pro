import { describe, it, expect } from "vitest";
import { localizeAuthError } from "@/hooks/useAuth";

describe("localizeAuthError", () => {
  it("returns Italian message for invalid credentials", () => {
    expect(localizeAuthError({ message: "Invalid login credentials" })).toBe(
      "Credenziali non valide. Controlla email e password."
    );
  });

  it("returns Italian message for unconfirmed email", () => {
    expect(localizeAuthError({ message: "Email not confirmed" })).toBe(
      "Email non confermata. Controlla la tua casella di posta."
    );
  });

  it("returns Italian message for already registered", () => {
    expect(localizeAuthError({ message: "User already registered" })).toBe(
      "Questa email è già registrata."
    );
  });

  it("returns Italian message for short password", () => {
    expect(localizeAuthError({ message: "Password should be at least 6 characters" })).toBe(
      "La password deve essere di almeno 6 caratteri."
    );
  });

  it("returns Italian message for rate limiting", () => {
    expect(localizeAuthError({ message: "Too many requests" })).toBe(
      "Troppi tentativi. Riprova tra qualche minuto."
    );
  });

  it("returns Italian message for network error", () => {
    expect(localizeAuthError({ message: "network error occurred" })).toBe(
      "Errore di connessione. Controlla la rete."
    );
  });

  it("returns Italian message for invalid OTP", () => {
    expect(localizeAuthError({ message: "OTP code is invalid" })).toBe(
      "Codice OTP non valido o scaduto."
    );
  });

  it("returns Italian message for session/token error", () => {
    expect(localizeAuthError({ message: "Token has expired" })).toBe(
      "Sessione scaduta. Accedi di nuovo."
    );
  });

  it("returns Italian message for short password (partial match)", () => {
    expect(localizeAuthError({ message: "Password should be at least 8 characters" })).toBe(
      "La password deve essere di almeno 6 caratteri."
    );
  });

  it("handles error with empty message string", () => {
    expect(localizeAuthError({ message: "" })).toBe("Errore sconosciuto");
  });

  it("returns original message for unrecognized errors", () => {
    expect(localizeAuthError({ message: "An unexpected error occurred" })).toBe(
      "An unexpected error occurred"
    );
  });

  it("returns fallback for null", () => {
    expect(localizeAuthError(null)).toBe("Errore sconosciuto");
  });
});
