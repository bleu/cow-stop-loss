"use client";

import { Toaster } from "@bleu/ui";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { SWRConfig, SWRConfiguration } from "swr";
import { WagmiProvider } from "wagmi";

import { wagmiConfig } from "#/utils/wagmi";

import { Footer } from "./Footer";
import { Header } from "./Header";

const walletTheme = darkTheme({
  accentColor: "hsl(var(--primary))",
  accentColorForeground: "hsl(var(--primary-foreground))",
  borderRadius: "medium",
  overlayBlur: "small",
});
walletTheme.colors.modalBackground = "hsl(var(--popover))";
walletTheme.colors.modalBorder = "hsl(var(--foreground) / 0.15)";
walletTheme.colors.actionButtonBorder = "hsl(var(--foreground) / 0.15)";
walletTheme.colors.actionButtonSecondaryBackground = "hsl(var(--background))";
walletTheme.colors.generalBorder = "hsl(var(--foreground) / 0.15)";
walletTheme.fonts.body = "var(--font-family-sans), sans-serif";

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
}: React.PropsWithChildren<{ config?: typeof wagmiConfig }>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={walletTheme}
          modalSize="compact"
          appInfo={{ appName: "CoW Stop Loss" }}
        >
          <SWRConfig value={swrConfig}>
            <div className="flex flex-col min-h-screen size-screen justify-between">
              <Header linkUrl="/" imageSrc="/assets/stoploss.svg" />
              <div className="size-full bg-background">{children}</div>
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
