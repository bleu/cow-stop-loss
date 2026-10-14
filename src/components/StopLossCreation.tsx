"use client";

import { useEffect, useRef, useState } from "react";
import { Address } from "viem";
import { useAccount, useSendTransaction } from "wagmi";

import {
  abandonStopLossPlacement,
  getStopLossPlacement,
  resumeStopLossPlacement,
  useStopLossPlacement,
} from "#/hooks/useStopLossPlacement";
import {
  buildPlacementApproval,
  buildPlacementSetup,
  FundingSnapshot,
  PreparedPlacement,
  preparePlacement,
  refreshPlacementChecks,
} from "#/lib/pollerStopLoss";
import { ChainId } from "#/lib/publicClients";
import { PlacementNotSubmittedError } from "#/lib/stopLossPlacement";
import { DraftOrder } from "#/lib/types";

import { ReviewOrdersDialog } from "./ReviewOrdersDialog";
import { SwapCard } from "./swap-card/SwapCard";

type Review = {
  order: DraftOrder;
  account: Address;
  chainId: ChainId;
  prepared?: PreparedPlacement;
  checks?: FundingSnapshot;
  busy: boolean;
  error?: string;
};

export function StopLossCreation() {
  const { address, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { records, error: trackingError } = useStopLossPlacement(
    address,
    chainId as ChainId,
  );
  const [review, setReview] = useState<Review>();
  const [open, setOpen] = useState(false);
  const scope = `${address?.toLowerCase()}:${chainId}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const request = useRef(0);

  useEffect(() => {
    request.current += 1;
    setOpen(false);
    setReview(undefined);
  }, [scope]);

  useEffect(() => {
    const prepared = review?.prepared;
    if (!prepared) return;
    const placement = getStopLossPlacement();
    const update = () => {
      try {
        const record = placement
          .getRecords(prepared)
          .find((entry) => entry.prepared.paramsHash === prepared.paramsHash);
        if (record?.status === "confirmed") setOpen(false);
        else if (record?.error)
          setReview(
            (current) => current && { ...current, error: record.error },
          );
      } catch (error) {
        setReview(
          (current) =>
            current && {
              ...current,
              error:
                error instanceof Error
                  ? error.message
                  : "Saved placement is unavailable",
            },
        );
      }
    };
    update();
    return placement.subscribe(update);
  }, [review?.prepared]);

  async function loadReview(
    order: DraftOrder,
    selectedChain: ChainId,
    account: Address,
    existing?: PreparedPlacement,
  ) {
    const selectedScope = `${account.toLowerCase()}:${selectedChain}`;
    const revision = ++request.current;
    setReview({ order, account, chainId: selectedChain, busy: true });
    setOpen(true);
    try {
      const placement = getStopLossPlacement();
      if (!existing) {
        await resumeStopLossPlacement(account, selectedChain);
        if (
          placement
            .getRecords({ account, chainId: selectedChain })
            .some((record) => record.status !== "confirmed")
        ) {
          if (
            currentScope.current === selectedScope &&
            request.current === revision
          ) {
            setOpen(false);
            setReview(undefined);
          }
          return;
        }
      }
      const prepared =
        existing ??
        (await preparePlacement({
          draft: order,
          account,
          chainId: selectedChain,
        }));
      const checks = await refreshPlacementChecks(prepared, {
        localOrders: placement.getConfirmedPlacements(prepared),
      });
      if (
        currentScope.current !== selectedScope ||
        request.current !== revision
      )
        return;
      setReview({
        order: prepared.draft,
        account,
        chainId: selectedChain,
        prepared,
        checks,
        busy: false,
      });
    } catch (error) {
      if (
        currentScope.current !== selectedScope ||
        request.current !== revision
      )
        return;
      setReview({
        order,
        account,
        chainId: selectedChain,
        prepared: existing,
        busy: false,
        error: error instanceof Error ? error.message : "Review is unavailable",
      });
    }
  }

  async function approve() {
    if (!review?.prepared || review.checks?.status !== "known" || review.busy)
      return;
    const prepared = review.prepared;
    const selectedScope = `${prepared.account.toLowerCase()}:${prepared.chainId}`;
    const revision = request.current;
    setReview({ ...review, busy: true, error: undefined });
    try {
      const placement = getStopLossPlacement();
      const approval = await buildPlacementApproval(prepared, {
        reviewedRequiredAllowance: review.checks.requiredAllowance,
        localOrders: placement.getConfirmedPlacements(prepared),
      });
      if (
        currentScope.current !== selectedScope ||
        request.current !== revision
      )
        return;
      if (approval.transaction) {
        const transaction = approval.transaction;
        await placement.submit(
          prepared,
          approval.kind === "reset" ? "approval-reset" : "approval",
          {
            approvalAmount: review.checks.requiredAllowance,
            send: async () => {
              if (currentScope.current !== selectedScope)
                throw new PlacementNotSubmittedError(
                  "Wallet or chain changed. Review the order again.",
                );
              const hash = await sendTransactionAsync(transaction);
              return {
                id: hash,
                transactionHash: /^0x[0-9a-fA-F]{64}$/.test(hash)
                  ? hash
                  : undefined,
              };
            },
          },
        );
        const saved = await resumeStopLossPlacement(
          prepared.account,
          prepared.chainId,
        );
        const failure = saved.find(
          (record) => record.prepared.paramsHash === prepared.paramsHash,
        )?.error;
        if (failure) throw new Error(failure);
      }
      if (
        currentScope.current === selectedScope &&
        request.current === revision
      )
        await loadReview(
          prepared.draft,
          prepared.chainId,
          prepared.account,
          prepared,
        );
    } catch (error) {
      if (
        currentScope.current === selectedScope &&
        request.current === revision
      ) {
        setReview(
          (current) =>
            current && {
              ...current,
              busy: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Approval is unavailable",
            },
        );
      }
    }
  }

  async function place() {
    if (!review?.prepared || review.checks?.status !== "known" || review.busy)
      return;
    const prepared = review.prepared;
    const selectedScope = `${prepared.account.toLowerCase()}:${prepared.chainId}`;
    const revision = request.current;
    setReview({ ...review, busy: true, error: undefined });
    try {
      const placement = getStopLossPlacement();
      const transaction = await buildPlacementSetup(prepared, {
        reviewedRequiredAllowance: review.checks.requiredAllowance,
        localOrders: placement.getConfirmedPlacements(prepared),
      });
      if (
        currentScope.current !== selectedScope ||
        request.current !== revision
      )
        return;
      await placement.submit(prepared, "setup", {
        send: async () => {
          if (currentScope.current !== selectedScope)
            throw new PlacementNotSubmittedError(
              "Wallet or chain changed. Review the order again.",
            );
          const hash = await sendTransactionAsync(transaction);
          return {
            id: hash,
            transactionHash: /^0x[0-9a-fA-F]{64}$/.test(hash)
              ? hash
              : undefined,
          };
        },
      });
      const saved = await resumeStopLossPlacement(
        prepared.account,
        prepared.chainId,
      );
      if (
        currentScope.current !== selectedScope ||
        request.current !== revision
      )
        return;
      const failure = saved.find(
        (record) => record.prepared.paramsHash === prepared.paramsHash,
      )?.error;
      if (failure) throw new Error(failure);
      if (
        saved.some(
          (record) =>
            record.status === "confirmed" &&
            record.prepared.paramsHash === prepared.paramsHash,
        )
      )
        setOpen(false);
      setReview((current) => current && { ...current, busy: false });
    } catch (error) {
      if (
        currentScope.current === selectedScope &&
        request.current === revision
      ) {
        setReview(
          (current) =>
            current && {
              ...current,
              busy: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Placement is unavailable",
            },
        );
      }
    }
  }

  async function retry() {
    if (!review || review.busy) return;
    const saved = review;
    const selectedScope = `${saved.account.toLowerCase()}:${saved.chainId}`;
    const revision = request.current;
    setReview({ ...saved, busy: true, error: undefined });
    try {
      await resumeStopLossPlacement(saved.account, saved.chainId);
      if (
        currentScope.current === selectedScope &&
        request.current === revision
      ) {
        await loadReview(
          saved.order,
          saved.chainId,
          saved.account,
          saved.prepared,
        );
      }
    } catch (error) {
      if (
        currentScope.current === selectedScope &&
        request.current === revision
      )
        setReview(
          (current) =>
            current && {
              ...current,
              busy: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Placement tracking is unavailable",
            },
        );
    }
  }

  async function abandon() {
    if (!review?.prepared || review.busy) return;
    const prepared = review.prepared;
    const selectedScope = `${prepared.account.toLowerCase()}:${prepared.chainId}`;
    const revision = request.current;
    const record = getStopLossPlacement()
      .getRecords(prepared)
      .find((entry) => entry.prepared.paramsHash === prepared.paramsHash);
    if (!record) return;
    setReview({ ...review, busy: true });
    try {
      await abandonStopLossPlacement(
        prepared.account,
        prepared.chainId,
        record.id,
      );
      if (
        currentScope.current !== selectedScope ||
        request.current !== revision
      )
        return;
      request.current += 1;
      setOpen(false);
      setReview(undefined);
    } catch (error) {
      if (
        currentScope.current !== selectedScope ||
        request.current !== revision
      )
        return;
      setReview(
        (current) =>
          current && {
            ...current,
            busy: false,
            error:
              error instanceof Error
                ? error.message
                : "Placement cannot be abandoned",
          },
      );
    }
  }

  const active = records.find((record) => record.status !== "confirmed");
  const latest = records.at(-1);
  const pending =
    active?.status === "prompting" || active?.status === "pending";
  return (
    <>
      {!open && (trackingError || latest?.error) && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {trackingError || latest?.error}
        </p>
      )}
      {active && (
        <div className="mb-4 rounded border p-3">
          <p>
            {active.status === "ready"
              ? "Approval confirmed. Continue to the next step."
              : "Placement is pending. No new wallet request will be sent automatically."}
          </p>
          <button
            className="text-primary underline"
            onClick={() => {
              void loadReview(
                active.prepared.draft,
                active.prepared.chainId,
                active.prepared.account,
                active.prepared,
              );
            }}
          >
            Continue placement
          </button>
        </div>
      )}
      <SwapCard
        reviewDisabled={Boolean(active)}
        onReviewOrder={(order, selectedChain, account) => {
          void loadReview(order, selectedChain, account);
        }}
      />
      {review && (
        <ReviewOrdersDialog
          chainId={review.chainId}
          order={review.order}
          open={open}
          setOpen={(nextOpen) => {
            if (!nextOpen) request.current += 1;
            setOpen(nextOpen);
          }}
          prepared={review.prepared}
          checks={review.checks}
          busy={review.busy}
          error={review.error ?? trackingError}
          pending={pending}
          onAbandon={
            active && active.prepared.paramsHash === review.prepared?.paramsHash
              ? () => {
                  void abandon();
                }
              : undefined
          }
          onApprove={() => {
            void approve();
          }}
          onPlace={() => {
            void place();
          }}
          onRetry={() => {
            void retry();
          }}
        />
      )}
    </>
  );
}
