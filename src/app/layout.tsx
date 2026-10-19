import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import "../styles/order-review.css";
import "../styles/landing.css";

import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";

import { RootLayout } from "#/components/RootLayout";
import { getWagmiInitialState } from "#/utils/wagmiServer";

const pixelDisplay = localFont({
  src: "../fonts/PixelifySans-Variable.ttf",
  weight: "400 700",
  variable: "--font-family-pixel-display",
  display: "swap",
});

const desktopDisplay = localFont({
  src: [
    { path: "../fonts/ChakraPetch-Medium.ttf", weight: "500", style: "normal" },
    {
      path: "../fonts/ChakraPetch-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-family-desktop-display",
  display: "swap",
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

export async function generateMetadata() {
  const theme =
    (await cookies()).get("theme")?.value === "light" ? "light" : "dark";
  return {
    title: "CoW Air Rescue",
    icons: {
      icon: {
        url: `/assets/air-rescue/favicon-${theme}.svg`,
        type: "image/svg+xml",
      },
    },
  };
}

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
        className={`${pixelDisplay.variable} ${desktopDisplay.variable} ${circularStd.variable} min-h-full border-border bg-background font-sans font-normal`}
      >
        <RootLayout initialState={initialState} initialTheme={initialTheme}>
          {children}
        </RootLayout>
      </body>
    </html>
  );
}
