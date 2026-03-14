/**
 * Safe localStorage wrappers that never throw.
 * In environments where localStorage is unavailable (SSR, iframe restrictions,
 * Lovable preview sandbox, private browsing with strict settings) all operations
 * silently no-op / return the supplied default.
 */

function isAvailable(): boolean {
  try {
    const key = "__storage_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

const _available = typeof window !== "undefined" && typeof localStorage !== "undefined" && isAvailable();

export const safeStorage = {
  getItem(key: string): string | null {
    if (!_available) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    if (!_available) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // quota exceeded or security error — ignore
    }
  },

  removeItem(key: string): void {
    if (!_available) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  /** Parse a JSON value stored under `key`; returns `fallback` on any error. */
  getJSON<T>(key: string, fallback: T): T {
    const raw = safeStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setJSON(key: string, value: unknown): void {
    try {
      safeStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore serialization errors
    }
  },
};
