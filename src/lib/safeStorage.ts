const memoryStore = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? value : (memoryStore.get(key) ?? null);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch { /* intentionally empty */ }
    memoryStore.delete(key);
  },
  getJSON: <T>(key: string, fallback: T): T => {
    try {
      const item = safeStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  setJSON: <T>(key: string, value: T): void => {
    safeStorage.setItem(key, JSON.stringify(value));
  },
};

export default safeStorage;
