"use client";

import { Button, Dialog, DialogContent, DialogTitle } from "@bleu/ui";
import { useEffect, useRef, useState } from "react";
import { formatUnits, type Hex } from "viem";
import { useAccount, useConfig, useSendTransaction } from "wagmi";
import { getAccount } from "wagmi/actions";

import { useCancellationOverlay } from "#/hooks/useOrderList";
import { chainNames } from "#/lib/publicClients";
import {
  buildCancellation,
  CancellationRevertedError,
  observeCancellation,
} from "#/lib/stopLossCancellation";
import type { StopLossOrder } from "#/lib/stopLossOrders";
import { OrderStatus } from "#/lib/types";

export function CancelOrderDialog({ order }: { order: StopLossOrder }) {
  const { address, chainId } = useAccount();
  const identity = `${address?.toLowerCase()}:${chainId}:${order.chainId}:${order.owner.toLowerCase()}:${order.hash.toLowerCase()}:${order.parentId}`;
  return <OrderCancellation key={identity} order={order} />;
}

function OrderCancellation({ order }: { order: StopLossOrder }) {
  const [open, setOpen] = useState(false);
  const { address } = useAccount();
  const [authorized, setAuthorized] = useState(false);
  useEffect(() => {
    let stopped = false;
    setAuthorized(false);
    if (
      address &&
      order.isSellOrder &&
      [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED].includes(order.status)
    ) {
      void buildCancellation({ account: address, order }).then(
        () => {
          if (!stopped) setAuthorized(true);
        },
        () => {},
      );
    }
    return () => {
      stopped = true;
    };
  }, [address, order]);
  if (!authorized && !open) return null;
  return (
    <>
      {authorized && (
        <Button
          variant="outline"
          aria-label={`Cancel order ${order.parentId} on ${chainNames[order.chainId]}`}
          onClick={() => setOpen(true)}
        >
          Cancel
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        {open && (
          <CancellationReview order={order} close={() => setOpen(false)} />
        )}
      </Dialog>
    </>
  );
}

function isWalletRejection(error: unknown): boolean {
  const seen = new Set<unknown>();
  while (error && typeof error === "object" && !seen.has(error)) {
    seen.add(error);
    if (
      ("code" in error && error.code === 4001) ||
      ("name" in error && error.name === "UserRejectedRequestError")
    )
      return true;
    error = "cause" in error ? error.cause : undefined;
  }
  return false;
}

function CancellationReview({
  order: reviewedOrder,
  close,
}: {
  order: StopLossOrder;
  close: () => void;
}) {
  const [order] = useState(reviewedOrder);
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const config = useConfig();
  const overlay = useCancellationOverlay();
  const [status, setStatus] = useState<
    "review" | "loading" | "confirmed" | "failed"
  >("review");
  const [error, setError] = useState<string>();
  const stopped = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const retryObservation = useRef<() => Promise<void>>();
  useEffect(() => {
    stopped.current = false;
    return () => {
      stopped.current = true;
      clearTimeout(timer.current);
    };
  }, []);
  const submit = async () => {
    if (!address || status === "loading") return;
    setError(undefined);
    setStatus("loading");
    if (retryObservation.current) {
      await retryObservation.current();
      return;
    }
    try {
      if (getAccount(config).chainId !== order.chainId)
        throw new Error(
          `Switch the wallet to ${chainNames[order.chainId]} before cancelling.`,
        );
      const prepared = await buildCancellation({ account: address, order });
      const current = getAccount(config);
      if (
        stopped.current ||
        current.address?.toLowerCase() !== address.toLowerCase() ||
        current.chainId !== order.chainId
      )
        return;
      let reference: Hex | undefined;
      const observe = async () => {
        try {
          const confirmed = await observeCancellation(prepared, reference);
          if (stopped.current) return;
          if (confirmed) {
            overlay.confirm(prepared.account, prepared.order);
            setStatus("confirmed");
          } else timer.current = setTimeout(observe, 1000);
        } catch (cause) {
          if (cause instanceof CancellationRevertedError)
            retryObservation.current = undefined;
          if (!stopped.current) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Cannot check cancellation.",
            );
            setStatus("failed");
          }
        }
      };
      retryObservation.current = observe;
      try {
        reference = await sendTransactionAsync(prepared.transaction);
      } catch (cause) {
        if (isWalletRejection(cause)) retryObservation.current = undefined;
        throw cause;
      }
      if (stopped.current) return;
      void observe();
    } catch (cause) {
      if (!stopped.current) {
        setError(
          cause instanceof Error ? cause.message : "Cannot cancel order.",
        );
        setStatus("failed");
      }
    }
  };
  const amount = (value: bigint, token: StopLossOrder["sellToken"]) =>
    `${token.decimals === null ? `${value} base units` : formatUnits(value, token.decimals)} ${token.symbol}`;
  return (
    <DialogContent aria-describedby={undefined}>
      <DialogTitle>Review cancellation</DialogTitle>
      <p>
        {amount(
          order.sellAmount - (order.executedSellAmount ?? BigInt(0)),
          order.sellToken,
        )}{" "}
        for{" "}
        {amount(
          order.sellAmount > BigInt(0)
            ? (order.buyAmount *
                (order.sellAmount - (order.executedSellAmount ?? BigInt(0)))) /
                order.sellAmount
            : BigInt(0),
          order.buyToken,
        )}
      </p>
      {status === "loading" && <p role="status">Waiting for cancellation...</p>}
      {error && <p role="alert">{error}</p>}
      {status === "confirmed" ? (
        <>
          <p>Order cancelled.</p>
          <Button onClick={close}>Close</Button>
        </>
      ) : (
        <Button disabled={status === "loading"} onClick={() => void submit()}>
          {status === "failed" ? "Retry" : "Confirm cancellation"}
        </Button>
      )}
    </DialogContent>
  );
}
