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

import { PixelIcon } from "#/components/ui/pixel-icon";
import { useCancellationOverlay } from "#/hooks/useOrderList";
import { chainNames } from "#/lib/publicClients";
import {
  buildCancellation,
  CancellationRevertedError,
  observeCancellation,
} from "#/lib/stopLossCancellation";
import type { StopLossOrder } from "#/lib/stopLossOrders";
import { isDefiniteFailure, isRejected } from "#/lib/stopLossPlacement";
import { OrderStatus } from "#/lib/types";

import { showOrderError, showOrderSuccess } from "./orderNotifications";

export function CancelOrderDialog({
  order,
  compact = false,
}: {
  order: StopLossOrder;
  compact?: boolean;
}) {
  const { address, chainId } = useAccount();
  const identity = `${address?.toLowerCase()}:${chainId}:${order.chainId}:${order.owner.toLowerCase()}:${order.hash.toLowerCase()}:${order.parentId}`;
  return <OrderCancellation key={identity} order={order} compact={compact} />;
}

function OrderCancellation({
  order,
  compact,
}: {
  order: StopLossOrder;
  compact: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { address } = useAccount();
  const canCancel = Boolean(
    address &&
      order.isSellOrder &&
      [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED].includes(order.status),
  );
  if (!canCancel && !open) return null;
  return (
    <>
      {canCancel && (
        <Button
          variant="outline"
          title="Cancel order"
          className={`rescue-danger-outline pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${compact ? "rescue-icon-action size-11 rounded-none p-0" : "h-11 min-h-11 rounded-none px-3"} border-destructive/30 bg-destructive/5 text-sm font-semibold text-destructive shadow-none hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30`}
          aria-label={`Cancel order ${order.parentId} on ${chainNames[order.chainId]}`}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
        >
          {compact ? <PixelIcon name="trash" className="size-4" /> : "Cancel"}
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
  const [status, setStatus] = useState<"review" | "loading">("review");
  const [walletPrompt, setWalletPrompt] = useState(false);
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
            showOrderSuccess(
              "cancel",
              {
                account: prepared.account,
                ...prepared.order,
              },
              `${order.parentId}:${reference ?? prepared.blockNumber}`,
            );
            close();
          } else timer.current = setTimeout(observe, 1000);
        } catch (cause) {
          if (cause instanceof CancellationRevertedError)
            retryObservation.current = undefined;
          if (!stopped.current) {
            showOrderError("cancel", cause);
            setStatus("review");
          }
        }
      };
      retryObservation.current = observe;
      try {
        setWalletPrompt(true);
        reference = await sendTransactionAsync(prepared.transaction);
      } catch (cause) {
        setWalletPrompt(false);
        if (isRejected(cause) || isDefiniteFailure(cause))
          retryObservation.current = undefined;
        throw cause;
      }
      setWalletPrompt(false);
      if (stopped.current) return;
      void observe();
    } catch (cause) {
      if (!stopped.current) {
        showOrderError("cancel", cause);
        setStatus("review");
      }
    }
  };
  const amount = (value: bigint, token: StopLossOrder["sellToken"]) =>
    `${token.decimals === null ? `${value} base units` : formatUnits(value, token.decimals)} ${token.symbol}`;
  const triggerPrice = `${new Intl.NumberFormat(undefined, {
    maximumSignificantDigits: 8,
  }).format(
    Number(formatUnits(order.strike, 18)),
  )} ${order.buyToken.symbol} per ${order.sellToken.symbol}`;
  const expires = new Date(order.validTo * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <DialogContent
      closeButton={
        <>
          <PixelIcon name="close" className="size-4" />
          <span className="sr-only">Close</span>
        </>
      }
      className="pixel-frame rescue-dialog max-h-[calc(100dvh-2rem)] overflow-y-auto w-[calc(100vw-2rem)] max-w-md rounded-none border border-border/70 bg-card p-5 text-foreground shadow-2xl sm:p-6"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-5 pr-5">
        <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.18em] text-secondary">
          Air rescue · Order check
        </p>
        <DialogTitle className="font-serif text-[28px] leading-tight tracking-tight">
          Cancel this order?
        </DialogTitle>
        <DialogDescription className="mt-1 leading-relaxed">
          Review the remaining amounts and order terms before confirming
          cancellation.
        </DialogDescription>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="pixel-inset min-w-0 rounded-none border border-border/70 bg-muted/45 p-3.5">
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
        <div className="pixel-inset min-w-0 rounded-none border border-border/70 bg-muted/45 p-3.5">
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
        <div className="pixel-inset col-span-2 min-w-0 rounded-none border border-border/70 bg-muted/45 p-3.5">
          <p className="text-xs font-medium text-muted-foreground">
            Trigger price
          </p>
          <p className="mt-1 break-words text-sm font-semibold tabular-nums">
            {triggerPrice}
          </p>
        </div>
        <div className="pixel-inset col-span-2 min-w-0 rounded-none border border-border/70 bg-muted/45 p-3.5">
          <p className="text-xs font-medium text-muted-foreground">Expires</p>
          <p className="mt-1 break-words text-sm font-semibold tabular-nums">
            {expires}
          </p>
        </div>
      </div>
      <Button
        variant="destructive"
        className="rescue-danger-button pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-12 w-full rounded-none font-semibold"
        disabled={status === "loading"}
        onClick={() => void submit()}
      >
        {status === "loading"
          ? walletPrompt
            ? "Waiting for wallet…"
            : "Cancelling…"
          : "Confirm cancellation"}
      </Button>
    </DialogContent>
  );
}
