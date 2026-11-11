"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";

import {
  analytics,
  ANALYTICS_CONSENT_KEY,
  type AnalyticsConsent,
  analyticsEnabled,
} from "#/lib/analytics";

type ConsentContext = {
  consent: AnalyticsConsent;
  enabled: boolean;
  revision: number;
  openPreferences: () => void;
};
const Context = createContext<ConsentContext>({
  consent: null,
  enabled: false,
  revision: 0,
  openPreferences: () => {},
});

export function useAnalyticsConsent() {
  return useContext(Context);
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const { address, status } = useAccount();
  const pathname = usePathname();
  const [consent, setConsent] = useState<AnalyticsConsent>(null);
  const [preferences, setPreferences] = useState(false);
  const [revision, setRevision] = useState(0);
  const enabled = analyticsEnabled();

  useEffect(() => {
    const unsubscribe = analytics.subscribe(() => {
      setConsent(analytics.getConsent());
      setRevision((value) => value + 1);
    });
    function sync() {
      analytics.syncConsent();
      setConsent(analytics.getConsent());
    }
    function onStorage(event: StorageEvent) {
      if (event.key === ANALYTICS_CONSENT_KEY || event.key === null) sync();
    }
    function refreshVisibleSession() {
      if (document.visibilityState === "visible") analytics.refreshSession();
    }
    function onActivity() {
      if (document.visibilityState === "visible")
        analytics.refreshSession(true);
    }
    sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onActivity);
    document.addEventListener("pointerdown", onActivity);
    document.addEventListener("keydown", onActivity);
    document.addEventListener("visibilitychange", onActivity);
    const timer = window.setInterval(refreshVisibleSession, 30_000);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onActivity);
      document.removeEventListener("pointerdown", onActivity);
      document.removeEventListener("keydown", onActivity);
      document.removeEventListener("visibilitychange", onActivity);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    analytics.setWallet(address, status);
  }, [address, status]);
  useEffect(() => {
    if (pathname) analytics.pageview(pathname);
  }, [pathname]);

  function choose(choice: Exclude<AnalyticsConsent, null>) {
    analytics.setConsent(choice);
    setConsent(analytics.getConsent());
    setPreferences(false);
  }

  const actions = (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="pixel-control min-h-11 rounded-none border border-border px-4 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => choose("rejected")}
      >
        Turn analytics off
      </button>
      <button
        type="button"
        className="pixel-control min-h-11 rounded-none border border-border px-4 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => choose("accepted")}
      >
        Turn analytics on
      </button>
    </div>
  );
  const explanation =
    "We collect usage data to understand how the app is used and improve it. You can turn analytics off at any time.";

  return (
    <Context.Provider
      value={{
        consent,
        enabled,
        revision,
        openPreferences: () => setPreferences(true),
      }}
    >
      {children}
      <Dialog.Root open={preferences && enabled} onOpenChange={setPreferences}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 space-y-4 pixel-frame rounded-none border border-border bg-background p-6 text-foreground shadow-lg">
            <Dialog.Title className="font-semibold">
              Analytics preferences
            </Dialog.Title>
            <Dialog.Description className="text-sm">
              {explanation}
            </Dialog.Description>
            <p className="text-sm">
              Analytics: {consent === "accepted" ? "on" : "off"}.
            </p>
            {actions}
            <Dialog.Close className="min-h-11 px-2 text-sm underline">
              Close
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Context.Provider>
  );
}
