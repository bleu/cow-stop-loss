"use client";

import { Button } from "@bleu/ui";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";

import { NetworkLogo } from "#/components/NetworkLogo";
import { PublicTestingNotice } from "#/components/PublicTestingNotice";
import { PixelIcon } from "#/components/ui/pixel-icon";
import { ChainId, supportedChainIds } from "#/lib/publicClients";

interface IHeader {
  isLandingPage?: boolean;
  linkUrl: string;
  imageSrc?: string;
  onLinkClick?: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function Header({
  isLandingPage = false,
  linkUrl,
  imageSrc,
  onLinkClick,
  theme,
  onToggleTheme,
}: IHeader) {
  return (
    <>
      <PublicTestingNotice />
      <header className="rescue-header pixel-frame relative z-20 flex shrink-0 flex-wrap items-center gap-3">
        <Link
          href={linkUrl}
          onClick={onLinkClick}
          aria-label="CoW Air Rescue"
          className="mr-auto flex shrink-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <span className="rescue-brand block text-foreground">
              CoW Air Rescue
            </span>
            <span className="rescue-brand-subtitle mt-2 block font-serif text-xs text-muted-foreground">
              Your exit plan. On your terms.
            </span>
          </span>
        </Link>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="pixel-control rescue-header-control size-11 bg-card text-foreground"
          >
            {theme === "dark" ? (
              <PixelIcon name="sun" className="size-5" />
            ) : (
              <PixelIcon name="moon" className="size-5" />
            )}
          </Button>
          {isLandingPage ? (
            <Button
              asChild
              className="pixel-control rescue-primary-button rescue-header-control h-11 bg-primary px-4 text-primary-foreground"
            >
              <Link href="/app">Open app</Link>
            </Button>
          ) : (
            <ConnectButton.Custom>
              {({
                account,
                chain,
                mounted,
                openConnectModal,
                openAccountModal,
                openChainModal,
              }) => (
                <>
                  {mounted && account ? (
                    <>
                      <Button
                        variant="outline"
                        aria-label="Switch wallet network"
                        onClick={openChainModal}
                        className="pixel-control rescue-header-control h-11 gap-2 bg-card px-4 font-medium text-foreground"
                      >
                        {chain &&
                        supportedChainIds.includes(chain.id as ChainId) ? (
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
                        <PixelIcon
                          name="chevron-down"
                          className="size-4 opacity-70"
                        />
                      </Button>
                      <Button
                        variant="outline"
                        title={account.address}
                        onClick={openAccountModal}
                        aria-label={`Wallet account ${account.displayName}`}
                        className="pixel-control rescue-header-control rescue-wallet-button h-11 gap-2 px-4 font-medium text-primary"
                      >
                        <PixelIcon name="wallet" className="size-4" />
                        {account.displayName}
                        <PixelIcon
                          name="chevron-down"
                          className="size-4 opacity-70"
                        />
                      </Button>
                    </>
                  ) : !mounted ? (
                    <Button
                      variant="outline"
                      disabled
                      aria-label="Loading wallet"
                      className="pixel-control rescue-header-control h-11 gap-2 px-4 text-muted-foreground"
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
                      className="pixel-control rescue-primary-button rescue-header-control h-11 gap-2 bg-primary px-4 text-primary-foreground"
                    >
                      <PixelIcon name="wallet" className="size-4" />
                      <span className="sm:hidden">Connect</span>
                      <span className="hidden sm:inline">Connect wallet</span>
                    </Button>
                  )}
                </>
              )}
            </ConnectButton.Custom>
          )}
        </div>
      </header>
    </>
  );
}
