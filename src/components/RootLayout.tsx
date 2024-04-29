"use client";

import { Button, Toaster } from "@bleu-fi/ui";
import { ClockIcon, HomeIcon, PlusIcon } from "@radix-ui/react-icons";
import SafeProvider from "@safe-global/safe-apps-react-sdk";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { ReactFlowProvider } from "reactflow";

import { NetworksContextProvider } from "#/contexts/networks";

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

function BuilderButton() {
  return (
    <Link href="/history">
      <Button className="h-full" variant="default">
        <span className="flex items-center gap-x-2 ">
          <PlusIcon />
          New Order
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
          <div className="flex flex-col h-screen">
            <Header linkUrl={"/builder"} imageSrc={"/assets/stoploss.svg"}>
              {path === "/history" ? <BuilderButton /> : <HistoryButton />}
            </Header>
            <div className="size-full bg-background">{children}</div>
            <Footer
              githubLink="https://github.com/bleu-fi/composable-cow-hub"
              discordLink="https://discord.gg/cowprotocol"
            />
          </div>
          <Toaster />
        </ReactFlowProvider>
      </NetworksContextProvider>
    </SafeProvider>
  );
}

function SafeLoader() {
  return (
    <div className="bg-background flex size-full flex-col justify-center items-center px-12 py-16 md:py-20 text-foreground">
      <div className="text-center text-3xl">This is a Safe (wallet) App</div>
      <p className="text-xl">
        To access please use this
        <Link
          target="_blank"
          href="https://app.safe.global/share/safe-app?appUrl=https%3A%2F%2Fcow-tools-bleu-fi.vercel.app&chain=gor"
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
