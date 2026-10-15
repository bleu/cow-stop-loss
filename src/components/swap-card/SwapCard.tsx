"use client";

import { useAccount } from "wagmi";

import { supportedChainIds } from "#/lib/publicClients";

import { SwapForm, SwapFormProps } from "./SwapForm";

export function SwapCard({
  onReviewOrder = () => {},
  reviewDisabled,
}: Partial<SwapFormProps>) {
  const { chainId } = useAccount();
  if (chainId && !supportedChainIds.some((id) => id === chainId)) {
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
