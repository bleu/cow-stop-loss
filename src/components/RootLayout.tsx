"use client";

import { Toaster } from "@bleu/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { SWRConfig, SWRConfiguration } from "swr";
import { WagmiProvider } from "wagmi";

import { wagmiConfig } from "#/utils/wagmi";

import { Footer } from "./Footer";
import { Header } from "./Header";

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
      </QueryClientProvider>
    </WagmiProvider>
  );
}
