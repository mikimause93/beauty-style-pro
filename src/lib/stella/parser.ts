/** Italian time/schedule expression parser for Stella AI */

export function parseItalianTime(text: string): { ms: number | null; cleanText: string } {
  const now = new Date();

  const secMatch = text.match(/\btra\s+(\d+)\s+second[io]\b/i);
  if (secMatch) {
    const ms = parseInt(secMatch[1]) * 1000;
    return { ms, cleanText: text.replace(secMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  const minMatch = text.match(/\btra\s+(\d+)\s+minut[io]\b/i);
  if (minMatch) {
    const ms = parseInt(minMatch[1]) * 60_000;
    return { ms, cleanText: text.replace(minMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  const hrMatch = text.match(/\btra\s+(\d+)\s+or[ae]\b/i);
  if (hrMatch) {
    const ms = parseInt(hrMatch[1]) * 3_600_000;
    return { ms, cleanText: text.replace(hrMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  const domaniMatch = text.match(/\bdomani\s+alle?\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (domaniMatch) {
    const h = parseInt(domaniMatch[1]);
    const m = domaniMatch[2] ? parseInt(domaniMatch[2]) : 0;
    const target = new Date(now);
    target.setDate(target.getDate() + 1);
    target.setHours(h, m, 0, 0);
    return { ms: Math.max(target.getTime() - now.getTime(), 0), cleanText: text.replace(domaniMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  const staseraMatch = text.match(/\bstasera\s+alle?\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (staseraMatch) {
    let h = parseInt(staseraMatch[1]);
    const m = staseraMatch[2] ? parseInt(staseraMatch[2]) : 0;
    if (h < 12) h += 12;
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return { ms: target.getTime() - now.getTime(), cleanText: text.replace(staseraMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  const stamMatch = text.match(/\bstamattina\s+alle?\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (stamMatch) {
    const h = parseInt(stamMatch[1]);
    const m = stamMatch[2] ? parseInt(stamMatch[2]) : 0;
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return { ms: target.getTime() - now.getTime(), cleanText: text.replace(stamMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  const alleMatch = text.match(/\balle?\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (alleMatch) {
    const h = parseInt(alleMatch[1]);
    const m = alleMatch[2] ? parseInt(alleMatch[2]) : 0;
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return { ms: target.getTime() - now.getTime(), cleanText: text.replace(alleMatch[0], '').replace(/\s+/g, ' ').trim() };
  }

  return { ms: null, cleanText: text };
}

export function formatDelay(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} secondi`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} minuti`;
  if (ms < 86_400_000) {
    const h = Math.floor(ms / 3_600_000);
    const min = Math.round((ms % 3_600_000) / 60_000);
    return min > 0 ? `${h}h ${min}m` : `${h} ore`;
  }
  return `${Math.round(ms / 86_400_000)} giorni`;
}

export function extractSchedule(text: string): {
  hasSchedule: boolean;
  ms: number | null;
  cleanCommand: string;
  timeLabel: string;
} {
  const { ms, cleanText } = parseItalianTime(text);
  return {
    hasSchedule: ms !== null,
    ms,
    cleanCommand: cleanText,
    timeLabel: ms !== null ? `tra ${formatDelay(ms)}` : '',
  };
}
