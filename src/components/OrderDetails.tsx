"use client";

import Link from "next/link";
import React, { useId, useState } from "react";
import useSWR from "swr";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { NetworkLogo } from "#/components/NetworkLogo";
import { TokenLogo } from "#/components/TokenLogo";
import { PixelIcon } from "#/components/ui/pixel-icon";
import { useOrderList } from "#/hooks/useOrderList";
import { fetchOraclePairPrice } from "#/lib/oraclePrice";
import { loadOrderFundingHealth } from "#/lib/orderFundingHealth";
import { ChainId, chainNames, publicClientsFromIds } from "#/lib/publicClients";
import { OrderToken, StopLossOrder } from "#/lib/stopLossOrders";
import { OrderStatus } from "#/lib/types";
import {
  buildBlockExplorerTxUrl,
  buildOrderCowExplorerUrl,
  truncateAddress,
} from "#/utils";

import { CancelOrderDialog } from "./CancelOrderDialog";
import { BlockExplorerLink } from "./ExplorerLink";
import { OracleTokenPrice } from "./OracleTokenPrice";

async function loadOrderHealth(order: StopLossOrder) {
  const client = publicClientsFromIds[order.chainId];
  const [funding, currentPrice] = await Promise.all([
    loadOrderFundingHealth(order, client),
    fetchOraclePairPrice({
      chainId: order.chainId,
      route: {
        tokenSellOracle: order.sellTokenPriceOracle,
        tokenBuyOracle: order.buyTokenPriceOracle,
      },
      maxAge: order.maxTimeSinceLastOracleUpdate,
    }).catch(() => Number.NaN),
  ]);
  return { funding, currentPrice };
}

