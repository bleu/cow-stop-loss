"use client";

import { Button } from "@bleu/ui";
import {
  ChevronDownIcon,
  MoonIcon,
  PersonIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";

import { NetworkLogo } from "#/components/NetworkLogo";
import { ChainId, supportedChainIds } from "#/lib/publicClients";

interface IHeader {
  linkUrl: string;
  imageSrc?: string;
  onLinkClick?: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function Header({
  linkUrl,
  imageSrc,
  onLinkClick,
  theme,
  onToggleTheme,
}: IHeader) {
  return (
    <header className="relative z-20 flex min-h-[76px] w-full shrink-0 flex-wrap items-center gap-3 border-b border-border/70 bg-card px-4 py-3 sm:px-8 lg:px-10">
      <Link
        href={linkUrl}
        onClick={onLinkClick}
        aria-label="CoW Stop Loss"
        className="mr-auto flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {imageSrc && (
          <Image
            src={imageSrc}
            height={48}
            width={48}
            alt=""
            className="size-10 object-contain sm:size-12"
            priority
          />
        )}
        <span>
          <span className="block text-base font-medium leading-5 tracking-tight text-foreground sm:text-xl">
            CoW <span className="font-normal">Stop Loss</span>
          </span>
          <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
            Air rescue · by bleu
          </span>
        </span>
      </Link>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          mounted,
          openConnectModal,
          openAccountModal,
          openChainModal,
        }) => (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="size-10 rounded-xl border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted"
            >
              {theme === "dark" ? (
                <SunIcon aria-hidden="true" className="size-4" />
              ) : (
                <MoonIcon aria-hidden="true" className="size-4" />
              )}
            </Button>
            {mounted && account ? (
              <>
                <Button
                  variant="outline"
                  aria-label="Switch wallet network"
                  onClick={openChainModal}
                  className="h-10 gap-2 rounded-xl border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm hover:border-primary/50 hover:bg-muted"
                >
                  {chain && supportedChainIds.includes(chain.id as ChainId) ? (
                    <NetworkLogo
                      chainId={chain.id as ChainId}
                      size={20}
                      className="rounded-full"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`size-2 shrink-0 rounded-full ${chain?.unsupported ? "bg-destructive" : "bg-primary"}`}
                    />
                  )}
                  {chain?.unsupported
                    ? "Unsupported network"
                    : (chain?.name ?? "Select network")}
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="size-4 opacity-70"
                  />
                </Button>
                <Button
                  variant="outline"
                  title={account.address}
                  onClick={openAccountModal}
                  aria-label={`Wallet account ${account.displayName}`}
                  className="h-10 gap-2 rounded-xl border-primary/30 bg-primary/10 px-3 text-sm font-medium text-primary shadow-sm hover:bg-primary/15 hover:text-primary"
                >
                  <PersonIcon aria-hidden="true" className="size-4" />
                  {account.displayName}
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="size-4 opacity-70"
                  />
                </Button>
              </>
            ) : !mounted ? (
              <Button
                variant="outline"
                disabled
                aria-label="Loading wallet"
                className="h-9 gap-2 rounded-xl border-foreground/15 bg-muted/50 px-4 text-muted-foreground"
              >
                <span
                  aria-hidden="true"
                  className="size-2 animate-pulse rounded-full bg-primary"
                />
                Loading wallet…
              </Button>
            ) : (
              <Button
                onClick={openConnectModal}
                aria-label="Connect wallet"
                className="h-10 gap-2 rounded-xl bg-primary px-3 text-primary-foreground hover:bg-primary/90 sm:px-4"
              >
                <PersonIcon aria-hidden="true" className="size-4" />
                <span className="sm:hidden">Connect</span>
                <span className="hidden sm:inline">Connect wallet</span>
              </Button>
            )}
          </div>
        )}
      </ConnectButton.Custom>
    </header>
  );
}
