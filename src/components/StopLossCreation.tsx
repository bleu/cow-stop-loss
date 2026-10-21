"use client";

import { useEffect, useRef, useState } from "react";
import { Address, maxUint256 } from "viem";
import { useAccount, useSendTransaction } from "wagmi";

import {
  getStopLossPlacement,
  resumeStopLossPlacement,
  useStopLossPlacement,
} from "#/hooks/useStopLossPlacement";
import {
  invalidatePlacementReads,
  PLACEMENT_READ_MAX_AGE,
} from "#/lib/placementReads";
import {
  ApprovalMode,
  buildPlacementApproval,
  buildPlacementSetup,
  FundingSnapshot,
  prefetchPlacementChecks,
  PreparedPlacement,
  preparePlacement,
  refreshPlacementChecks,
} from "#/lib/pollerStopLoss";
import { ChainId, supportedChainIds } from "#/lib/publicClients";
import { PlacementNotSubmittedError } from "#/lib/stopLossPlacement";
import { DraftOrder } from "#/lib/types";

import { showOrderError, showOrderSuccess } from "./orderNotifications";
import { ReviewOrderPanel } from "./ReviewOrderPanel";
import { SwapCard } from "./swap-card/SwapCard";

type Review = {
  order: DraftOrder;
  account: Address;
  chainId: ChainId;
  prepared?: PreparedPlacement;
  checks?: FundingSnapshot;
  fundingOrders?: string;
  busy: boolean;
  refreshRequired?: boolean;
};

function fundingOrdersKey(orders: readonly PreparedPlacement[]) {
  return orders
    .map((order) => order.paramsHash.toLowerCase())
    .sort()
    .join(":");
}

