"use client";

import { Button } from "@bleu/ui";
import Image from "next/image";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { truncateAddress } from "#/utils";

interface IHeader {
  linkUrl: string;
  imageSrc?: string;
  onLinkClick?: () => void;
}

export function Header({ linkUrl, imageSrc, onLinkClick }: IHeader) {
  const { address, chain, chainId } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="flex min-h-20 w-full flex-wrap items-center gap-4 bg-background p-8">
      <Link
        href={linkUrl}
        onClick={onLinkClick}
        aria-label="CoW Stop Loss"
        className="mr-auto flex items-center gap-3"
      >
        {imageSrc && (
          <Image src={imageSrc} height={30} width={150} alt="CoW Stop Loss" />
        )}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        {address ? (
          <>
            <span
              className="rounded-lg bg-muted px-5 py-3 text-sm"
              title={address}
            >
              {truncateAddress(address)} ({chain?.name ?? `Chain ${chainId}`})
            </span>
            <Button variant="outline" onClick={() => disconnect()}>
              Disconnect wallet
            </Button>
          </>
        ) : (
          connectors.map((connector) => (
            <Button
              key={connector.uid}
              variant="outline"
              disabled={isPending}
              onClick={() => connect({ connector })}
            >
              {connector.id === "injected" ? "Browser wallet" : connector.name}
            </Button>
          ))
        )}
        {!address &&
          !connectors.some((connector) => connector.id === "walletConnect") && (
            <p className="text-sm text-muted-foreground">
              WalletConnect is not configured for this app.
            </p>
          )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error.message}
          </p>
        )}
      </div>
    </header>
  );
}
