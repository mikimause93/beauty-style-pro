// src/ai/core/StellaMemory.ts
import safeStorage from '@/lib/safeStorage';
import type { StellaUserMemory } from '../types/stella.types';

const MEMORY_KEY_PREFIX = 'stella_memory_';
const MAX_INTERACTIONS = 10;

function memoryKey(userId: string): string {
  return `${MEMORY_KEY_PREFIX}${userId}`;
}

export function getMemory(userId: string): StellaUserMemory {
  return safeStorage.getJSON<StellaUserMemory>(memoryKey(userId), {
    userId,
    preferences: {},
    frequentServices: [],
    preferredTimes: [],
    lastInteractions: [],
  });
}

export function saveMemory(userId: string, updates: Partial<StellaUserMemory>): void {
  const current = getMemory(userId);
  safeStorage.setJSON(memoryKey(userId), { ...current, ...updates, userId });
}

export function recordService(userId: string, service: string): void {
  const memory = getMemory(userId);
  const services = memory.frequentServices.filter(s => s !== service);
  services.unshift(service);
  saveMemory(userId, { frequentServices: services.slice(0, 10) });
}

export function recordPreferredTime(userId: string, time: string): void {
  const memory = getMemory(userId);
  const times = memory.preferredTimes.filter(t => t !== time);
  times.unshift(time);
  saveMemory(userId, { preferredTimes: times.slice(0, 5) });
}

export function recordInteraction(userId: string, summary: string): void {
  const memory = getMemory(userId);
  const entry = { date: new Date().toISOString().slice(0, 10), summary };
  const interactions = [entry, ...memory.lastInteractions].slice(0, MAX_INTERACTIONS);
  saveMemory(userId, { lastInteractions: interactions });
}

export function setPreference(userId: string, key: string, value: unknown): void {
  const memory = getMemory(userId);
  saveMemory(userId, { preferences: { ...memory.preferences, [key]: value } });
}

export function clearMemory(userId: string): void {
  safeStorage.removeItem(memoryKey(userId));
}
