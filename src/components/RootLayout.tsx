"use client";

import { Button, Toaster } from "@bleu-fi/ui";
import { ClockIcon } from "@radix-ui/react-icons";
import SafeProvider from "@safe-global/safe-apps-react-sdk";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { ReactFlowProvider } from "reactflow";

import { NetworksContextProvider } from "#/contexts/networks";
import { OrderProvider } from "#/contexts/ordersContext";

import { Footer } from "./Footer";
import { Header } from "./Header";

function HistoryButton() {
  return (
    <Link href="/history">
      <Button className="h-full" variant="default">
        <span className="flex items-center gap-x-2 ">
          <ClockIcon />
          History
        </span>
      </Button>
    </Link>
  );
}

export function RootLayout({ children }: React.PropsWithChildren) {
  const path = usePathname();
  return (
    <SafeProvider loader={<SafeLoader />}>
      <NetworksContextProvider>
        <ReactFlowProvider>
          <OrderProvider>
            <div className="flex flex-col h-screen">
              <Header linkUrl={"/builder"} imageSrc={"/assets/stoploss.svg"}>
                {path !== "/history" && <HistoryButton />}
              </Header>
              <div className="size-full bg-background">{children}</div>
              <Footer
                githubLink="https://github.com/bleu-fi/composable-cow-hub"
                discordLink="https://discord.gg/cowprotocol"
              />
            </div>
            <Toaster />
          </OrderProvider>
        </ReactFlowProvider>
      </NetworksContextProvider>
    </SafeProvider>
  );
}

function SafeLoader() {
  return (
    <div className="bg-background flex size-full flex-col justify-center items-center px-12 py-16 md:py-20 text-slate12">
      <div className="text-center text-3xl">This is a Safe (wallet) App</div>
      <p className="text-xl">
        To access please use this
        <Link
          target="_blank"
          href="https://app.safe.global/share/safe-app?appUrl=https%3A%2F%2Fcow-tools-bleu-fi.vercel.app&chain=gor"
          className="text-amber9"
        >
          {" "}
          link{" "}
        </Link>
        with your safe account connected
      </p>
    </div>
  );
}
