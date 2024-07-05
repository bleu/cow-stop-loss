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
import useSWR from "swr";
import { Address, formatUnits } from "viem";

import { LinkComponent } from "#/components/Link";
import { OrderDetailsInformation } from "#/components/OrderDetailsInformation";
import { StatusBadge } from "#/components/StatusBadge";
import { TokenLogo } from "#/components/TokenLogo";
import { InfoTooltip } from "#/components/Tooltip";
import { getProcessedStopLossOrder } from "#/lib/orderFetcher";
import { ChainId } from "#/lib/publicClients";
import { formatTimeDelta } from "#/lib/timeDelta";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { StopLossOrderTypeWithCowOrders } from "#/lib/types";
import {
  buildBlockExplorerTokenURL,
  buildBlockExplorerTxUrl,
  buildOrderCowExplorerUrl,
  truncateAddress,
} from "#/utils";

export function OrderDetails({
  defaultOrder,
  orderId,
  chainId,
  address,
}: {
  defaultOrder: StopLossOrderTypeWithCowOrders;
  orderId: string;
  address: Address;
  chainId: ChainId;
}) {
  const orderFetcher = async () => {
    return await getProcessedStopLossOrder({
      chainId,
      orderId,
      address,
    });
  };
  const { data: order } = useSWR(["orderDetails"], orderFetcher, {
    fallbackData: defaultOrder,
  });

  const { safe } = useSafeAppsSDK();
  const orderDateTime = formatDateTime(
    epochToDate(Number(order?.blockTimestamp))
  );
  const orderWaitTime = formatTimeDelta(
    order?.stopLossData?.validityBucketSeconds as number
  );
  const maxOracleUpdateTime = formatTimeDelta(
    order?.stopLossData?.maxTimeSinceLastOracleUpdate as number
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
          <OrderDetailsInformation
            label="Order creation"
            tooltipText={TOOLTIP_DESCRIPTIONS.ORDER_CREATION}
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
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Order Hash"
            tooltipText={TOOLTIP_DESCRIPTIONS.ORDER_HASH}
          >
            <div className="flex items-center gap-x-1">
              {order?.hash}
              <ClickToCopy text={order?.hash as string}>
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Status"
            tooltipText={TOOLTIP_DESCRIPTIONS.STATUS}
          >
            <OrderDetailsInformation
              label="Type"
              tooltipText={TOOLTIP_DESCRIPTIONS.TYPE}
            >
              {order?.stopLossData?.isPartiallyFillable
                ? "Partially fillable"
                : "Fill or kill"}{" "}
              Order
            </OrderDetailsInformation>
            <StatusBadge status={order?.status || ""} />
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Submission Time"
            tooltipText={TOOLTIP_DESCRIPTIONS.SUBMISSION_TIME}
          >
            {orderDateTime}
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Validity Bucket Time"
            tooltipText={TOOLTIP_DESCRIPTIONS.VALIDITY_BUCKET_TIME}
          >
            {orderWaitTime}
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Oracle Validity Time"
            tooltipText={TOOLTIP_DESCRIPTIONS.MAX_TIME_SINCE_LAST_ORACLE_UPDATE}
          >
            {maxOracleUpdateTime}
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Recipient"
            tooltipText={TOOLTIP_DESCRIPTIONS.RECIPIENT}
          >
            <div className="flex items-center gap-x-1">
              {order?.stopLossData?.to}
              <ClickToCopy text={order?.stopLossData?.to as string}>
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderDetailsInformation>
        </div>
        <Separator className="my-3" />
        <div className="flex flex-col gap-y-1">
          <OrderDetailsInformation
            label="Amount"
            tooltipText={TOOLTIP_DESCRIPTIONS.AMOUNT}
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
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Trigger Price"
            tooltipText={TOOLTIP_DESCRIPTIONS.TRIGGER_PRICE}
          >
            {formatNumber(strikePrice, 4)}{" "}
            <InfoTooltip text={strikePrice.toString()} /> {priceUnit}
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Limit Price"
            tooltipText={TOOLTIP_DESCRIPTIONS.LIMIT_PRICE}
          >
            {formatNumber(limitPrice, 4)}{" "}
            <InfoTooltip text={limitPrice.toString()} /> {priceUnit}
          </OrderDetailsInformation>
          {(order?.filledPct || 0) > 0 && (
            <>
              <OrderDetailsInformation
                label="Execution Price"
                tooltipText={TOOLTIP_DESCRIPTIONS.LIMIT_PRICE}
              >
                {formatNumber(executionPrice, 4)} {priceUnit}
              </OrderDetailsInformation>
              <OrderDetailsInformation
                label="Order"
                tooltipText={TOOLTIP_DESCRIPTIONS.ORDER}
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
              </OrderDetailsInformation>
            </>
          )}
          <OrderDetailsInformation
            label="Token Sell Oracle"
            tooltipText={TOOLTIP_DESCRIPTIONS.ORACLE_TOKEN_SELL}
          >
            <div className="flex items-center gap-x-1">
              {order?.stopLossData?.sellTokenPriceOracle}
              <ClickToCopy
                text={order?.stopLossData?.sellTokenPriceOracle as string}
              >
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Token Buy Oracle"
            tooltipText={TOOLTIP_DESCRIPTIONS.ORACLE_TOKEN_BUY}
          >
            <div className="flex items-center gap-x-1">
              {order?.stopLossData?.buyTokenPriceOracle}
              <ClickToCopy
                text={order?.stopLossData?.buyTokenPriceOracle as string}
              >
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderDetailsInformation>
        </div>
        {order?.cowOrders && order.cowOrders.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="flex flex-col gap-y-1">
              <OrderDetailsInformation
                label="Related Orders"
                tooltipText={TOOLTIP_DESCRIPTIONS.RELATED_ORDERS}
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
              </OrderDetailsInformation>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
