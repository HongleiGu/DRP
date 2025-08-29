import { Preferences } from '@capacitor/preferences';

import { isCapacitor, isElectron } from "@/utils/env";

export interface globalStore {
  getItem<T>(key: string): Promise<T | undefined>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear?(): Promise<void>;
}

// Electron store
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

// Capacitor store (Preferences API, the @capacitor/storage does not seem to be maintained, npm 3yr ago)
const capacitorStore: globalStore = {
  async getItem<T>(key: string): Promise<T | undefined> {
    const { value } = await Preferences.get({ key });
    if (!value) return undefined;
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  },
  async setItem<T>(key: string, value: T): Promise<void> {
    await Preferences.set({ key, value: JSON.stringify(value) });
  },
  async removeItem(key: string): Promise<void> {
    await Preferences.remove({ key });
  },
  async clear(): Promise<void> {
    await Preferences.clear();
  },
};

// Web store
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
  async clear(): Promise<void> {
    localStorage.clear();
  },
};

// Select store based on platform
const globalStore: globalStore =
  isElectron()
    ? electronStore
    : isCapacitor()
    ? capacitorStore
    : webStore;

export default globalStore;
