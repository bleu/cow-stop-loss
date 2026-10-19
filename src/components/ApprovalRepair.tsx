"use client";

import { Button, Dialog, DialogContent, DialogTitle } from "@bleu/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { formatUnits, Hex } from "viem";
import { useAccount, useSendTransaction } from "wagmi";

import {
  getStopLossApprovalRepair,
  resumeStopLossApprovalRepair,
  useStopLossApprovalRepair,
} from "#/hooks/useStopLossApprovalRepair";
import { getStopLossPlacement } from "#/hooks/useStopLossPlacement";
import { GPV2_VAULT_RELAYER_ADDRESS } from "#/lib/contracts";
import {
  ApprovalMode,
  buildApprovalRepair,
  refreshApprovalRepair,
} from "#/lib/pollerStopLoss";
import { StopLossOrder } from "#/lib/stopLossOrders";
import { PlacementNotSubmittedError } from "#/lib/stopLossPlacement";
import { OrderStatus } from "#/lib/types";

export function ApprovalRepair({
  order,
  onRefresh,
}: {
  order: StopLossOrder;
  onRefresh: () => unknown;
}) {
  const { address, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const queryClient = useQueryClient();
  const { records, error: trackingError } = useStopLossApprovalRepair(
    address,
    order.chainId,
  );
  const record = records.find(
    ({ prepared }) =>
      prepared.owner.toLowerCase() === order.owner.toLowerCase() &&
      prepared.paramsHash.toLowerCase() === order.hash.toLowerCase(),
  );
  const pending = records.some(
    ({ status }) => status === "prompting" || status === "pending",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [reconciled, setReconciled] = useState(false);
  const refreshed = useRef<string>();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ApprovalMode>("limited");
  const supported =
    order.isSellOrder &&
    order.sellToken.decimals !== null &&
    (order.status === OrderStatus.OPEN ||
      order.status === OrderStatus.PARTIALLY_FILLED);
  const matches = !!address && chainId === order.chainId;
  const scope = `${address}:${chainId}:${order.owner}:${order.hash}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  useEffect(() => {
    setOpen(false);
    setMode("limited");
    setBusy(false);
    setError(undefined);
    setReconciled(false);
  }, [scope]);
  useEffect(() => {
    if (record?.status !== "confirmed" || refreshed.current === record.id)
      return;
    refreshed.current = record.id;
    void onRefresh();
    void queryClient.invalidateQueries({
      queryKey: ["stop-loss-approval", address?.toLowerCase()],
    });
    void queryClient.invalidateQueries({ queryKey: ["readContract"] });
  }, [record?.id, record?.status, address, onRefresh, queryClient]);
  const review = useQuery({
    queryKey: [
      "stop-loss-approval",
      address?.toLowerCase(),
      chainId,
      order.owner,
      order.hash,
    ],
    enabled: supported && matches,
    queryFn: () =>
      refreshApprovalRepair(
        {
          account: address!,
          chainId: order.chainId,
          owner: order.owner,
          hash: order.hash as Hex,
        },
        {
          localOrders: getStopLossPlacement().getConfirmedPlacements({
            account: address!,
            chainId: order.chainId,
          }),
        },
      ),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const prepared = review.data?.prepared;
  const checks = review.data?.checks;
  async function retry() {
    if (!address || busy || !matches) return;
    const selectedScope = scope;
    setBusy(true);
    setError(undefined);
    try {
      const saved = await resumeStopLossApprovalRepair(address, order.chainId);
      if (currentScope.current !== selectedScope) return;
      if (
        !saved.some(
          ({ status }) => status === "pending" || status === "prompting",
        )
      ) {
        const refreshedReview = await review.refetch();
        if (currentScope.current === selectedScope)
          setReconciled(refreshedReview.data?.checks.status === "known");
        void onRefresh();
        void queryClient.invalidateQueries({
          queryKey: ["stop-loss-approval", address.toLowerCase()],
        });
        void queryClient.invalidateQueries({ queryKey: ["readContract"] });
      }
    } catch (cause) {
      if (currentScope.current === selectedScope)
        setError(
          cause instanceof Error
            ? cause.message
            : "Approval state is unavailable",
        );
    } finally {
      if (currentScope.current === selectedScope) setBusy(false);
    }
  }
  async function submit() {
    if (!prepared || checks?.status !== "known" || busy || pending || !matches)
      return;
    const selectedScope = scope;
    setBusy(true);
    setError(undefined);
    setReconciled(false);
    try {
      const work = await buildApprovalRepair(prepared, { checks, mode });
      if (currentScope.current !== selectedScope || !work[0]) return;
      await getStopLossApprovalRepair().submit(prepared, work[0], async () => {
        if (currentScope.current !== selectedScope)
          throw new PlacementNotSubmittedError(
            "Wallet or chain changed. Open the approval review again.",
          );
        const hash = await sendTransactionAsync(work[0].transaction);
        return {
          id: hash,
          transactionHash: /^0x[0-9a-fA-F]{64}$/.test(hash) ? hash : undefined,
        };
      });
      await resumeStopLossApprovalRepair(prepared.account, prepared.chainId);
    } catch (cause) {
      if (currentScope.current === selectedScope)
        setError(
          cause instanceof Error ? cause.message : "Approval update failed",
        );
    } finally {
      if (currentScope.current === selectedScope) setBusy(false);
    }
  }
  if (!supported || !matches) return null;
  if (
    !pending &&
    checks?.status === "known" &&
    !checks.approvalRequired &&
    !checks.settlementApprovalRequired
  )
    return record?.status === "confirmed" ? (
      <p role="status">Approval update confirmed.</p>
    ) : null;
  const units = (value: bigint) =>
    `${formatUnits(value, prepared?.draft.tokenSell.decimals ?? order.sellToken.decimals!)} ${prepared?.draft.tokenSell.symbol ?? order.sellToken.symbol}`;
  return (
    <>
      <div className="mb-5 flex justify-end">
        <Button
          variant="outline"
          className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-11 rounded-none border-primary/30 bg-primary/10 px-5 text-primary shadow-sm hover:bg-primary/20 hover:text-primary"
          onClick={() => {
            setMode("limited");
            setOpen(true);
          }}
        >
          Update approval
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="pixel-frame rescue-dialog max-h-[85dvh] w-[calc(100vw-2rem)] max-w-xl overflow-y-auto rounded-none border border-border/70 bg-card p-5 text-foreground shadow-2xl sm:p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-secondary">
            Air rescue · Token clearance
          </p>
          <DialogTitle className="font-serif text-[28px] leading-tight tracking-tight">
            Update approval
          </DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            These permissions are shared by stop-loss orders. Unlimited approval
            does not reserve funds.
          </p>
          {review.isFetching && (
            <p role="status" className="text-sm text-muted-foreground">
              Loading approval state...
            </p>
          )}
          {(checks?.status === "unknown" || review.error) && (
            <p
              role="alert"
              className="pixel-inset rounded-none bg-destructive/10 p-3 text-sm text-destructive"
            >
              {checks?.status === "unknown"
                ? checks.error
                : review.error?.message}
            </p>
          )}
          {prepared && checks?.status === "known" && (
            <>
              {checks.approvalRequired && (
                <section
                  aria-label="Wallet approval"
                  className="pixel-inset space-y-3 rounded-none border border-border/70 bg-background/45 p-4"
                >
                  <h3 className="font-semibold">Wallet-to-Poller approval</h3>
                  <div className="space-y-1 break-all text-sm text-muted-foreground">
                    <p>Token: {prepared.draft.tokenSell.address}</p>
                    <p>Spender: {prepared.poller}</p>
                    <p>Current allowance: {units(checks.currentAllowance)}</p>
                    <p>Required total: {units(checks.requiredAllowance)}</p>
                  </div>
                  <fieldset
                    aria-label="Approval amount"
                    className="pixel-inset flex flex-wrap gap-4 rounded-none border border-border/70 bg-card/70 p-3 text-sm"
                  >
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="repair-approval-mode"
                        checked={mode === "limited"}
                        onChange={() => setMode("limited")}
                      />
                      Limited
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="repair-approval-mode"
                        checked={mode === "unlimited"}
                        onChange={() => setMode("unlimited")}
                      />
                      Unlimited
                    </label>
                  </fieldset>
                  <p className="text-sm">
                    Target:{" "}
                    {mode === "limited"
                      ? units(checks.requiredAllowance)
                      : "Unlimited (max uint256)"}
                  </p>
                  {checks.combinedCommitmentsExceedBalance && (
                    <p className="text-sm text-warning">
                      The required total exceeds your wallet balance. Approval
                      does not reserve funds.
                    </p>
                  )}
                </section>
              )}
              {checks.settlementApprovalRequired && (
                <section
                  aria-label="Settlement approval"
                  className="pixel-inset space-y-2 break-all rounded-none border border-primary/25 bg-primary/5 p-4 text-sm"
                >
                  <h3>CowShed settlement approval</h3>
                  <p>Token: {prepared.draft.tokenSell.address}</p>
                  <p>Spender: {GPV2_VAULT_RELAYER_ADDRESS}</p>
                  <p>
                    Current allowance:{" "}
                    {units(checks.currentSettlementAllowance)}
                  </p>
                  <p>
                    Required remaining total:{" "}
                    {units(checks.requiredSettlementAllowance)}
                  </p>
                  <p>Target: Unlimited (max uint256)</p>
                </section>
              )}
            </>
          )}
          {(error || trackingError || (!reconciled && record?.error)) && (
            <p
              role="alert"
              className="pixel-inset rounded-none bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error ?? trackingError ?? record?.error}
            </p>
          )}
          {pending && (
            <p
              role="status"
              className="pixel-inset rounded-none bg-primary/10 p-3 text-sm"
            >
              Approval transaction pending. You can close this review. No new
              transaction will be sent.
            </p>
          )}
          {checks?.status === "known" && (
            <Button
              className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-12 rounded-none"
              onClick={() => void submit()}
              disabled={
                busy ||
                pending ||
                review.isFetching ||
                !!error ||
                !!trackingError ||
                (!reconciled &&
                  (record?.status === "failed" ||
                    record?.status === "rejected"))
              }
            >
              Submit approval update
            </Button>
          )}
          {(checks?.status === "unknown" ||
            review.error ||
            pending ||
            error ||
            trackingError ||
            record?.status === "failed" ||
            record?.status === "rejected") && (
            <Button
              onClick={() => void retry()}
              variant="outline"
              className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-12 rounded-none"
              disabled={busy || review.isFetching}
            >
              Retry
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
