import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";

import { RootLayout } from "#/components/RootLayout";
import { getWagmiInitialState } from "#/utils/wagmiServer";

const flechaS = localFont({
  src: [
    {
      path: "../fonts/FlechaS-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/FlechaS-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
  ],
  variable: "--font-family-serif",
});

const circularStd = localFont({
  src: [
    {
      path: "../fonts/CircularStd-Book.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/CircularStd-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-family-sans",
});

export default async function Layout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const initialState = getWagmiInitialState((await headers()).get("cookie"));
  const initialTheme =
    (await cookies()).get("theme")?.value === "light" ? "light" : "dark";

  return (
    <html lang="en" className={initialTheme === "light" ? "light" : undefined}>
      <body
        className={`${flechaS.variable} ${circularStd.variable} flex h-full flex-col border-border bg-background font-sans font-normal`}
      >
        <RootLayout initialState={initialState} initialTheme={initialTheme}>
          {children}
        </RootLayout>
      </body>
    </html>
  );
}
