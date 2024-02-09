"use client";

import SafeProvider from "@gnosis.pm/safe-apps-react-sdk";
import Link from "next/link";
import React from "react";

import { NetworksContextProvider } from "@/app/contexts/networks";

import { ToastProvider } from "./Toast";

export function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <SafeProvider loader={<SafeLoader />}>
      <ToastProvider>
        <NetworksContextProvider>
          <div className="size-full bg-blue1">{children}</div>
        </NetworksContextProvider>
      </ToastProvider>
    </SafeProvider>
  );
}

function SafeLoader() {
  return (
    <div className="flex size-full flex-col justify-center  items-center rounded-3xl px-12 py-16 md:py-20 text-slate12">
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
