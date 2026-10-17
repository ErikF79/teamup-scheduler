"use client";

import * as React from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __teamupBIP?: BeforeInstallPromptEvent;
  }
}

/**
 * Espone lo stato di installabilità della PWA e permette di forzare il prompt.
 * L'evento `beforeinstallprompt` viene catturato da uno script inline in <head>
 * (vedi layout.tsx) e reso disponibile su `window.__teamupBIP`, così non si
 * perde se arriva prima dell'idratazione di React.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)");
    const computeInstalled = () =>
      mql.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    setIsInstalled(computeInstalled());
    if (window.__teamupBIP) setDeferred(window.__teamupBIP);

    const onAvailable = () => {
      if (window.__teamupBIP) setDeferred(window.__teamupBIP);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferred(null);
      window.__teamupBIP = undefined;
    };
    const onDisplayChange = () => setIsInstalled(computeInstalled());

    window.addEventListener("teamup:install-available", onAvailable);
    window.addEventListener("appinstalled", onInstalled);
    mql.addEventListener?.("change", onDisplayChange);

    return () => {
      window.removeEventListener("teamup:install-available", onAvailable);
      window.removeEventListener("appinstalled", onInstalled);
      mql.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  const promptInstall = React.useCallback(async () => {
    const evt = deferred ?? window.__teamupBIP;
    if (!evt) return false;
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      window.__teamupBIP = undefined;
      setDeferred(null);
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        return true;
      }
    } catch {
      /* ignora */
    }
    return false;
  }, [deferred]);

  return { canInstall: !isInstalled && !!deferred, isInstalled, promptInstall };
}
