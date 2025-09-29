export function setupElectronLifecycle(resetWebsockets: () => void) {
  // Only require Electron at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const electron = (window as any).require?.("electron");
  if (!electron) return; // safety check if somehow run in non-Electron

  const { ipcRenderer } = electron;

  console.log("electron lifecycle setup");

  ipcRenderer.on("app-exit", () => {
    resetWebsockets();
  });
}
