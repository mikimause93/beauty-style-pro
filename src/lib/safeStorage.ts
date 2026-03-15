const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

const safeStorage = {
  getItem: (key: string): string | null => {
    try { return isStorageAvailable() ? localStorage.getItem(key) : null; } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    try { if (isStorageAvailable()) localStorage.setItem(key, value); } catch { /* intentionally empty */ }
  },
  removeItem: (key: string): void => {
    try { if (isStorageAvailable()) localStorage.removeItem(key); } catch { /* intentionally empty */ }
  },
  getJSON: <T>(key: string, fallback: T): T => {
    try {
      const item = safeStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : fallback;
    } catch { return fallback; }
  },
  setJSON: <T>(key: string, value: T): void => {
    try { safeStorage.setItem(key, JSON.stringify(value)); } catch { /* intentionally empty */ }
  },
};

export default safeStorage;
