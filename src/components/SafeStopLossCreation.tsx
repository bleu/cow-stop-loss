"use client";

import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import { useEffect, useRef, useState } from "react";
import { type Address, formatUnits, zeroAddress } from "viem";
import { useAccount } from "wagmi";

import {
  getSafeStopLossPlacement,
  useSafeStopLossPlacement,
} from "#/hooks/useSafeStopLossPlacement";
import {
  EXTENSIBLE_FALLBACK_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
} from "#/lib/contracts";
import {
  type ChainId,
  chainNames,
  supportedChainIds,
} from "#/lib/publicClients";
import {
  buildSafePlacementPlan,
  type PreparedSafePlacement,
  prepareSafePlacement,
  readSafePlacementChecks,
  type SafePlacementChecks,
} from "#/lib/safeStopLoss";
import {
  createSafeTransactionSender,
  type SafeRpcProvider,
} from "#/lib/safeTransactions";
import { PlacementNotSubmittedError } from "#/lib/stopLossPlacement";
import type { DraftOrder } from "#/lib/types";

import { SwapCard } from "./swap-card/SwapCard";

type Review = {
  prepared: PreparedSafePlacement;
  checks: SafePlacementChecks;
  mode: "batch" | "sequential";
};

export function SafeStopLossCreation() {
  const { address, chainId, connector } = useAccount();
  const { records, error: trackingError } = useSafeStopLossPlacement(
    address,
    chainId as ChainId,
  );
  const [review, setReview] = useState<Review>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [now, setNow] = useState(Date.now);
  const scope = `${address?.toLowerCase()}:${chainId}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const revision = useRef(0);

  useEffect(() => {
    currentScope.current = scope;
    revision.current += 1;
    setReview(undefined);
    setBusy(false);
    setError(undefined);
    return () => {
      currentScope.current = "";
      revision.current += 1;
    };
  }, [scope]);

  useEffect(() => {
    const nextExpiry = Math.min(
      ...records
        .map((record) => record.prepared.draft.validTo * 1000)
        .filter((expiry) => expiry > Date.now()),
    );
    if (!Number.isFinite(nextExpiry)) return;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(nextExpiry - Date.now() + 1, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [records, now]);

  async function readChecks(prepared: PreparedSafePlacement) {
    const localOrders = getSafeStopLossPlacement()
      .getRecords(prepared)
      .filter(
        (record) =>
          (record.status === "pending" ||
            record.status === "ready" ||
            record.status === "confirmed") &&
          record.steps.some(
            (step) =>
              step.status !== "failed" &&
              step.status !== "cancelled" &&
              step.calls.some((call) => call.stage === "create"),
          ),
      )
      .map((record) => record.prepared);
    return readSafePlacementChecks(prepared, { localOrders });
  }

  async function loadReview(
    draft: DraftOrder,
    selectedChain: ChainId,
    account: Address,
    existing?: PreparedSafePlacement,
  ) {
    const selectedScope = `${account.toLowerCase()}:${selectedChain}`;
    if (
      selectedScope !== currentScope.current ||
      !connector ||
      !supportedChainIds.includes(selectedChain)
    )
      return;
    const request = ++revision.current;
    setBusy(true);
    setError(undefined);
    try {
      const prepared =
        existing ??
        (await prepareSafePlacement({
          draft,
          chainId: selectedChain,
          account,
        }));
      const checks = await readChecks(prepared);
      buildSafePlacementPlan(prepared, checks);
      const sender =
        connector.id === "safe"
          ? createSafeTransactionSender({
              account,
              chainId: selectedChain,
              sdk: new SafeAppsSDK(),
            })
          : createSafeTransactionSender({
              account,
              chainId: selectedChain,
              provider: (await connector.getProvider()) as SafeRpcProvider,
            });
      const mode = await sender.mode();
      if (
        currentScope.current !== selectedScope ||
        revision.current !== request
      )
        return;
      setReview({ prepared, checks, mode });
    } catch (cause) {
      if (
        currentScope.current === selectedScope &&
        revision.current === request
      )
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not check the Safe order.",
        );
    } finally {
      if (
        currentScope.current === selectedScope &&
        revision.current === request
      )
        setBusy(false);
    }
  }

  async function submit() {
    if (!review || busy || trackingError || !connector) return;
    const { prepared } = review;
    const selectedScope = `${prepared.account.toLowerCase()}:${prepared.chainId}`;
    const request = revision.current;
    const assertScope = () => {
      if (
        currentScope.current !== selectedScope ||
        revision.current !== request
      )
        throw new PlacementNotSubmittedError(
          "Wallet or chain changed. Review the order again.",
        );
    };
    setBusy(true);
    setError(undefined);
    try {
      assertScope();
      const checks = await readChecks(prepared);
      const { calls } = buildSafePlacementPlan(prepared, checks);
      assertScope();
      const { calls: reviewedCalls } = buildSafePlacementPlan(
        prepared,
        review.checks,
      );
      if (
        calls.length !== reviewedCalls.length ||
        calls.some((call, index) => {
          const reviewed = reviewedCalls[index];
          return (
            call.to.toLowerCase() !== reviewed.to.toLowerCase() ||
            call.data.toLowerCase() !== reviewed.data.toLowerCase() ||
            call.value !== reviewed.value ||
            call.stage !== reviewed.stage
          );
        }) ||
        checks.fallbackHandler.toLowerCase() !==
          review.checks.fallbackHandler.toLowerCase() ||
        checks.domainVerifier.toLowerCase() !==
          review.checks.domainVerifier.toLowerCase() ||
        checks.requiredAllowance !== review.checks.requiredAllowance
      ) {
        setReview({ ...review, checks });
        throw new PlacementNotSubmittedError(
          "Safe setup or funding changed. Review the order again.",
        );
      }
      const sdk = connector.id === "safe" ? new SafeAppsSDK() : undefined;
      const provider = sdk
        ? undefined
        : ((await connector.getProvider()) as SafeRpcProvider);
      const sender = sdk
        ? createSafeTransactionSender({
            account: prepared.account,
            chainId: prepared.chainId,
            sdk,
          })
        : createSafeTransactionSender({
            account: prepared.account,
            chainId: prepared.chainId,
            provider: {
              request: async (request) => {
                assertScope();
                return provider!.request(request);
              },
            },
          });
      const mode = await sender.mode();
      assertScope();
      if (mode !== review.mode) {
        setReview({ ...review, checks, mode });
        throw new PlacementNotSubmittedError(
          "Safe submission mode changed. Review the order again.",
        );
      }
      await getSafeStopLossPlacement().submit(prepared, {
        send: async () => {
          assertScope();
          if (sdk) {
            const info = await sdk.safe.getInfo();
            assertScope();
            if (
              info.safeAddress.toLowerCase() !==
                prepared.account.toLowerCase() ||
              info.chainId !== prepared.chainId
            )
              throw new PlacementNotSubmittedError(
                "Wallet or chain changed. Review the order again.",
              );
          }
          return sender.send(calls, { expectedMode: review.mode });
        },
      });
      if (
        currentScope.current === selectedScope &&
        revision.current === request
      )
        setReview(undefined);
    } catch (cause) {
      if (
        currentScope.current === selectedScope &&
        revision.current === request
      )
        setError(
          `${cause instanceof Error ? cause.message : "Could not submit the Safe order."} No automatic retry was made. Check the Safe before you submit again.`,
        );
    } finally {
      if (
        currentScope.current === selectedScope &&
        revision.current === request
      )
        setBusy(false);
    }
  }

  const active = records.find(
    (record) =>
      record.prepared.draft.validTo > Math.floor(Date.now() / 1000) &&
      (record.status === "pending" ||
        record.status === "ready" ||
        record.status === "paused"),
  );
  const draft = review?.prepared.draft;
  const replacesHandler =
    review &&
    review.checks.fallbackHandler !== zeroAddress &&
    review.checks.fallbackHandler.toLowerCase() !==
      EXTENSIBLE_FALLBACK_ADDRESS.toLowerCase();

  return (
    <>
      {(error || trackingError || active?.error) && (
        <p role="alert">{error || trackingError || active?.error}</p>
      )}
      {active?.status === "paused" && (
        <p>
          Check the Safe transaction history before you continue. The last
          wallet response could not be verified. No automatic retry was made.
        </p>
      )}
      {active?.status === "pending" && <p role="status">Awaiting signatures</p>}
      {active?.status === "ready" && !review && (
        <div className="pixel-inset mb-4 border border-border/70 bg-muted/45 p-3">
          <p>The previous Safe transaction executed. Review the next step.</p>
          <button
            type="button"
            className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rescue-primary-button mt-3 rounded-none px-4 text-sm disabled:opacity-50"
            disabled={busy || Boolean(trackingError)}
            onClick={() =>
              void loadReview(
                active.prepared.draft,
                active.prepared.chainId,
                active.prepared.account,
                active.prepared,
              )
            }
          >
            Continue placement
          </button>
        </div>
      )}
      {review && draft ? (
        <section
          aria-label="Review Safe stop-loss order"
          className="rescue-review"
        >
          <header className="rescue-review-heading">
            <div>
              <p className="rescue-review-eyebrow rescue-display-eyebrow">
                Review · Pre-flight check
              </p>
              <h2>Confirm your Safe order</h2>
            </div>
            <button
              type="button"
              className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 rounded-none border border-border bg-card px-3 text-muted-foreground hover:text-primary"
              disabled={busy}
              onClick={() => setReview(undefined)}
            >
              Edit order
            </button>
          </header>
          <dl className="rescue-review-terms pixel-inset border border-border/70 bg-muted/35 p-3 [&>div]:grid [&>div]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] [&>div]:gap-3 [&_dd]:break-all [&_dd]:text-right [&_dt]:font-serif [&_dt]:text-muted-foreground">
            <div>
              <dt>Network</dt>
              <dd>{chainNames[review.prepared.chainId]}</dd>
            </div>
            <div>
              <dt>Token approval</dt>
              <dd>
                {review.checks.allowance < review.checks.requiredAllowance
                  ? `${formatUnits(review.checks.requiredAllowance, draft.tokenSell.decimals)} ${draft.tokenSell.symbol}`
                  : "Already approved"}
              </dd>
            </div>
            <div>
              <dt>Approval spender</dt>
              <dd>{GPV2_VAULT_RELAYER_ADDRESS}</dd>
            </div>
            <div>
              <dt>Sell</dt>
              <dd>
                {draft.amountSell} {draft.tokenSell.symbol}
              </dd>
            </div>
            <div>
              <dt>Receive at least</dt>
              <dd>
                {draft.amountBuy} {draft.tokenBuy.symbol}
              </dd>
            </div>
            <div>
              <dt>Trigger price</dt>
              <dd>
                {draft.strikePrice} {draft.tokenBuy.symbol} /{" "}
                {draft.tokenSell.symbol}
              </dd>
            </div>
            <div>
              <dt>Partial fills</dt>
              <dd>{draft.partiallyFillable ? "Allowed" : "Off"}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{new Date(draft.validTo * 1000).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Safe execution account</dt>
              <dd>{review.prepared.account}</dd>
            </div>
            <div>
              <dt>Receive address</dt>
              <dd>{draft.receiver}</dd>
            </div>
            <div>
              <dt>{draft.tokenSell.symbol} oracle</dt>
              <dd>{draft.tokenSellOracle}</dd>
            </div>
            <div>
              <dt>{draft.tokenBuy.symbol} oracle</dt>
              <dd>{draft.tokenBuyOracle}</dd>
            </div>
            <div>
              <dt>Maximum oracle age</dt>
              <dd>{draft.maxHoursSinceOracleUpdates} hours</dd>
            </div>
          </dl>
          {replacesHandler && (
            <p className="rescue-review-notice pixel-inset">
              Replace the current Safe fallback handler (
              {review.checks.fallbackHandler}) with ExtensibleFallbackHandler (
              {EXTENSIBLE_FALLBACK_ADDRESS}). This changes how the Safe handles
              fallback calls.
            </p>
          )}
          <p className="rescue-review-notice pixel-inset">
            {review.mode === "batch"
              ? "One atomic batch: required Safe setup, token approval and order creation execute together."
              : "Sequential transactions: wait for each transaction to execute, then continue to the next step. The order keeps its fixed expiry."}
          </p>
          <button
            type="button"
            className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rescue-primary-button w-full rounded-none px-4 text-sm disabled:opacity-50"
            disabled={
              busy ||
              (Boolean(active) &&
                !(
                  active?.status === "ready" &&
                  active.prepared.paramsHash === review.prepared.paramsHash
                )) ||
              Boolean(trackingError)
            }
            onClick={() => void submit()}
          >
            {busy ? "Submitting Safe order..." : "Submit Safe order"}
          </button>
        </section>
      ) : null}
      <div
        className={
          review ? "hidden" : "rescue-order-form flex min-w-0 flex-col"
        }
      >
        <SwapCard
          reviewDisabled={busy || Boolean(active) || Boolean(trackingError)}
          onReviewOrder={loadReview}
        />
      </div>
    </>
  );
}
