"use client";

import { useAccount } from "wagmi";

import { supportedChainIds } from "#/lib/publicClients";

import { SwapForm, SwapFormProps } from "./SwapForm";

export function SwapCard({
  onReviewOrder = () => {},
  reviewDisabled,
}: Partial<SwapFormProps>) {
  const { address, chainId } = useAccount();
  if (!address) return <p>Connect a wallet to place a stop-loss order.</p>;
  if (!supportedChainIds.some((id) => id === chainId)) {
    return (
      <p role="alert">
        Switch to a supported wallet network to place an order.
      </p>
    );
  }
  return (
    <SwapForm onReviewOrder={onReviewOrder} reviewDisabled={reviewDisabled} />
  );
}
