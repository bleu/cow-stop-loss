"use client";

import { Button } from "@bleu/ui";
import { ChevronDownIcon, PersonIcon } from "@radix-ui/react-icons";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";

interface IHeader {
  linkUrl: string;
  imageSrc?: string;
  onLinkClick?: () => void;
}

export function Header({ linkUrl, imageSrc, onLinkClick }: IHeader) {
  return (
    <header className="flex min-h-20 w-full flex-wrap items-center gap-4 border-b border-foreground/10 bg-background px-4 py-5 sm:px-8">
      <Link
        href={linkUrl}
        onClick={onLinkClick}
        aria-label="CoW Stop Loss"
        className="mr-auto flex shrink-0 items-center gap-3"
      >
        {imageSrc && (
          <Image src={imageSrc} height={30} width={150} alt="CoW Stop Loss" />
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
            {mounted && account ? (
              <>
                <Button
                  variant="outline"
                  aria-label="Switch wallet network"
                  onClick={openChainModal}
                  className="h-10 gap-2 rounded-xl border-foreground/15 bg-muted/50 px-3 text-foreground hover:bg-muted hover:text-primary"
                >
                  <span
                    aria-hidden="true"
                    className={`size-2 shrink-0 rounded-full ${chain?.unsupported ? "bg-destructive" : "bg-primary"}`}
                  />
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
                  className="h-10 gap-2 rounded-xl border-primary/30 bg-primary/10 px-4 text-primary hover:bg-primary/20 hover:text-primary"
                >
                  <PersonIcon aria-hidden="true" className="size-4" />
                  {account.displayName}
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="size-4 opacity-70"
                  />
                </Button>
              </>
            ) : (
              <Button
                disabled={!mounted}
                onClick={openConnectModal}
                className="h-10 gap-2 rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/90"
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
