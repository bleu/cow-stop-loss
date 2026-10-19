"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@bleu/ui";
import { TrashIcon } from "@radix-ui/react-icons";
import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import { useEffect, useRef, useState } from "react";
import { formatUnits, type Hex } from "viem";
import { useAccount, useConfig, useSendTransaction } from "wagmi";
import { getAccount } from "wagmi/actions";

import { PixelIcon } from "#/components/ui/pixel-icon";
import { useCancellationOverlay } from "#/hooks/useOrderList";
import {
  getSafeOrderControls,
  useSafeOrderControls,
} from "#/hooks/useStopLossApprovalRepair";
import { chainNames } from "#/lib/publicClients";
import {
  createSafeTransactionSender,
  type SafeRpcProvider,
} from "#/lib/safeTransactions";
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
          {compact ? (
            <>
              <TrashIcon aria-hidden="true" className="size-4 lg:hidden" />
              <PixelIcon name="trash" className="hidden size-4 lg:block" />
            </>
          ) : (
            "Cancel"
          )}
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
  const { address, chainId, connector } = useAccount();
  const directOwner = address?.toLowerCase() === order.owner.toLowerCase();
  const { records: safeRecords, error: safeTrackingError } =
    useSafeOrderControls(directOwner ? address : undefined, order.chainId);
  const safeRecord = safeRecords
    .filter(
      (record) =>
        record.action === "cancel" &&
        record.order.hash.toLowerCase() === order.hash.toLowerCase() &&
        (record.status !== "confirmed" ||
          record.order.parentId === order.parentId),
    )
    .at(-1);
  const [safeError, setSafeError] = useState<string>();
  const safeExecution = useRef(false);
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
  useEffect(() => {
    if (safeRecord?.status === "confirmed" && address) {
      overlay.confirm(address, order);
      close();
    }
  }, [safeRecord?.status]);
  const submit = async () => {
    if (
      !address ||
      status === "loading" ||
      safeRecord?.status === "pending" ||
      safeTrackingError ||
      safeError
    )
      return;
    setStatus("loading");
    if (retryObservation.current) {
      await retryObservation.current();
      return;
    }
    try {
      if (
        (directOwner ? chainId : getAccount(config).chainId) !== order.chainId
      )
        throw new Error(
          `Switch the wallet to ${chainNames[order.chainId]} before cancelling.`,
        );
      const prepared = await buildCancellation({ account: address, order });
      if (prepared.execution === "safe") {
        safeExecution.current = true;
        if (stopped.current || !connector) return;
        const sdk = connector.id === "safe" ? new SafeAppsSDK() : undefined;
        const provider = sdk
          ? undefined
          : ((await connector.getProvider()) as SafeRpcProvider);
        const sender = sdk
          ? createSafeTransactionSender({
              account: address,
              chainId: order.chainId,
              sdk,
            })
          : createSafeTransactionSender({
              account: address,
              chainId: order.chainId,
              provider: {
                request(request) {
                  if (stopped.current)
                    throw new Error(
                      "Wallet or chain changed. Open the cancellation review again.",
                    );
                  return provider!.request(request);
                },
              },
            });
        await getSafeOrderControls().submitCancellation(prepared, async () => {
          if (stopped.current)
            throw new Error(
              "Wallet or chain changed. Open the cancellation review again.",
            );
          if (sdk) {
            const info = await sdk.safe.getInfo();
            if (
              stopped.current ||
              info.safeAddress.toLowerCase() !== address.toLowerCase() ||
              info.chainId !== order.chainId
            )
              throw new Error(
                "Wallet or chain changed. Open the cancellation review again.",
              );
          }
          return (
            await sender.send([{ ...prepared.transaction, stage: "cancel" }])
          ).reference;
        });
        if (!stopped.current) setStatus("review");
        return;
      }
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
        if (safeExecution.current)
          setSafeError(
            `${cause instanceof Error ? cause.message : "Safe cancellation failed."} No automatic retry was made. Check the Safe before submitting again.`,
          );
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
      className="pixel-frame rescue-dialog max-h-[calc(100dvh-2rem)] overflow-y-auto w-[calc(100vw-2rem)] max-w-md rounded-none border border-border/70 bg-card p-5 text-foreground shadow-2xl sm:p-6"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-5 pr-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-secondary">
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
      {safeRecord?.status === "pending" && (
        <p role="status">Cancellation awaiting signatures.</p>
      )}
      {(safeRecord?.status === "failed" ||
        safeRecord?.status === "cancelled") && (
        <p role="alert">
          Safe cancellation {safeRecord.status}. The order was not marked
          cancelled.
        </p>
      )}
      {(safeError || safeTrackingError) && (
        <p role="alert">{safeError || safeTrackingError}</p>
      )}
      <Button
        variant="destructive"
        className="rescue-danger-button pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-12 w-full rounded-none font-semibold"
        disabled={
          status === "loading" ||
          safeRecord?.status === "pending" ||
          !!safeError ||
          !!safeTrackingError
        }
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
