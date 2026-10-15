"use client";

import { Button } from "@bleu/ui";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@radix-ui/react-icons";
import { type ReactNode, useEffect, useState } from "react";
import { formatUnits } from "viem";

import { NetworkLogo } from "#/components/NetworkLogo";
import { TokenLogo } from "#/components/TokenLogo";
import type {
  ApprovalMode,
  FundingSnapshot,
  PreparedPlacement,
} from "#/lib/pollerStopLoss";
import type { ChainId } from "#/lib/publicClients";
import { chainNames } from "#/lib/publicClients";
import type { DraftOrder } from "#/lib/types";

import { BlockExplorerLink } from "./ExplorerLink";

export interface ReviewOrderPanelProps {
  chainId: ChainId;
  order: DraftOrder;
  open: boolean;
  setOpen: (open: boolean) => void;
  prepared?: PreparedPlacement;
  checks?: FundingSnapshot;
  busy?: boolean;
  error?: string;
  pending?: boolean;
  onApprove: (mode: ApprovalMode) => void;
  onPlace: () => void;
  onRetry: () => void;
  onAbandon?: () => void;
}

export function ReviewOrderPanel({
  chainId,
  order,
  open,
  setOpen,
  prepared,
  checks,
  busy = false,
  pending = false,
  error,
  onApprove,
  onPlace,
  onRetry,
  onAbandon,
}: ReviewOrderPanelProps) {
  const [mode, setMode] = useState<ApprovalMode>("limited");
  useEffect(() => setMode("limited"), [order.id, chainId]);
  const funding = checks?.status === "known" ? checks : undefined;
  const reviewError =
    error || (checks?.status === "unknown" ? checks.error : undefined);
  const actionsBlocked =
    !prepared || !funding || Boolean(reviewError) || busy || pending;
  if (!open) return null;
  const needsApproval = funding?.approvalRequired === true;

  return (
    <section
      aria-labelledby="review-order-title"
      aria-label="Review stop-loss order"
      className="flex min-h-0 w-full flex-col gap-3 sm:gap-4"
    >
      <header className="flex items-start gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Edit order"
          title="Edit order"
          className="size-8 shrink-0 rounded-lg text-muted-foreground"
          onClick={() => setOpen(false)}
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Review order
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-1 text-xs font-medium text-muted-foreground">
              <NetworkLogo
                chainId={chainId}
                size={14}
                className="rounded-full"
              />
              {chainNames[chainId]}
            </span>
          </div>
          <h2
            id="review-order-title"
            className="text-lg font-semibold tracking-tight"
          >
            Confirm your order
          </h2>
          <p className="text-[13px] leading-5 text-muted-foreground">
            Check the amounts, trigger, and destination before continuing.
          </p>
        </div>
      </header>
      <div className="grid items-center gap-2 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <AmountSummary
          label="Sell"
          amount={order.amountSell}
          token={order.tokenSell}
          chainId={chainId}
        />
        <ArrowRightIcon
          aria-hidden="true"
          className="mx-auto hidden size-4 text-muted-foreground xl:block"
        />
        <ArrowDownIcon
          aria-hidden="true"
          className="mx-auto size-4 text-muted-foreground xl:hidden"
        />
        <AmountSummary
          label="Receive at least"
          amount={order.amountBuy}
          token={order.tokenBuy}
          chainId={chainId}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InfoCard label="Trigger price" className="col-span-2 xl:col-span-1">
          {order.strikePrice} {order.tokenBuy.symbol} / {order.tokenSell.symbol}
        </InfoCard>
        <InfoCard label="Expires">
          {new Date(order.validTo * 1000).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </InfoCard>
        <InfoCard label="Partial fills">
          {order.partiallyFillable ? "Allowed" : "All or nothing"}
        </InfoCard>
        <InfoCard label="Max slippage">{order.slippagePercent}%</InfoCard>
        <InfoCard label="Oracle price age">
          {order.maxHoursSinceOracleUpdates} hours max
        </InfoCard>
      </div>
      <section className="rounded-xl border border-border/70 bg-background/35 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Order destination
        </h3>
        <AddressLine
          label="Receive address"
          address={order.receiver}
          chainId={chainId}
        />
        {prepared && (
          <AddressLine
            label="Smart account used to execute"
            address={prepared.owner}
            chainId={chainId}
          />
        )}
      </section>
      {funding && (
        <section className="rounded-xl border border-border/70 bg-background/35 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Wallet check
            </h3>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${needsApproval || funding.settlementApprovalRequired ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}
            >
              {needsApproval
                ? "Approval needed"
                : funding.settlementApprovalRequired
                  ? "Setup needed"
                  : "Ready"}
            </span>
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
            <Info label="Balance">
              {formatUnits(funding.balance, order.tokenSell.decimals)}{" "}
              {order.tokenSell.symbol}
            </Info>
            <Info label="Allowance needed">
              {formatUnits(funding.requiredAllowance, order.tokenSell.decimals)}{" "}
              {order.tokenSell.symbol}
            </Info>
            <Info label="Settlement approval">
              {funding.settlementApprovalRequired
                ? "Will approve during setup"
                : "Ready"}
            </Info>
          </dl>
        </section>
      )}
      {funding?.combinedCommitmentsExceedBalance && (
        <p
          role="alert"
          className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-[13px] text-amber-200"
        >
          Your other open orders may use some of this balance. Check them before
          you continue.
        </p>
      )}
      {needsApproval && (
        <fieldset
          disabled={actionsBlocked}
          className="rounded-xl border border-border/70 p-3"
        >
          <legend className="px-1 text-[13px] font-semibold">
            Token approval
          </legend>
          <p className="mb-2 text-[13px] leading-5 text-muted-foreground">
            Choose how much {order.tokenSell.symbol} the order can use.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ApprovalChoice
              checked={mode === "limited"}
              onChange={() => setMode("limited")}
              label="This order only"
              description="Approve the amount shown above."
            />
            <ApprovalChoice
              checked={mode === "unlimited"}
              onChange={() => setMode("unlimited")}
              label="Unlimited"
              description="Keep this approval for later orders."
            />
          </div>
        </fieldset>
      )}
      {pending ? (
        <p role="status" className="text-[13px] text-muted-foreground">
          Transaction pending. Order tracking continues.
        </p>
      ) : null}
      {reviewError && (
        <p role="alert" className="text-[13px] text-red-400">
          {reviewError}
        </p>
      )}
      {onAbandon && (
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-lg"
          disabled={busy || pending}
          onClick={onAbandon}
        >
          Abandon placement
        </Button>
      )}
      <Button
        type="button"
        className="h-10 w-full rounded-xl"
        disabled={busy || (!reviewError && !pending && actionsBlocked)}
        onClick={() =>
          reviewError || pending
            ? onRetry()
            : needsApproval
              ? onApprove(mode)
              : onPlace()
        }
      >
        {busy
          ? needsApproval
            ? "Approving…"
            : "Validating…"
          : reviewError || pending
            ? "Retry"
            : needsApproval
              ? `Approve ${order.tokenSell.symbol}`
              : "Place order"}
      </Button>
    </section>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words font-medium tabular-nums">
        {children}
      </dd>
    </>
  );
}

function AmountSummary({
  label,
  amount,
  token,
  chainId,
}: {
  label: string;
  amount: string;
  token: DraftOrder["tokenSell"];
  chainId: ChainId;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-background/45 p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex min-w-0 items-center gap-2">
        <TokenLogo
          tokenAddress={token.address}
          chainId={chainId}
          alt=""
          aria-hidden="true"
          width={28}
          height={28}
          className="size-7 shrink-0 rounded-full"
        />
        <p className="min-w-0 break-words text-sm font-semibold tabular-nums">
          {amount} <span className="text-muted-foreground">{token.symbol}</span>
        </p>
      </div>
      <BlockExplorerLink
        type="token"
        identifier={token.address}
        networkId={chainId}
        showExternalIcon
        label="Token contract"
        className="mt-2 text-xs"
      />
    </div>
  );
}

function InfoCard({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-border/70 bg-background/35 p-3 ${className ?? ""}`}
    >
      <dl>
        <Info label={label}>{children}</Info>
      </dl>
    </div>
  );
}

function AddressLine({
  label,
  address,
  chainId,
}: {
  label: string;
  address: string;
  chainId: ChainId;
}) {
  return (
    <div className="mt-2 flex min-w-0 items-center justify-between gap-2 text-[13px]">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <BlockExplorerLink
        type="address"
        identifier={address}
        networkId={chainId}
        showExternalIcon
        className="min-w-0 truncate"
      />
    </div>
  );
}

function ApprovalChoice({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition-colors ${checked ? "border-primary/50 bg-primary/10" : "border-border/70 bg-background/35"}`}
    >
      <input
        type="radio"
        name="approval-limit"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 accent-primary"
      />
      <span>
        <span className="block text-[13px] font-medium">{label}</span>
        <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}
