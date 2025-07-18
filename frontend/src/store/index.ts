// store.ts
export interface GlobalStore {
  getItem(key: string): Promise<string | undefined>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const isElectron = () => {
  return typeof window !== 'undefined' &&
         typeof window.electronApi !== 'undefined' &&
         typeof window.electronApi.storeGet === 'function';
};

const electronStore: GlobalStore = {
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

const webStore: GlobalStore = {
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

const globalStore: GlobalStore = isElectron() ? electronStore : webStore;

export default globalStore;
