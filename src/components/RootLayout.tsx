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
