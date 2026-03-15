import { describe, it, expect } from "vitest";

// Standalone tests for voice command pattern matching (no React Router needed)

type CommandResult =
  | { matched: false }
  | { matched: true; type: "navigate"; path: string }
  | { matched: true; type: "back" }
  | { matched: true; type: "scroll"; dir: "up" | "down" }
  | { matched: true; type: "search"; query: string }
  | { matched: true; type: "message"; recipient: string; content?: string }
  | { matched: true; type: "like" }
  | { matched: true; type: "map-search"; radius: string }
  | { matched: true; type: "theme"; value: "light" | "dark" };

describe("voice command patterns", () => {
  const processText = (text: string): CommandResult => {
    const t = text.toLowerCase().trim();

    // Back navigation (hands-free essential)
    if (t.includes("torna indietro") || t.includes("vai indietro") || t.includes("pagina precedente") || t === "indietro") {
      return { matched: true, type: "back" };
    }

    // Scroll
    if (t.includes("scorri su") || t.includes("vai su") || t.includes("scroll su")) return { matched: true, type: "scroll", dir: "up" };
    if (t.includes("scorri giù") || t.includes("vai giù") || t.includes("scorri in basso")) return { matched: true, type: "scroll", dir: "down" };

    // Message with content (must be checked before navigation)
    const msgWithContent = t.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+([^:,]+?)(?:\s*[,:]\s*|\s+(?:che|dicendo|scrivendo)\s+)(.+)/);
    if (msgWithContent) return { matched: true, type: "message", recipient: msgWithContent[1].trim(), content: msgWithContent[2].trim() };

    // Message simple
    const msgSimple = t.match(/(?:invia|scrivi|manda)\s+(?:un\s+)?messaggio\s+a\s+(.+)/);
    if (msgSimple) return { matched: true, type: "message", recipient: msgSimple[1].trim() };

    // Navigation
    if (t.includes("vai alla home") || t.includes("apri home")) return { matched: true, type: "navigate", path: "/" };
    if (t.includes("apri chat") || t.includes("messaggi")) return { matched: true, type: "navigate", path: "/chat" };
    if (t.includes("apri mappa") || t.includes("cerca sulla mappa")) return { matched: true, type: "navigate", path: "/map-search" };

    // Generic search
    const searchM = t.match(/^cerca\s+(.+)$/);
    if (searchM && !t.includes("match") && !t.includes("amici") && !t.includes("stilisti") && !t.includes("persone")) {
      return { matched: true, type: "search", query: searchM[1].trim() };
    }

    // Like
    if (t.match(/metti\s+like|dai\s+like|mi\s+piace/)) return { matched: true, type: "like" };

    // Match search with distance
    const distMatch = t.match(/cerca\s+(?:match|amici|persone|stilisti)\s+(?:a|entro|vicino|nel\s+raggio\s+di)\s*(\d+)\s*km/);
    if (distMatch) return { matched: true, type: "map-search", radius: distMatch[1] };

    if (t.includes("cerca match") || t.includes("trova match")) return { matched: true, type: "navigate", path: "/map-search" };

    // Theme
    if (t.includes("tema chiaro") || t.includes("light mode")) return { matched: true, type: "theme", value: "light" };
    if (t.includes("tema scuro") || t.includes("dark mode")) return { matched: true, type: "theme", value: "dark" };

    return { matched: false };
  };

  it("matches 'vai alla home'", () => {
    const r = processText("vai alla home");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("navigate");
  });

  it("matches 'apri chat'", () => {
    const r = processText("apri chat");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("navigate");
  });

  it("matches simple message command", () => {
    const r = processText("invia messaggio a Mario Rossi");
    expect(r.matched).toBe(true);
    if (r.matched && r.type === "message") expect(r.recipient).toBe("mario rossi");
  });

  it("matches message with content after colon", () => {
    const r = processText("invia messaggio a Mario: domani gli faccio sapere");
    expect(r.matched).toBe(true);
    if (r.matched && r.type === "message") {
      expect(r.recipient).toBe("mario");
      expect(r.content).toBe("domani gli faccio sapere");
    }
  });

  it("matches message with 'che' keyword", () => {
    const r = processText("scrivi messaggio a Luca che domani ci vediamo");
    expect(r.matched).toBe(true);
    if (r.matched && r.type === "message") expect(r.content).toBe("domani ci vediamo");
  });

  it("matches 'metti like'", () => {
    const r = processText("metti like a questo video");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("like");
  });

  it("matches 'dai like'", () => {
    const r = processText("dai like");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("like");
  });

  it("matches match search with distance", () => {
    const r = processText("cerca match a 10 km");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("map-search");
    if (r.matched && r.type === "map-search") expect(r.radius).toBe("10");
  });

  it("matches 'cerca amici entro 5 km'", () => {
    const r = processText("cerca amici entro 5 km");
    expect(r.matched).toBe(true);
    if (r.matched && r.type === "map-search") expect(r.radius).toBe("5");
  });

  it("matches 'cerca match' without distance", () => {
    const r = processText("cerca match");
    expect(r.matched).toBe(true);
  });

  it("matches tema chiaro command", () => {
    const r = processText("tema chiaro");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("theme");
    if (r.matched && r.type === "theme") expect(r.value).toBe("light");
  });

  it("matches tema scuro command", () => {
    const r = processText("attiva il tema scuro");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("theme");
    if (r.matched && r.type === "theme") expect(r.value).toBe("dark");
  });

  it("returns not matched for unknown command", () => {
    const r = processText("bla bla bla incomprensibile");
    expect(r.matched).toBe(false);
  });

  it("matches 'torna indietro'", () => {
    const r = processText("torna indietro");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("back");
  });

  it("matches 'vai indietro'", () => {
    const r = processText("vai indietro");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("back");
  });

  it("matches 'scorri su'", () => {
    const r = processText("scorri su");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("scroll");
    if (r.matched && r.type === "scroll") expect(r.dir).toBe("up");
  });

  it("matches 'scorri giù'", () => {
    const r = processText("scorri giù");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("scroll");
    if (r.matched && r.type === "scroll") expect(r.dir).toBe("down");
  });

  it("matches 'cerca parrucchiere'", () => {
    const r = processText("cerca parrucchiere");
    expect(r.matched).toBe(true);
    if (r.matched) expect(r.type).toBe("search");
    if (r.matched && r.type === "search") expect(r.query).toBe("parrucchiere");
  });
});
