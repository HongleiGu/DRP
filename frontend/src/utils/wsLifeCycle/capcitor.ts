import { App } from "@capacitor/app";

export function setupCapacitorLifecycle(resetWebsockets: () => void) {
  App.addListener("appStateChange", ({ isActive }: { isActive: boolean }) => {
    if (!isActive) resetWebsockets();
  });

  App.addListener("backButton", resetWebsockets);
}
