"use client";

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@bleu/ui";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";

import { NetworkLogo } from "#/components/NetworkLogo";
import { TokenLogo } from "#/components/TokenLogo";
import { PixelIcon } from "#/components/ui/pixel-icon";
import type {
  ApprovalMode,
  FundingSnapshot,
  PreparedPlacement,
} from "#/lib/pollerStopLoss";
import type { ChainId } from "#/lib/publicClients";
import { chainNames } from "#/lib/publicClients";
import type { DraftOrder } from "#/lib/types";
import { formatTokenAmount } from "#/utils/amountFormatting";

import { BlockExplorerLink } from "./ExplorerLink";

export interface ReviewOrderPanelProps {
  chainId: ChainId;
  order: DraftOrder;
  open: boolean;
  setOpen: (open: boolean) => void;
  prepared?: PreparedPlacement;
  checks?: FundingSnapshot;
  busy?: boolean;
  pending?: boolean;
  blocked?: boolean;
  onApprove: (mode: ApprovalMode) => void;
  onPlace: () => void;
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
  blocked = false,
  onApprove,
  onPlace,
}: ReviewOrderPanelProps) {
  const [mode, setMode] = useState<ApprovalMode>("limited");
  useEffect(() => setMode("limited"), [order.id, chainId]);
  const funding = checks?.status === "known" ? checks : undefined;
  const actionsBlocked = !prepared || !funding || busy || pending || blocked;
  if (!open) return null;
  const needsApproval = funding?.approvalRequired === true;

  return (
    <section
      aria-label="Review stop-loss order"
      className={`rescue-review ${funding?.combinedCommitmentsExceedBalance ? "rescue-review-with-notice" : ""}`}
    >
      <header className="rescue-review-heading">
        <div>
          <div className="rescue-review-kicker">
            <p className="rescue-review-eyebrow rescue-display-eyebrow">
              Review · Pre-flight check
            </p>
            <span className="rescue-review-network">
              <NetworkLogo
                chainId={chainId}
                size={12}
                className="rounded-full"
              />
              {chainNames[chainId]}
            </span>
          </div>
          <h2 id="review-order-title">Confirm your order</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Edit order"
          title="Edit order"
          className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring size-11 shrink-0 rounded-none border-border bg-card text-muted-foreground hover:text-primary"
          onClick={() => setOpen(false)}
        >
          <PixelIcon name="arrow-left" className="size-4" />
        </Button>
      </header>

      <div
        role="group"
        aria-label="Order amounts"
        className="rescue-review-trade pixel-inset"
      >
        <AmountSummary
          label="Sell"
          amount={order.amountSell}
          token={order.tokenSell}
          chainId={chainId}
        />
        <PixelIcon name="arrow-right" className="size-4 text-primary" />
        <AmountSummary
          label="Receive at least"
          amount={order.amountBuy}
          token={order.tokenBuy}
          chainId={chainId}
        />
      </div>

      <section aria-label="Order terms" className="rescue-review-terms">
        <dl className="rescue-review-price-row">
          <div>
            <dt>
              Trigger price ({order.tokenBuy.symbol}/{order.tokenSell.symbol})
            </dt>
            <dd className="rescue-review-strike">
              <PreciseAmount
                value={order.strikePrice}
                symbol={`${order.tokenBuy.symbol} / ${order.tokenSell.symbol}`}
                kind="price"
              />
            </dd>
          </div>
          <div>
            <dt>Partial fills</dt>
            <dd>{order.partiallyFillable ? "Allowed" : "Off"}</dd>
          </div>
          <div className="rescue-review-expiry">
            <dt>Expires</dt>
            <dd>
              {new Date(order.validTo * 1000).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </section>

      <div className="rescue-review-addresses">
        <section
          aria-label="Order destination"
          className="rescue-review-destination"
        >
          <AddressLine
            label={
              prepared &&
              order.receiver.toLowerCase() !== prepared.account.toLowerCase()
                ? "Custom recipient"
                : "Receive address"
            }
            address={order.receiver}
            chainId={chainId}
          />
          {prepared && (
            <AddressLine
              label="Execution account"
              address={prepared.owner}
              chainId={chainId}
            />
          )}
        </section>

        <section aria-label="Price oracles" className="rescue-review-oracles">
          <AddressLine
            label={`${order.tokenSell.symbol} oracle (${order.maxHoursSinceOracleUpdates}h max age)`}
            tooltip={`${order.tokenSell.symbol} price feed used to check the trigger price. The order cannot execute if the price update is more than ${order.maxHoursSinceOracleUpdates}h old.`}
            address={order.tokenSellOracle}
            chainId={chainId}
          />
          <AddressLine
            label={`${order.tokenBuy.symbol} oracle (${order.maxHoursSinceOracleUpdates}h max age)`}
            tooltip={`${order.tokenBuy.symbol} price feed used to check the trigger price. The order cannot execute if the price update is more than ${order.maxHoursSinceOracleUpdates}h old.`}
            address={order.tokenBuyOracle}
            chainId={chainId}
          />
        </section>
      </div>

      {funding?.combinedCommitmentsExceedBalance && (
        <p
          role="alert"
          className="rescue-review-notice pixel-inset text-warning"
        >
          Your other open orders may use this balance. Check them before
          continuing.
        </p>
      )}
      {needsApproval && (
        <fieldset disabled={actionsBlocked} className="rescue-review-approvals">
          <legend>Token approval</legend>
          <div className="rescue-review-choices">
            <ApprovalChoice
              checked={mode === "limited"}
              onChange={() => setMode("limited")}
              label="Limited"
              description={`${formatTokenAmount(formatUnits(funding!.requiredAllowance, order.tokenSell.decimals), order.tokenSell.decimals)} ${order.tokenSell.symbol}`}
            />
            <ApprovalChoice
              checked={mode === "unlimited"}
              onChange={() => setMode("unlimited")}
              label="Unlimited"
              description="For later orders too"
            />
          </div>
        </fieldset>
      )}
      {!needsApproval && funding && (
        <div className="rescue-review-ready">
          <span className="text-muted-foreground">Wallet check</span>
          <span className="text-success">
            {funding.settlementApprovalRequired
              ? "Ready for setup"
              : "Ready to place"}
          </span>
        </div>
      )}
      <div className="rescue-review-actions">
        <Button
          type="button"
          className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rescue-primary-button h-11 flex-1 rounded-none text-sm"
          disabled={actionsBlocked}
          onClick={() => (needsApproval ? onApprove(mode) : onPlace())}
        >
          {busy || pending
            ? needsApproval
              ? "Approving…"
              : prepared
                ? "Placing…"
                : "Validating…"
            : needsApproval
              ? `Approve ${order.tokenSell.symbol}`
              : "Place order"}
        </Button>
      </div>
    </section>
  );
}

function PreciseAmount({
  value,
  symbol,
  kind = "amount",
  decimals,
}: {
  value: string;
  symbol: string;
  kind?: "amount" | "price";
  decimals?: number;
}) {
  const label = kind === "price" ? "trigger price" : "amount";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`${value} ${symbol}`}
          aria-label={`Show exact ${label}: ${value} ${symbol}`}
          className="rescue-review-inline-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rescue-review-number max-w-full rounded-none text-left underline decoration-dotted decoration-muted-foreground/50 underline-offset-4"
        >
          <span>{formatTokenAmount(value, decimals)}</span>
          {kind === "amount" && (
            <>
              {" "}
              <span className="rescue-review-symbol">{symbol}</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        aria-label={
          kind === "price" ? "Exact trigger price" : "Exact token amount"
        }
        className="pixel-frame rescue-popover w-fit max-w-[calc(100vw-2rem)] rounded-none border border-border bg-popover p-4 text-popover-foreground"
      >
        <p className="mb-1 font-serif text-xs text-muted-foreground">
          Exact {label}
        </p>
        <p className="break-all font-sans text-sm font-medium tabular-nums">
          {value} {symbol}
        </p>
      </PopoverContent>
    </Popover>
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
    <div className="rescue-review-amount">
      <div className="rescue-review-amount-label">
        <span>{label}</span>
      </div>
      <div className="rescue-review-amount-value">
        <TokenLogo
          tokenAddress={token.address}
          chainId={chainId}
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className="size-6 shrink-0 rounded-full"
        />
        <PreciseAmount
          value={amount}
          symbol={token.symbol}
          decimals={token.decimals}
        />
        <BlockExplorerLink
          type="token"
          identifier={token.address}
          networkId={chainId}
          showExternalIcon
          label={<span className="sr-only">{token.symbol} token contract</span>}
          className="shrink-0 gap-0"
        />
      </div>
    </div>
  );
}

function AddressLine({
  label,
  address,
  chainId,
  tooltip,
}: {
  label: string;
  address: string;
  chainId: ChainId;
  tooltip?: string;
}) {
  return (
    <div className="rescue-review-address">
      <span className="inline-flex flex-wrap items-center gap-1">
        {label}
        {tooltip && (
          <Tooltip
            content={tooltip}
            className="rescue-info-tooltip rescue-review-tooltip"
          >
            <button
              type="button"
              aria-label={`About ${label}`}
              className="rescue-review-inline-control rescue-review-info-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring inline-flex items-center justify-center shrink-0 rounded-none text-muted-foreground hover:text-primary"
            >
              <PixelIcon name="info" className="size-4" />
            </button>
          </Tooltip>
        )}
      </span>
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
      className={`rescue-review-choice pixel-inset ${checked ? "rescue-review-choice-selected" : ""}`}
    >
      <input
        type="radio"
        name="approval-limit"
        aria-label={label}
        checked={checked}
        onChange={onChange}
      />
      <span>
        <span className="rescue-review-choice-title">{label}</span>
        <span className="rescue-review-choice-description">{description}</span>
      </span>
    </label>
  );
}
