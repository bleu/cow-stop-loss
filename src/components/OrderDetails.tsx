"use client";

import { ArrowLeftIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import React, { useId } from "react";
import { formatUnits } from "viem";

import { useOrderList } from "#/hooks/useOrderList";
import { ChainId, chainNames } from "#/lib/publicClients";
import { OrderToken } from "#/lib/stopLossOrders";
import {
  buildBlockExplorerTxUrl,
  buildOrderCowExplorerUrl,
  truncateAddress,
} from "#/utils";

import { CancelOrderDialog } from "./CancelOrderDialog";
import { BlockExplorerLink } from "./ExplorerLink";
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

function amount(value: bigint, token: OrderToken) {
  return `${token.decimals === null ? `${value} base units` : formatUnits(value, token.decimals)} ${token.symbol}`;
}

function date(timestamp: number) {
  return new Date(timestamp * 1000)
    .toISOString()
    .replace("T", " ")
    .replace(".000Z", " UTC");
}

function OrderDetailsHeading() {
  return (
    <header className="mb-4 flex items-center gap-3">
      <Link
        href="/"
        aria-label="Back to orders"
        className="rounded p-2 text-primary"
      >
        <ArrowLeftIcon className="size-5" aria-hidden="true" />
      </Link>
      <h1 className="text-2xl font-semibold">Order details</h1>
    </header>
  );
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
        <OrderDetailsHeading />
        {warning || (
          <p role="status">
            {isLoading
              ? "Loading order..."
              : `Order not found for the connected account on ${chainNames[chainId]}. Return to the orders table and refresh.`}
          </p>
        )}
      </main>
    );

  const price = (value: string) =>
    `${value} ${order.buyToken.symbol} per ${order.sellToken.symbol}`;
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <OrderDetailsHeading />
      <CancelOrderDialog order={order} />
      {warning}
      <dl>
        <Field label="Chain">{chainNames[chainId]}</Field>
        <Field label="Order ID">{order.parentId}</Field>
        <Field label="Order hash">{order.hash}</Field>
        <Field label="Owner">
          <BlockExplorerLink
            type="address"
            identifier={order.owner}
            networkId={chainId}
            label={truncateAddress(order.owner) ?? undefined}
          />
        </Field>
        <Field label="Status">
          <StatusBadge status={order.status} />
        </Field>
        <Field label="Kind">{order.isSellOrder ? "Sell" : "Buy"}</Field>
        <Field label="Partial fills">
          {order.partiallyFillable ? "Allowed" : "Not allowed"}
        </Field>
        {order.createdAt !== undefined && (
          <Field label="Created">{date(order.createdAt)}</Field>
        )}
        {order.transactionHash !== undefined && (
          <Field label="Creation transaction">
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
          </Field>
        )}
        <Field label="Valid until">{date(order.validTo)}</Field>
        <Field label="Receiver">
          <BlockExplorerLink
            type="address"
            identifier={order.receiver}
            networkId={chainId}
            label={truncateAddress(order.receiver) ?? undefined}
          />
        </Field>
        <Field label="Sell token">
          <BlockExplorerLink
            type="token"
            identifier={order.sellToken.address}
            networkId={chainId}
            label={truncateAddress(order.sellToken.address) ?? undefined}
          />
        </Field>
        <Field label="Buy token">
          <BlockExplorerLink
            type="token"
            identifier={order.buyToken.address}
            networkId={chainId}
            label={truncateAddress(order.buyToken.address) ?? undefined}
          />
        </Field>
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
        {order.limitPrice !== undefined && (
          <Field label="Limit price">{price(order.limitPrice)}</Field>
        )}
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
        {order.executedFee !== null && (
          <Field label="Executed fee">
            {order.executedFee.toString()} base units (fee token not supplied)
          </Field>
        )}
        {order.executionPrice !== undefined && (
          <Field label="Execution price">{price(order.executionPrice)}</Field>
        )}
        <Field label="Maximum oracle age">
          {order.maxTimeSinceLastOracleUpdate} seconds
        </Field>
        <Field label="Sell token oracle">
          <BlockExplorerLink
            type="address"
            identifier={order.sellTokenPriceOracle}
            networkId={chainId}
            label={truncateAddress(order.sellTokenPriceOracle) ?? undefined}
          />
        </Field>
        <Field label="Buy token oracle">
          <BlockExplorerLink
            type="address"
            identifier={order.buyTokenPriceOracle}
            networkId={chainId}
            label={truncateAddress(order.buyTokenPriceOracle) ?? undefined}
          />
        </Field>
        {order.cowOrder !== undefined && (
          <Field label="CoW order">
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
          </Field>
        )}
      </dl>
    </main>
  );
}
