"use client";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SWRConfig, SWRConfiguration } from "swr";
import { type State, WagmiProvider } from "wagmi";

import { wagmiConfig } from "#/utils/wagmi";

import { Footer } from "./Footer";
import { Header } from "./Header";
import { OrderToaster } from "./orderNotifications";
import { WarningNotice } from "./ui/warning-notice";
import { ColorTheme, createWalletTheme } from "./walletTheme";

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  shouldRetryOnError: false,
  keepPreviousData: false,
  provider: () => new Map(),
};

export function RootLayout({
  children,
  config = wagmiConfig,
  initialState,
  initialTheme = "dark",
}: React.PropsWithChildren<{
  config?: typeof wagmiConfig;
  initialState?: State;
  initialTheme?: ColorTheme;
}>) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient());
  const [theme, setTheme] = useState<ColorTheme>(initialTheme);
  const [scenePaused, setScenePaused] = useState(false);

  useEffect(() => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon) icon.href = `/assets/air-rescue/favicon-${theme}.svg`;
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("light", nextTheme === "light");
    document.cookie = `theme=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={createWalletTheme(theme)}
          modalSize="compact"
          appInfo={{ appName: "CoW Air Rescue" }}
        >
          <SWRConfig value={swrConfig}>
            <div
              className="rescue-shell flex flex-col"
              data-scene-paused={scenePaused}
            >
              <Header
                linkUrl="/"
                isLandingPage={pathname === "/"}
                imageSrc={`/assets/air-rescue/passenger-${theme}.svg`}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
              <div className="mx-auto mt-3 w-[calc(100%-28px)] max-w-[1800px] shrink-0 sm:w-[calc(100%-64px)]">
                <WarningNotice role="note">
                  This app is in public testing. Bugs can cause orders to fail
                  or result in loss of funds. New orders are limited to $10,000
                  USD each, based on the current value of the sell amount.
                  Please report problems through{" "}
                  <a
                    href="https://github.com/bleu/cow-stop-loss/issues/new"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    GitHub issues
                  </a>
                  .
                </WarningNotice>
              </div>
              <div className="app-scroll-area bg-transparent">{children}</div>
              <Footer
                githubLink="https://github.com/bleu/cow-stop-loss"
                discordLink="https://discord.gg/cowprotocol"
                scenePaused={scenePaused}
                onToggleScene={() => setScenePaused((paused) => !paused)}
              />
            </div>
            <OrderToaster />
          </SWRConfig>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
