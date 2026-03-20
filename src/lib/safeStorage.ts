const memoryStore = new Map<string, string>();

/** Returns true if localStorage is available and functional. */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__safeStorage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const safeStorage = {
  getItem: (key: string): string | null => {
    if (isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
    } else {
      memoryStore.set(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    } else {
      memoryStore.delete(key);
    }
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
