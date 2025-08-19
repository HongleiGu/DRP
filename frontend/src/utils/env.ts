// this cannot be placed in utils.ts because it is used in store/index.ts
export const isElectron = () => {
  return typeof window !== 'undefined' &&
    typeof window.electronApi !== 'undefined' &&
    typeof window.electronApi.storeGet === 'function';
};

export const isCapacitor = () =>
  typeof window !== 'undefined' &&
  typeof window.Capacitor !== 'undefined' &&
  window.Capacitor.isNativePlatform;