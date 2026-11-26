"use client";

import { useAccount } from "wagmi";

import { isSupportedChainId } from "#/lib/publicClients";

import { SwapForm, SwapFormProps } from "./SwapForm";

export function SwapCard({
  onReviewOrder = () => {},
  ...props
}: Partial<SwapFormProps>) {
  const { chainId } = useAccount();
  if (chainId !== undefined && !isSupportedChainId(chainId)) {
    return (
      <p role="alert">
        Switch to a supported wallet network to place an order.
      </p>
    );
  }
  return <SwapForm {...props} onReviewOrder={onReviewOrder} />;
}
