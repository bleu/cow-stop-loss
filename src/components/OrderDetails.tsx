"use client";

import {
  ClickToCopy,
  cn,
  epochToDate,
  formatDateTime,
  formatNumber,
  Separator,
} from "@bleu/ui";
import { ArrowLeftIcon, CopyIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import Link from "next/link";
import { Address, formatUnits } from "viem";

import { LinkComponent } from "#/components/Link";
import { OrderInformation } from "#/components/OrderInformation";
import { StatusBadge } from "#/components/StatusBadge";
import { TokenLogo } from "#/components/TokenLogo";
import { InfoTooltip } from "#/components/Tooltip";
import { ChainId } from "#/lib/publicClients";
import { formatTimeDelta } from "#/lib/timeDelta";
import { StopLossOrderTypeWithCowOrders } from "#/lib/types";
import {
  buildBlockExplorerTokenURL,
  buildBlockExplorerTxUrl,
  buildOrderCowExplorerUrl,
  truncateAddress,
} from "#/utils";

export function OrderDetails({
  order,
}: {
  order: StopLossOrderTypeWithCowOrders;
}) {
  const { safe } = useSafeAppsSDK();
  const orderDateTime = formatDateTime(
    epochToDate(Number(order?.blockTimestamp))
  );
  const orderWaitTime = formatTimeDelta(
    order?.stopLossData?.validityBucketSeconds as number
  );

  const amountIn =
    Number(order?.stopLossData?.tokenAmountIn) /
    10 ** Number(order?.stopLossData?.tokenIn.decimals);
  const amountOut =
    Number(order?.stopLossData?.tokenAmountOut) /
    10 ** Number(order?.stopLossData?.tokenOut.decimals);
  const executedAmountIn =
    Number(order?.executedSellAmount) /
    10 ** Number(order?.stopLossData?.tokenIn.decimals);
  const executedAmountOut =
    Number(order?.executedBuyAmount) /
    10 ** Number(order?.stopLossData?.tokenOut.decimals);
  const strikePrice = formatUnits(order?.stopLossData?.strike, 18);
  const limitPrice = amountOut / amountIn;
  const executionPrice = executedAmountOut / executedAmountIn;
  const orderSurplus = ((executionPrice - limitPrice) / limitPrice) * 100;
  const priceUnit = `${order?.stopLossData?.tokenOut.symbol} per ${order?.stopLossData?.tokenIn.symbol}`;

  return (
    <div className="flex size-full justify-center items-center">
      <div className="bg-foreground my-10 text-black p-10 rounded relative">
        <div className="flex flex-row justify-between items-center mb-5">
          <LinkComponent
            href={`/${safe.chainId}/${safe.safeAddress}`}
            className="hover:text-primary"
          >
            <ArrowLeftIcon className="size-4" />
          </LinkComponent>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <div />
        </div>
        <div className="flex flex-col gap-y-1">
          <OrderInformation
            label="Order creation"
            tooltipText="The transaction that created this stop loss order."
          >
            <div className="flex items-center gap-x-1">
              <a
                target="_blank"
                href={buildBlockExplorerTxUrl({
                  txHash: order?.txHash as string,
                  chainId: order?.chainId,
                })}
                className="hover:text-primary hover:underline"
              >
                {order?.txHash}
              </a>
              <ClickToCopy text={order?.txHash as string}>
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderInformation>
          <OrderInformation
            label="Order Hash"
            tooltipText="The onchain settlement transaction for this order."
          >
            <div className="flex items-center gap-x-1">
              {order?.hash}
              <ClickToCopy text={order?.hash as string}>
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderInformation>
          <OrderInformation
            label="Status"
            tooltipText="The status can be Created, Posted, Fulfilled, Expired and Cancelled"
          >
            <StatusBadge status={order?.status} />
          </OrderInformation>
          <OrderInformation
            label="Submission Time"
            tooltipText="The date and time at which the order was submitted."
          >
            {orderDateTime}
          </OrderInformation>
          <OrderInformation
            label="Validity Bucket Time"
            tooltipText="After the oracle price achieves the defined strike price, how much time the order will wait to be filled on the orderbook."
          >
            {orderWaitTime}
          </OrderInformation>
          <OrderInformation
            label="Recipient"
            tooltipText="Recipient of that will receive the buy tokens of the order."
          >
            <div className="flex items-center gap-x-1">
              {order?.stopLossData?.to}
              <ClickToCopy text={order?.stopLossData?.to as string}>
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderInformation>
        </div>
        <Separator className="my-3" />
        <div className="flex flex-col gap-y-1">
          <OrderInformation
            label="Amount"
            tooltipText="The total sell and buy amount for this order. Sell amount includes the fee."
          >
            <div className="flex flex-col">
              <div className="flex gap-x-2 items-center">
                <span className="font-bold">
                  {order?.stopLossData?.isSellOrder ? "From" : "From at most"}
                </span>
                {formatNumber(amountIn, 4)}{" "}
                <InfoTooltip text={amountIn.toString()} />
                <a
                  target="_blank"
                  href={buildBlockExplorerTokenURL({
                    tokenAddress: order?.stopLossData?.tokenIn
                      .address as Address,
                    chainId: order?.chainId,
                  })}
                  className="hover:text-primary hover:underline"
                >
                  {order?.stopLossData?.tokenIn.symbol}
                </a>
                <TokenLogo
                  tokenAddress={order?.stopLossData?.tokenIn.address.toLowerCase()}
                  chainId={order?.chainId as ChainId}
                  className="rounded-full"
                  alt="Token Logo"
                  height={22}
                  width={22}
                  quality={100}
                />
              </div>
              <div className="flex gap-x-2 items-center">
                <span className="font-bold">
                  {order?.stopLossData?.isSellOrder ? "To at least" : "To"}
                </span>
                {formatNumber(amountOut, 4)}{" "}
                <InfoTooltip text={amountOut.toString()} />
                <a
                  target="_blank"
                  href={buildBlockExplorerTokenURL({
                    tokenAddress: order?.stopLossData?.tokenOut
                      .address as Address,
                    chainId: order?.chainId,
                  })}
                  className="hover:text-primary hover:underline"
                >
                  {order?.stopLossData?.tokenOut.symbol}
                </a>
                <TokenLogo
                  tokenAddress={order?.stopLossData?.tokenOut.address}
                  chainId={order?.chainId as ChainId}
                  className="rounded-full"
                  alt="Token Logo"
                  height={22}
                  width={22}
                  quality={100}
                />
              </div>
            </div>
          </OrderInformation>
          <OrderInformation
            label="Trigger Price"
            tooltipText="If the oracle price drop bellow this threshold the order will be executed by the limit price."
          >
            {formatNumber(strikePrice, 4)}{" "}
            <InfoTooltip text={strikePrice.toString()} /> {priceUnit}
          </OrderInformation>
          <OrderInformation
            label="Limit Price"
            tooltipText="The limit price is the price at which this order shall be (partially) filled, in combination with the specified slippage. The fee is already deducted from the sell amount."
          >
            {formatNumber(limitPrice, 4)}{" "}
            <InfoTooltip text={limitPrice.toString()} /> {priceUnit}
          </OrderInformation>
          {order?.executedSellAmount != "0" && (
            <>
              <OrderInformation
                label="Execution Price"
                tooltipText="The actual price at which this order has been matched and executed, after deducting fees from the amount sold."
              >
                {formatNumber(executionPrice, 4)} {priceUnit}
              </OrderInformation>
              <OrderInformation
                label="Order"
                tooltipText="The amount sold/bought. Also surplus for this order. This is the positive difference between the initial limit price and the actual (average) execution price."
              >
                <div className="flex gap-x-2">
                  Swapped {formatNumber(executedAmountIn, 4)}{" "}
                  {order?.stopLossData?.tokenIn.symbol} for{" "}
                  {formatNumber(executedAmountOut, 4)}{" "}
                  {order?.stopLossData?.tokenOut.symbol}
                  {orderSurplus > 0 && (
                    <span className="text-success text-bold">
                      ({formatNumber(orderSurplus, 4)}% surplus)
                    </span>
                  )}
                </div>
              </OrderInformation>
            </>
          )}
          <OrderInformation
            label="Oracle Token In"
            tooltipText="A chainlink-like oracle  that provides the current selling price of a token in a specified currency."
          >
            <div className="flex items-center gap-x-1">
              {order?.stopLossData?.sellTokenPriceOracle}
              <ClickToCopy
                text={order?.stopLossData?.sellTokenPriceOracle as string}
              >
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderInformation>
          <OrderInformation
            label="Oracle Token In"
            tooltipText="A chainlink-like oracle that gives the current buying price of a token in the same currency."
          >
            <div className="flex items-center gap-x-1">
              {order?.stopLossData?.buyTokenPriceOracle}
              <ClickToCopy
                text={order?.stopLossData?.buyTokenPriceOracle as string}
              >
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderInformation>
        </div>
        {order?.cowOrders && order.cowOrders.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="flex flex-col gap-y-1">
              <OrderInformation
                label="Related Orders"
                tooltipText="The orders created based on your initial request"
              >
                <div className="flex flex-col">
                  {order.cowOrders.map((cowOrder) => (
                    <div className="flex items-center gap-x-1">
                      <Link
                        className={cn(
                          "hover:text-primary hover:underline",
                          order.status === "fulfilled" ? "font-bold" : ""
                        )}
                        href={buildOrderCowExplorerUrl({
                          chainId: order?.chainId as ChainId,
                          orderId: cowOrder.uid as `0x${string}`,
                        })}
                        rel="noreferrer noopener"
                        target="_blank"
                      >
                        {truncateAddress(cowOrder.uid)}
                      </Link>
                      <ClickToCopy text={cowOrder.uid}>
                        <CopyIcon className="hover:text-primary" />
                      </ClickToCopy>
                      <StatusBadge status={cowOrder?.status} />
                    </div>
                  ))}
                </div>
              </OrderInformation>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