function showPlacementError(
  prepared: PreparedPlacement,
  action: "place" | "approve" | "check",
  cause?: unknown,
) {
  try {
    const record = getStopLossPlacement()
      .getRecords(prepared)
      .find((entry) => entry.prepared.paramsHash === prepared.paramsHash);
    showOrderError(
      action,
      cause,
      record?.error
        ? `${record.id}:${record.attempt}:${record.error}`
        : undefined,
    );
  } catch {
    showOrderError(action, cause);
  }
}

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
    if (!address || !supportedChainIds.includes(chainId as ChainId)) return;
    const scope = { account: address, chainId: chainId as ChainId };
    const prefetch = () => {
      void prefetchPlacementChecks(scope);
    };
    prefetch();
    const timer = setInterval(prefetch, PLACEMENT_READ_MAX_AGE);
    window.addEventListener("focus", prefetch);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", prefetch);
      invalidatePlacementReads(scope);
    };
  }, [address, chainId]);

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
        if (record?.status === "confirmed") {
          showOrderSuccess("place", { ...prepared, hash: prepared.paramsHash });
          setOpen(false);
        } else if (record?.error) {
          showPlacementError(
            prepared,
            record.stage === "setup" ? "place" : "approve",
            record.error,
          );
          setReview((current) => current && { ...current, busy: false });
        }
      } catch (error) {
        showOrderError("check", error);
        setReview((current) => current && { ...current, busy: false });
      }
    };
    update();
    return placement.subscribe(update);
  }, [review?.prepared]);

  useEffect(() => {
    if (trackingError) showOrderError("check", trackingError);
  }, [trackingError]);

  async function loadReview(
    order: DraftOrder,
    selectedChain: ChainId,
    account: Address,
    existing?: PreparedPlacement,
  ) {
    const selectedScope = `${account.toLowerCase()}:${selectedChain}`;
    const revision = ++request.current;
    setReview((current) => ({
      ...(current?.order.id === order.id &&
      current.account.toLowerCase() === account.toLowerCase() &&
      current.chainId === selectedChain
        ? current
        : undefined),
      order,
      account,
      chainId: selectedChain,
      busy: true,
      refreshRequired: false,
    }));
    try {
      const placement = getStopLossPlacement();
      await resumeStopLossPlacement(account, selectedChain);
      await prefetchPlacementChecks({
        account,
        chainId: selectedChain,
        tokenSell: order.tokenSell,
      });
      const prepared =
        existing ??
        (await preparePlacement({
          draft: order,
          account,
          chainId: selectedChain,
        }));
      const localOrders = placement.getConfirmedPlacements(prepared);
      const checks = await refreshPlacementChecks(prepared, { localOrders });
      if (
        currentScope.current !== selectedScope ||
        request.current !== revision
      )
        return;
      if (checks.status === "unknown") throw new Error(checks.error);
      setReview({
        order: prepared.draft,
        account,
        chainId: selectedChain,
        prepared,
        checks,
        fundingOrders: fundingOrdersKey(localOrders),
        busy: false,
      });
      setOpen(true);
    } catch (error) {
      if (
        currentScope.current !== selectedScope ||
        request.current !== revision
      )
        return;
      showOrderError("check", error);
      setReview((current) =>
        current?.checks?.status === "known"
          ? { ...current, busy: false, refreshRequired: true }
          : undefined,
      );
      if (!existing) setOpen(false);
    }
  }

  function fundingChanged() {
    if (!review?.prepared) return false;
    try {
      return (
        review.fundingOrders !==
        fundingOrdersKey(
          getStopLossPlacement().getConfirmedPlacements(review.prepared),
        )
      );
    } catch {
      return true;
    }
  }

  async function approve(mode: ApprovalMode) {
    if (
      review?.refreshRequired ||
      (pending && active?.error) ||
      fundingChanged()
    ) {
      await refreshReview();
      return;
    }
    if (!review?.prepared || review.checks?.status !== "known" || review.busy)
      return;
    const prepared = review.prepared;
    const selectedScope = `${prepared.account.toLowerCase()}:${prepared.chainId}`;
    const revision = request.current;
    setReview({ ...review, busy: true, refreshRequired: false });
    try {
      const placement = getStopLossPlacement();
      const approval = await buildPlacementApproval(prepared, {
        checks: review.checks,
        mode,
      });
      if (
        currentScope.current !== selectedScope ||
        request.current !== revision
      )
        return;
      if (approval.transaction) {
        const transaction = approval.transaction;
        await placement.submit(prepared, "approval", {
          approvalAmount:
            mode === "unlimited" ? maxUint256 : review.checks.requiredAllowance,
          send: async () => {
            if (currentScope.current !== selectedScope)
              throw new PlacementNotSubmittedError(
                "Wallet or chain changed. Review the order again.",
              );
            if (fundingChanged())
              throw new PlacementNotSubmittedError(
                "Funding changed. Review the order again.",
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
        const failure = saved.find(
          (record) => record.prepared.paramsHash === prepared.paramsHash,
        )?.error;
        if (failure) throw new Error(failure);
      }
      if (
        currentScope.current === selectedScope &&
        request.current === revision
      ) {
        invalidatePlacementReads(prepared);
        await loadReview(
          prepared.draft,
          prepared.chainId,
          prepared.account,
          prepared,
        );
      }
    } catch (error) {
      if (
        currentScope.current === selectedScope &&
        request.current === revision
      ) {
        showPlacementError(prepared, "approve", error);
        setReview(
          (current) =>
            current && { ...current, busy: false, refreshRequired: false },
        );
      }
    }
  }

  async function place() {
    if (
      review?.refreshRequired ||
      (pending && active?.error) ||
      fundingChanged()
    ) {
      await refreshReview();
      return;
    }
    if (!review?.prepared || review.checks?.status !== "known" || review.busy)
      return;
    const prepared = review.prepared;
    const selectedScope = `${prepared.account.toLowerCase()}:${prepared.chainId}`;
    const revision = request.current;
    setReview({ ...review, busy: true, refreshRequired: false });
    try {
      const placement = getStopLossPlacement();
      const transaction = await buildPlacementSetup(prepared, {
        checks: review.checks,
      });
      if (
        currentScope.current !== selectedScope ||
        request.current !== revision
      )
        return;
      await placement.submit(prepared, "setup", {
        settlementAmount: review.checks.requiredSettlementAllowance,
        send: async () => {
          if (currentScope.current !== selectedScope)
            throw new PlacementNotSubmittedError(
              "Wallet or chain changed. Review the order again.",
            );
          if (fundingChanged())
            throw new PlacementNotSubmittedError(
              "Funding changed. Review the order again.",
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
        showPlacementError(prepared, "place", error);
        setReview(
          (current) =>
            current && { ...current, busy: false, refreshRequired: false },
        );
      }
    }
  }

  async function refreshReview() {
    if (!review || review.busy) return;
    const saved = review;
    const selectedScope = `${saved.account.toLowerCase()}:${saved.chainId}`;
    const revision = request.current;
    setReview({ ...saved, busy: true, refreshRequired: false });
    try {
      await resumeStopLossPlacement(saved.account, saved.chainId);
      invalidatePlacementReads(saved);
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
      ) {
        showOrderError("check", error);
        setReview(
          (current) =>
            current && { ...current, busy: false, refreshRequired: true },
        );
      }
    }
  }

  const active = records.find(
    (record) =>
      record.status !== "confirmed" &&
      record.prepared.paramsHash === review?.prepared?.paramsHash,
  );
  const pending =
    active?.status === "prompting" || active?.status === "pending";
  return (
    <>
      {review && open ? (
        <ReviewOrderPanel
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
          blocked={Boolean(trackingError)}
          pending={pending && !active?.error}
          onApprove={(mode) => {
            void approve(mode);
          }}
          onPlace={() => {
            void place();
          }}
        />
      ) : null}
      <div
        className={
          review && open ? "hidden" : "rescue-order-form flex min-w-0 flex-col"
        }
      >
        <SwapCard onReviewOrder={loadReview} />
      </div>
    </>
  );
}
