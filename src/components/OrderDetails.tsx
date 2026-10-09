"use client";

import Link from "next/link";
import React, { useId } from "react";
import { formatUnits } from "viem";

import { useOrderList } from "#/hooks/useOrderList";
import { ChainId, chainNames } from "#/lib/publicClients";
import { OrderToken } from "#/lib/stopLossOrders";
import { buildBlockExplorerTxUrl, buildOrderCowExplorerUrl } from "#/utils";

import { StatusBadge } from "./StatusBadge";

function Field({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  const id = useId();
  return (
    <div className="grid gap-2 border-b py-3 sm:grid-cols-2">
      <dt id={id} className="font-medium">
        {label}
      </dt>
      <dd aria-labelledby={id} className="break-all">
        {children}
      </dd>
    </div>
  );
}

function amount(value: bigint | null, token: OrderToken) {
  if (value === null) return "Not available";
  return `${token.decimals === null ? `${value} base units` : formatUnits(value, token.decimals)} ${token.symbol}`;
}

function date(timestamp?: number) {
  return timestamp === undefined
    ? "Not available"
    : new Date(timestamp * 1000)
        .toISOString()
        .replace("T", " ")
        .replace(".000Z", " UTC");
}

export function OrderDetails({
  orderId,
  chainId,
}: {
  orderId: string;
  chainId: ChainId;
}) {
  const { chains, isLoading, mutate } = useOrderList();
  const chain = chains.find((chain) => chain.chainId === chainId);
  const order = chain?.orders.find((order) => order.parentId === orderId);

  const warning = chain?.status === "error" && (
    <div role="alert" className="my-4 rounded border border-destructive p-3">
      <p>{chainNames[chainId]} order data is unavailable.</p>
      <p>{chain.error}</p>
      {order && (
        <p>
          Previously loaded {chainNames[chainId]} orders may be out of date.
        </p>
      )}
      <button
        disabled={isLoading}
        onClick={() => mutate()}
        className="text-primary underline"
      >
        Retry {chainNames[chainId]}
      </button>
    </div>
  );

  if (!order)
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/" className="text-primary underline">
          Back to orders
        </Link>
        <button
          disabled={isLoading}
          onClick={() => mutate()}
          className="ml-4 text-primary underline"
        >
          Refresh orders
        </button>
        {warning || (
          <p role="status">
            {isLoading
              ? "Loading order..."
              : `Order not found for the connected account on ${chainNames[chainId]}.`}
          </p>
        )}
      </main>
    );

  const price = (value?: string) =>
    value === undefined
      ? "Not available"
      : `${value} ${order.buyToken.symbol} per ${order.sellToken.symbol}`;
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/" className="text-primary underline">
        Back to orders
      </Link>
      <h1 className="my-4 text-2xl font-semibold">Order details</h1>
      <button
        disabled={isLoading}
        onClick={() => mutate()}
        className="text-primary underline"
      >
        Refresh orders
      </button>
      {warning}
      <dl>
        <Field label="Chain">{chainNames[chainId]}</Field>
        <Field label="Order ID">{order.parentId}</Field>
        <Field label="Order hash">{order.hash}</Field>
        <Field label="Owner">{order.owner}</Field>
        <Field label="Status">
          <StatusBadge status={order.status} />
        </Field>
        <Field label="Kind">{order.isSellOrder ? "Sell" : "Buy"}</Field>
        <Field label="Partial fills">
          {order.partiallyFillable ? "Allowed" : "Not allowed"}
        </Field>
        <Field label="Created">{date(order.createdAt)}</Field>
        <Field label="Creation transaction">
          {order.transactionHash ? (
            <Link
              href={
                buildBlockExplorerTxUrl({
                  chainId,
                  txHash: order.transactionHash,
                })!
              }
              target="_blank"
              rel="noreferrer noopener"
            >
              View creation transaction
            </Link>
          ) : (
            "Not available"
          )}
        </Field>
        <Field label="Valid until">{date(order.validTo)}</Field>
        <Field label="Receiver">{order.receiver}</Field>
        <Field label="Sell token">{order.sellToken.address}</Field>
        <Field label="Buy token">{order.buyToken.address}</Field>
        <Field
          label={order.isSellOrder ? "Sell amount" : "Maximum sell amount"}
        >
          {amount(order.sellAmount, order.sellToken)}
        </Field>
        <Field label={order.isSellOrder ? "Minimum buy amount" : "Buy amount"}>
          {amount(order.buyAmount, order.buyToken)}
        </Field>
        <Field label="Trigger price">
          {price(formatUnits(order.strike, 18))}
        </Field>
        <Field label="Limit price">{price(order.limitPrice)}</Field>
        <Field label="Executed sell amount">
          {amount(order.executedSellAmount, order.sellToken)}
        </Field>
        <Field label="Executed buy amount">
          {amount(order.executedBuyAmount, order.buyToken)}
        </Field>
        <Field label="Executed fee">
          {order.executedFee === null
            ? "Not available"
            : `${order.executedFee} base units (fee token not supplied)`}
        </Field>
        <Field label="Execution price">{price(order.executionPrice)}</Field>
        <Field label="Maximum oracle age">
          {order.maxTimeSinceLastOracleUpdate} seconds
        </Field>
        <Field label="Sell token oracle">{order.sellTokenPriceOracle}</Field>
        <Field label="Buy token oracle">{order.buyTokenPriceOracle}</Field>
        <Field label="CoW order">
          {order.cowOrder ? (
            <Link
              href={buildOrderCowExplorerUrl({
                chainId,
                orderId: order.cowOrder.uid as `0x${string}`,
              })}
              target="_blank"
              rel="noreferrer noopener"
            >
              View CoW order
            </Link>
          ) : (
            "Not triggered"
          )}
        </Field>
      </dl>
    </main>
  );
}
