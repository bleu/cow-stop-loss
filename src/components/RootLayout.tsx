"use client";

import { Toaster } from "@bleu/ui";
import {
  darkTheme,
  lightTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { SWRConfig, SWRConfiguration } from "swr";
import { type State, WagmiProvider } from "wagmi";

import { wagmiConfig } from "#/utils/wagmi";

import { Footer } from "./Footer";
import { Header } from "./Header";

type ColorTheme = "dark" | "light";

function createWalletTheme(theme: ColorTheme) {
  const walletTheme = (theme === "light" ? lightTheme : darkTheme)({
    accentColor: "hsl(var(--primary))",
    accentColorForeground: "hsl(var(--primary-foreground))",
    borderRadius: "medium",
    overlayBlur: "small",
  });
  walletTheme.colors.modalBackground = "hsl(var(--popover))";
  walletTheme.colors.modalBorder = "hsl(var(--border))";
  walletTheme.colors.actionButtonBorder = "hsl(var(--border))";
  walletTheme.colors.actionButtonSecondaryBackground = "hsl(var(--background))";
  walletTheme.colors.generalBorder = "hsl(var(--border))";
  walletTheme.fonts.body = "var(--font-family-sans), sans-serif";
  return walletTheme;
}

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
            <div className="flex h-dvh min-h-0 flex-col">
              <Header
                linkUrl="/"
                imageSrc="/assets/stoploss.svg"
                theme={theme}
                onToggleTheme={toggleTheme}
              />
              <div className="app-scroll-area min-h-0 flex-1 overflow-y-auto bg-background">
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
