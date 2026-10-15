"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@bleu/ui";
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
          className="h-10 min-h-10 rounded-xl border-destructive/30 bg-destructive/5 px-3 text-sm font-semibold text-destructive shadow-none hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30"
          aria-label={`Cancel order ${order.parentId} on ${chainNames[order.chainId]}`}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
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
    <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-3xl border border-border/70 bg-card p-5 text-foreground shadow-2xl sm:p-6">
      <div className="mb-5">
        <DialogTitle className="text-xl font-semibold tracking-tight">
          Cancel this order?
        </DialogTitle>
        <DialogDescription className="mt-1 leading-relaxed">
          Review the remaining amounts before confirming cancellation.
        </DialogDescription>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-2xl border border-border/70 bg-background/70 p-3.5">
          <p className="text-xs font-medium text-muted-foreground">
            Remaining sell
          </p>
          <p className="mt-1 break-words text-sm font-semibold tabular-nums">
            {amount(
              order.sellAmount - (order.executedSellAmount ?? BigInt(0)),
              order.sellToken,
            )}
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-border/70 bg-background/70 p-3.5">
          <p className="text-xs font-medium text-muted-foreground">
            Minimum buy
          </p>
          <p className="mt-1 break-words text-sm font-semibold tabular-nums">
            {amount(
              order.sellAmount > BigInt(0)
                ? (order.buyAmount *
                    (order.sellAmount -
                      (order.executedSellAmount ?? BigInt(0)))) /
                    order.sellAmount
                : BigInt(0),
              order.buyToken,
            )}
          </p>
        </div>
      </div>
      {status === "loading" && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground"
        >
          Waiting for cancellation confirmation…
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {status === "confirmed" ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            Order cancelled.
          </p>
          <Button className="rounded-xl" onClick={close}>
            Close
          </Button>
        </div>
      ) : (
        <Button
          variant="destructive"
          className="h-11 w-full rounded-xl font-semibold"
          disabled={status === "loading"}
          onClick={() => void submit()}
        >
          {status === "failed" ? "Retry cancellation" : "Confirm cancellation"}
        </Button>
      )}
    </DialogContent>
  );
}
