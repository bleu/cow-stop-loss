"use client";

import { Toaster } from "@bleu/ui";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { SWRConfig, SWRConfiguration } from "swr";
import { type State, WagmiProvider } from "wagmi";

import { wagmiConfig } from "#/utils/wagmi";

import { Footer } from "./Footer";
import { Header } from "./Header";
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
  const [queryClient] = useState(() => new QueryClient());
  const [theme, setTheme] = useState<ColorTheme>(initialTheme);

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
          appInfo={{ appName: "CoW Stop Loss" }}
        >
          <SWRConfig value={swrConfig}>
            <div className="rescue-shell flex h-dvh min-h-0 flex-col">
              <Header
                linkUrl="/"
                imageSrc={`/assets/air-rescue/face-${theme}.svg`}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
              <div className="app-scroll-area min-h-0 flex-1 overflow-y-auto bg-transparent">
                {children}
              </div>
              <Footer
                githubLink="https://github.com/bleu/cow-stop-loss"
                discordLink="https://discord.gg/cowprotocol"
              />
            </div>
            <Toaster />
          </SWRConfig>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
