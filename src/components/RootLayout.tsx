"use client";
import { Toaster } from "@bleu/ui";
import SafeProvider from "@safe-global/safe-apps-react-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import React, { useState } from "react";
import { SWRConfig, SWRConfiguration } from "swr";
import { WagmiProvider } from "wagmi";

import { localStorageProvider } from "#/lib/localStorageProvider";
import { wagmiConfig } from "#/utils/wagmi";

import { Footer } from "./Footer";
import { Header } from "./Header";

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 30_000,
  shouldRetryOnError: false,
  keepPreviousData: true,
  provider: localStorageProvider,
};

export function RootLayout({ children }: React.PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SafeProvider loader={<SafeLoader />}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <SWRConfig value={swrConfig}>
            <div className="flex flex-col min-h-screen size-screen justify-between">
              <Header linkUrl={"/"} imageSrc={"/assets/stoploss.svg"} />
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
    </SafeProvider>
  );
}

function SafeLoader() {
  return (
    <div className="bg-background size-full flex-col justify-center items-center px-12 py-16 md:py-20 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element*/}
      <img
        className="flex justify-center h-32 my-2"
        alt="CoW Stop Loss logo"
        src="/assets/stoploss.svg"
      />
      <div className="text-center text-3xl">This is a Safe (wallet) App</div>
      <p className="text-xl">
        To access please use this
        <Link
          target="_blank"
          href="https://app.safe.global/share/safe-app?appUrl=https%3A%2F%2Fstoploss.bleu.builders&chain=eth"
          className="text-highlight"
        >
          {" "}
          link{" "}
        </Link>
        with your safe account connected
      </p>
    </div>
  );
}
