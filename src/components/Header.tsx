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
    <header className="relative z-20 flex min-h-16 w-full shrink-0 flex-wrap items-center gap-3 border-b border-border/70 bg-background/85 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-8">
      <Link
        href={linkUrl}
        onClick={onLinkClick}
        aria-label="CoW Stop Loss"
        className="mr-auto flex shrink-0 items-center gap-3"
      >
        {imageSrc && (
          <Image
            src={imageSrc}
            height={36}
            width={150}
            alt="CoW Stop Loss"
            className={`h-9 w-[150px] object-cover ${theme === "light" ? "brightness-[0.68] saturate-[1.15]" : ""}`}
            priority
          />
        )}
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
          <div className="flex flex-wrap items-center gap-2">
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
                className="h-9 gap-2 rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              >
                <PersonIcon aria-hidden="true" className="size-4" />
                Connect wallet
              </Button>
            )}
          </div>
        )}
      </ConnectButton.Custom>
    </header>
  );
}
