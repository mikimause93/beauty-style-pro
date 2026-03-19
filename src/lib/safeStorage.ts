const memoryStore = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => memoryStore.get(key) ?? null,
  setItem: (key: string, value: string): void => {
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
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
