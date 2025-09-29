import { resetWebsockets } from "../../hooks/StompService";

export function setupBrowserLifecycle() {
  const handleReset = () => resetWebsockets();

  window.addEventListener("beforeunload", handleReset);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      handleReset();
    }
  });
}