function OrderHealth({ order }: { order: StopLossOrder }) {
  const { address } = useAccount();
  const { data } = useSWR(
    [
      OrderStatus.OPEN,
      OrderStatus.PARTIALLY_FILLED,
      OrderStatus.CANCELLING,
      OrderStatus.PARTIALLY_FILLED_AND_CANCELLING,
    ].includes(order.status)
      ? [
          "orderHealth",
          address?.toLowerCase(),
          order.chainId,
          order.owner,
          order.hash,
          order.funding,
          order.sellAmount.toString(),
          order.executedSellAmount?.toString(),
        ]
      : null,
    () => loadOrderHealth(order),
    { refreshInterval: 30_000, revalidateOnFocus: false },
  );
  if (!data) return null;

  const funding = data.funding;
  const messages =
    funding.status === "unknown"
      ? ["Unable to verify order funding. Please try again."]
      : [
          funding.insufficientBalance &&
            funding.source !== "cowshed" &&
            "Not enough sell tokens in your wallet.",
          (funding.insufficientFundingApproval ||
            funding.insufficientSettlementApproval) &&
            "Token approval is missing or too low.",
        ].filter((message): message is string => Boolean(message));
  const trigger = Number(formatUnits(order.strike, 18));
  const limit = Number(order.limitPrice);
  const showPrice =
    Number.isFinite(data.currentPrice) &&
    Number.isFinite(trigger) &&
    Number.isFinite(limit) &&
    limit > 0 &&
    data.currentPrice < trigger;
  const belowLimit = data.currentPrice < limit;
  if (!messages.length && !showPrice) return null;

  return (
    <>
      {messages.length > 0 && (
        <aside
          role="alert"
          className="pixel-inset mb-5 rounded-none border border-destructive/35 bg-destructive/8 p-4 text-sm"
        >
          <p className="font-semibold text-destructive">
            Order needs attention
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </aside>
      )}
      {showPrice && (
        <aside
          role="status"
          className="pixel-inset mb-5 rounded-none border border-primary/20 bg-primary/5 p-4 text-sm"
        >
          <p className="font-semibold">
            {belowLimit
              ? "Waiting for price recovery"
              : "Waiting for execution"}
          </p>
          <p className="mt-1 text-muted-foreground">
            {belowLimit ? (
              <>
                The price is below your limit. The order can execute when the
                price recovers. Higher slippage on a new order can help it fill,
                but allows a lower sale price.
              </>
            ) : (
              <>
                Your order should execute soon. If it stays open, please open a{" "}
                <Link
                  href="https://github.com/bleu/cow-stop-loss/issues/new"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary underline underline-offset-4"
                >
                  GitHub ticket.
                </Link>
              </>
            )}
          </p>
        </aside>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  const id = useId();
  return (
    <div className="min-w-0 border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <dt
        id={id}
        className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </dt>
      <dd
        aria-labelledby={id}
        className="mt-1.5 break-words text-[15px] font-medium leading-relaxed text-foreground sm:text-base"
      >
        {children}
      </dd>
    </div>
  );
}

function DetailSection({
  title,
  children,
  description,
}: React.PropsWithChildren<{ title: string; description: string }>) {
  return (
    <section className="pixel-frame rescue-panel rounded-none border border-border/70 bg-card p-4 sm:p-5">
      <header className="mb-4 border-b border-border/60 pb-3">
        <h2 className="font-serif text-2xl leading-tight tracking-tight">
          {title}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
      </header>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function TokenAmount({
  label,
  value,
  token,
  chainId,
}: {
  label: string;
  value: bigint;
  token: OrderToken;
  chainId: ChainId;
}) {
  return (
    <dl className="pixel-inset min-w-0 rounded-none border border-border/70 bg-background/50 p-4 sm:p-5">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd aria-label={label} className="mt-3 flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <TokenLogo
            tokenAddress={token.address}
            chainId={chainId}
            alt=""
            aria-hidden="true"
            className="size-9 shrink-0 rounded-full ring-1 ring-white/10"
            height={36}
            width={36}
          />
          <p className="min-w-0 break-words text-xl font-medium leading-tight tracking-tight tabular-nums sm:text-2xl">
            {token.decimals === null
              ? `${value} base units`
              : formatUnits(value, token.decimals)}{" "}
            <span className="text-base text-muted-foreground">
              {token.symbol}
            </span>
          </p>
        </div>
        <BlockExplorerLink
          type="token"
          identifier={token.address}
          networkId={chainId}
          showExternalIcon
          label={truncateAddress(token.address) ?? undefined}
          className="text-xs"
        />
      </dd>
    </dl>
  );
}

function OrderDetailsHeading({ children }: React.PropsWithChildren) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="relative pl-14">
        <Link
          href="/app"
          aria-label="Back to orders"
          className="pixel-control absolute left-0 top-1 inline-flex size-11 shrink-0 items-center justify-center rounded-none border border-border/70 bg-card/80 text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PixelIcon name="arrow-left" className="size-5" />
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Air rescue · Flight log
        </p>
        <h1 className="mt-2 font-serif text-[32px] leading-tight tracking-tight sm:text-[40px]">
          Order details
        </h1>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </header>
  );
}

function amount(value: bigint, token: OrderToken) {
  return `${token.decimals === null ? `${value} base units` : formatUnits(value, token.decimals)} ${token.symbol}`;
}

function date(timestamp: number) {
  return new Date(timestamp * 1000)
    .toISOString()
    .replace("T", " ")
    .replace(".000Z", " UTC");
}

function formatDuration(seconds: number) {
  if (seconds === 0) return "0 seconds";
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  return `${seconds} seconds`;
}

function getOrderStatusMessage(status: OrderStatus | string) {
  switch (status) {
    case OrderStatus.OPEN:
      return {
        title: "Waiting for a fill",
        detail:
          "The order remains active until it fills, is cancelled, or expires.",
        tone: "info",
      };
    case OrderStatus.FULFILLED:
      return {
        title: "Fully executed",
        detail: "The full sell amount was executed.",
        tone: "success",
      };
    case OrderStatus.PARTIALLY_FILLED:
      return {
        title: "Partially executed",
        detail:
          "Some tokens were sold. The remaining amount can still execute.",
        tone: "info",
      };
    case OrderStatus.CANCELLED:
      return {
        title: "Cancelled",
        detail: "This order can no longer execute.",
        tone: "muted",
      };
    case OrderStatus.EXPIRED:
      return {
        title: "Expired",
        detail: "No fill was recorded before the order expired.",
        tone: "muted",
      };
    case OrderStatus.PARTIALLY_FILLED_AND_CANCELLED:
      return {
        title: "Partially filled, then cancelled",
        detail: "Some tokens were sold. The remaining amount will not execute.",
        tone: "muted",
      };
    case OrderStatus.PARTIALLY_FILLED_AND_EXPIRED:
      return {
        title: "Partially filled, then expired",
        detail: "Some tokens were sold. The remaining amount expired.",
        tone: "muted",
      };
    case OrderStatus.CANCELLING:
      return {
        title: "Cancellation in progress",
        detail: "The order may still execute until cancellation is confirmed.",
        tone: "warning",
      };
    case OrderStatus.PARTIALLY_FILLED_AND_CANCELLING:
      return {
        title: "Partial fill; cancellation in progress",
        detail:
          "Some tokens were sold. The remaining amount may still execute until cancellation is confirmed.",
        tone: "warning",
      };
    case OrderStatus.CREATING:
    case OrderStatus.ON_QUEUE:
    case OrderStatus.DRAFT:
      return {
        title: "Placement in progress",
        detail: "The order is not active yet.",
        tone: "info",
      };
    default:
      return {
        title: "Order status",
        detail: `Current status: ${status}.`,
        tone: "muted",
      };
  }
}

function OrderStatusSummary({
  status,
  children,
}: React.PropsWithChildren<{ status: OrderStatus | string }>) {
  const message = getOrderStatusMessage(status);
  const iconName =
    message.tone === "success"
      ? "check-circle"
      : message.tone === "warning"
        ? "clock"
        : message.tone === "muted"
          ? "cancel-circle"
          : "info";
  const color =
    message.tone === "success"
      ? "text-success"
      : message.tone === "warning"
        ? "text-warning"
        : message.tone === "muted"
          ? "text-muted-foreground"
          : "text-primary";

  return (
    <aside className="pixel-inset mb-5 flex flex-wrap items-center gap-3 rounded-none border border-border/70 bg-primary/5 p-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <PixelIcon
          name={iconName}
          className={`mt-0.5 size-5 shrink-0 ${color}`}
        />
        <div>
          <p className="font-semibold">{message.title}</p>
          <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
            {message.detail}
          </p>
        </div>
      </div>
      {children && <div className="ml-auto shrink-0">{children}</div>}
    </aside>
  );
}

function shortIdentifier(value: string) {
  if (value.length <= 26) return value;
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

function CopyableIdentifier({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className="inline-flex items-center">
      <code title={value} className="font-mono text-xs text-muted-foreground">
        {shortIdentifier(value)}
      </code>
      <button
        type="button"
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        title={copied ? "Copied" : `Copy ${label}`}
        onClick={() => void copyValue()}
        className="rescue-secondary-control pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring inline-flex size-11 shrink-0 items-center justify-center rounded-none p-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? (
          <PixelIcon name="check" className="size-4 text-success" />
        ) : (
          <PixelIcon name="copy" className="size-4" />
        )}
      </button>
    </span>
  );
}

export function OrderDetails({
  orderId,
  chainId,
}: {
  orderId: string;
  chainId: ChainId;
}) {
  const { orders, chains, isLoading, mutate } = useOrderList();
  const chain = chains.find((chain) => chain.chainId === chainId);
  const matches = (order: StopLossOrder) =>
    order.chainId === chainId &&
    (order.parentId === orderId ||
      `${order.owner.toLowerCase()}:${order.hash.toLowerCase()}` ===
        orderId.toLowerCase());
  const order = orders.find(matches) ?? chain?.orders.find(matches);

  const warning = chain?.status === "error" && (
    <div
      role="alert"
      className="pixel-inset mb-5 rounded-none border border-destructive/40 bg-destructive/10 p-4 text-sm"
    >
      <p className="font-semibold">
        {chainNames[chainId]} order data is unavailable.
      </p>
      <p className="mt-1 text-muted-foreground">{chain.error}</p>
      {order && (
        <p className="mt-1 text-muted-foreground">
          Previously loaded {chainNames[chainId]} orders may be out of date.
        </p>
      )}
      <button
        disabled={isLoading}
        onClick={() => mutate()}
        className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-3 rounded-none text-primary underline underline-offset-4 disabled:opacity-50"
      >
        Retry {chainNames[chainId]}
      </button>
    </div>
  );

  if (!order)
    return (
      <main className="rescue-detail-page mx-auto min-h-full w-full px-4 py-8 sm:px-6 sm:py-10">
        <OrderDetailsHeading />
        {warning || (
          <div
            role="status"
            className="pixel-inset rounded-none border border-border/70 bg-card/85 p-6 text-muted-foreground shadow-xl sm:p-8"
          >
            {isLoading
              ? "Loading order..."
              : `Order not found for the connected account on ${chainNames[chainId]}. Return to the orders table and refresh.`}
          </div>
        )}
      </main>
    );

  const price = (value: string) =>
    `${value} ${order.buyToken.symbol} per ${order.sellToken.symbol}`;
  const hasExecution =
    Boolean(order.cowOrder?.uid) ||
    (order.executedSellAmount ?? BigInt(0)) > BigInt(0) ||
    (order.executedBuyAmount ?? BigInt(0)) > BigInt(0);
  return (
    <main className="rescue-detail-page mx-auto min-h-full w-full px-4 py-8 sm:px-6 sm:py-10">
      <OrderDetailsHeading />
      <OrderStatusSummary status={order.status}>
        <CancelOrderDialog order={order} />
      </OrderStatusSummary>
      <OrderHealth order={order} />
      {warning}

      <section className="pixel-frame rescue-panel relative mb-5 rounded-none border border-border bg-card p-4 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Order summary
            </p>
            <h2 className="mt-2 font-serif text-[28px] leading-tight tracking-tight sm:text-[32px]">
              {order.sellToken.symbol} for {order.buyToken.symbol}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pixel-badge inline-flex items-center gap-2 rounded-none border border-border/70 bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <NetworkLogo
                chainId={chainId}
                size={18}
                className="rounded-full"
              />
              {chainNames[chainId]}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <TokenAmount
            label="Sell amount"
            value={order.sellAmount}
            token={order.sellToken}
            chainId={chainId}
          />
          <TokenAmount
            label="Minimum buy amount"
            value={order.buyAmount}
            token={order.buyToken}
            chainId={chainId}
          />
        </div>

        <div
          className={`mt-3 grid gap-3 ${order.limitPrice !== undefined ? "sm:grid-cols-2" : ""}`}
        >
          <dl className="pixel-inset rounded-none border border-primary/20 bg-primary/10 p-4">
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-primary">
              Trigger price
            </dt>
            <dd
              aria-label="Trigger price"
              className="mt-2 text-lg font-semibold tabular-nums sm:text-xl"
            >
              {price(formatUnits(order.strike, 18))}
            </dd>
          </dl>
          {order.limitPrice !== undefined && (
            <dl className="pixel-inset rounded-none border border-secondary/25 bg-secondary/10 p-4">
              <dt className="text-xs font-medium uppercase tracking-[0.12em] text-secondary">
                Limit price
              </dt>
              <dd
                aria-label="Limit price"
                className="mt-2 text-lg font-semibold tabular-nums sm:text-xl"
              >
                {price(order.limitPrice)}
              </dd>
            </dl>
          )}
        </div>
      </section>

      <div className="space-y-4">
        <DetailSection
          title="Order information"
          description="Addresses, tokens, and identifiers for this order."
        >
          <Field label="Owner">
            <BlockExplorerLink
              type="address"
              identifier={order.owner}
              networkId={chainId}
              showExternalIcon
              label={truncateAddress(order.owner) ?? undefined}
            />
          </Field>
          <Field label="Receiver">
            <BlockExplorerLink
              type="address"
              identifier={order.receiver}
              networkId={chainId}
              showExternalIcon
              label={truncateAddress(order.receiver) ?? undefined}
            />
          </Field>
          <Field label="Partial fills">
            {order.partiallyFillable ? "Allowed" : "All or nothing"}
          </Field>
          {order.createdAt !== undefined && (
            <Field label="Created">{date(order.createdAt)}</Field>
          )}
          <Field label="Valid until">{date(order.validTo)}</Field>
          {order.transactionHash !== undefined && (
            <Field label="Creation transaction">
              <Link
                href={buildBlockExplorerTxUrl({
                  chainId,
                  txHash: order.transactionHash,
                })!}
                target="_blank"
                rel="noreferrer noopener"
                title={order.transactionHash}
                className="group inline-flex items-center text-primary transition-colors hover:text-secondary"
              >
                <span className="font-mono text-sm">
                  {truncateAddress(order.transactionHash)}
                </span>
                <PixelIcon
                  name="external-link"
                  className="ml-1 size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </Field>
          )}
          <Field label="Order ID">
            <CopyableIdentifier label="order ID" value={order.parentId} />
          </Field>
          <Field label="Order hash">
            <CopyableIdentifier label="order hash" value={order.hash} />
          </Field>
        </DetailSection>

        {hasExecution && (
          <DetailSection
            title="Execution"
            description="Amounts filled for this order."
          >
            {order.executedSellAmount !== null && (
              <Field label="Executed sell amount">
                {amount(order.executedSellAmount, order.sellToken)}
              </Field>
            )}
            {order.executedBuyAmount !== null && (
              <Field label="Executed buy amount">
                {amount(order.executedBuyAmount, order.buyToken)}
              </Field>
            )}
            {order.cowOrder?.uid && (
              <Field label="CoW order">
                <Link
                  href={buildOrderCowExplorerUrl({
                    chainId,
                    orderId: order.cowOrder.uid as `0x${string}`,
                  })}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center text-primary transition-colors hover:text-secondary"
                >
                  View CoW order
                  <PixelIcon
                    name="external-link"
                    className="ml-1 size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>
              </Field>
            )}
          </DetailSection>
        )}

        <DetailSection
          title="Oracle settings"
          description="Price sources and freshness limits used to activate the order."
        >
          <Field label="Maximum oracle age">
            {formatDuration(order.maxTimeSinceLastOracleUpdate)}
          </Field>
          <Field label="Sell token oracle">
            <div>
              <BlockExplorerLink
                type="address"
                identifier={order.sellTokenPriceOracle}
                networkId={chainId}
                showExternalIcon
                label={truncateAddress(order.sellTokenPriceOracle) ?? undefined}
              />
              <OracleTokenPrice
                chainId={chainId}
                oracle={order.sellTokenPriceOracle}
                tokenSymbol={order.sellToken.symbol}
              />
            </div>
          </Field>
          <Field label="Buy token oracle">
            <div>
              <BlockExplorerLink
                type="address"
                identifier={order.buyTokenPriceOracle}
                networkId={chainId}
                showExternalIcon
                label={truncateAddress(order.buyTokenPriceOracle) ?? undefined}
              />
              <OracleTokenPrice
                chainId={chainId}
                oracle={order.buyTokenPriceOracle}
                tokenSymbol={order.buyToken.symbol}
              />
            </div>
          </Field>
        </DetailSection>
      </div>
    </main>
  );
}
