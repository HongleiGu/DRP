// store.ts
export interface globalStore {
  getItem<T>(key: string): Promise<T | undefined>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const isElectron = () => {
  return typeof window !== 'undefined' &&
         typeof window.electronApi !== 'undefined' &&
         typeof window.electronApi.storeGet === 'function';
};

const electronStore: globalStore = {
  async getItem<T>(key: string): Promise<T | undefined> {
    return await window.electronApi.storeGet(key);
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    await window.electronApi.storeSet(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await window.electronApi.storeDelete(key);
  },
};

const webStore: globalStore = {
  async getItem<T>(key: string): Promise<T | undefined> {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : undefined;
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  },

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  },
};

const globalStore: globalStore = isElectron() ? electronStore : webStore;

export default globalStore;
