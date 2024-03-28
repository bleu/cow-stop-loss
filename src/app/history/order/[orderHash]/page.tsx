"use client";

import { cn, epochToDate, formatDateTime, formatNumber, Separator, Spinner } from "@bleu-fi/ui";

import { useOrder } from "#/contexts/ordersContext";

import { StatusBadge } from "../../(components)/StatusBadge";
import { OrderInformation } from "./(components)/OrderInformation";

export default function OrderPage({
  params,
}: {
  params: {
    orderHash: string;
  };
}) {
  const { orders, loaded } = useOrder();

  if (!loaded) {
    return <Spinner />;
  }
  const stopLossOrder = orders.find((order) => order.hash === params.orderHash);
  const ordersRelated = orders.filter(
    (order) =>
      order.stopLossData?.appData === stopLossOrder?.stopLossData?.appData,
  );

  const orderDateTime = formatDateTime(
    epochToDate(Number(stopLossOrder?.blockTimestamp)),
  );
  const orderExpirationDateTime = formatDateTime(
    epochToDate(
      Number(stopLossOrder?.blockTimestamp) +
        Number(stopLossOrder?.stopLossData?.validityBucketSeconds),
    ),
  );
  const amountIn =
    Number(stopLossOrder?.stopLossData?.tokenAmountIn) /
    10 ** Number(stopLossOrder?.stopLossData?.tokenIn.decimals);
  const amountOut =
    Number(stopLossOrder?.stopLossData?.tokenAmountOut) /
    10 ** Number(stopLossOrder?.stopLossData?.tokenOut.decimals);
  const executedAmountIn =
    Number(stopLossOrder?.executedSellAmount) /
    10 ** Number(stopLossOrder?.stopLossData?.tokenIn.decimals);
  const executedAmountOut =
    Number(stopLossOrder?.executedBuyAmount) /
    10 ** Number(stopLossOrder?.stopLossData?.tokenOut.decimals);
  const limitPrice = amountIn / amountOut;
  const executionPrice = executedAmountIn / executedAmountOut;
  const orderSurplus = ((limitPrice - executionPrice) / limitPrice) * 100;

  return (
    <div className="flex size-full justify-center items-center">
      <div className="bg-foreground my-10 text-black p-10 rounded relative">
        <div className="flex flex-col gap-y-1">
          <OrderInformation
            label="Order Hash"
            tooltipText="The onchain settlement transaction for this order."
          >
            {stopLossOrder?.hash}
          </OrderInformation>
          <OrderInformation
            label="Status"
            tooltipText="The status can be Created, Posted, Fulfilled, Expired and Cancelled"
          >
             <StatusBadge status={stopLossOrder?.status}/>
          </OrderInformation>
          <OrderInformation
            label="Submission Time"
            tooltipText="The date and time at which the order was submitted."
          >
            {orderDateTime}
          </OrderInformation>
          <OrderInformation
            label="Expiration Time"
            tooltipText="The date and time at which an order will expire and effectively be cancelled."
          >
            {orderExpirationDateTime}
          </OrderInformation>
        </div>
        <Separator className="my-3" />
        <div className="flex flex-col gap-y-1">
          <OrderInformation
            label="Amount"
            tooltipText="The total sell and buy amount for this order. Sell amount includes the fee."
          >
            <div className="flex flex-col">
              <div className="flex gap-x-2">
                <span className="font-bold">From</span>
                {formatNumber(amountIn, 4)}{" "}
                {stopLossOrder?.stopLossData?.tokenIn.symbol}
              </div>
              <div className="flex gap-x-2">
                <span className="font-bold">To at least</span>
                {formatNumber(amountOut, 4)}{" "}
                {stopLossOrder?.stopLossData?.tokenOut.symbol}
              </div>
            </div>
          </OrderInformation>
          <OrderInformation
            label="Limit Price"
            tooltipText="The limit price is the price at which this order shall be (partially) filled, in combination with the specified slippage. The fee is already deducted from the sell amount."
          >
            {formatNumber(limitPrice, 4)}{" "}
            {stopLossOrder?.stopLossData?.tokenIn.symbol} for{" "}
            {stopLossOrder?.stopLossData?.tokenOut.symbol}
          </OrderInformation>
          {stopLossOrder?.executedSellAmount && (
            <>
              <OrderInformation
                label="Execution Price"
                tooltipText="The actual price at which this order has been matched and executed, after deducting fees from the amount sold."
              >
                {formatNumber(executionPrice, 4)}{" "}
                {stopLossOrder?.stopLossData?.tokenIn.symbol} for{" "}
                {stopLossOrder?.stopLossData?.tokenOut.symbol}
              </OrderInformation>
              <OrderInformation
                label="Order"
                tooltipText="The amount sold/bought. Also surplus for this order. This is the positive difference between the initial limit price and the actual (average) execution price."
              >
                {formatNumber(executedAmountIn, 4)}{" "}
                {stopLossOrder?.stopLossData?.tokenIn.symbol} for{" "}
                {formatNumber(executedAmountOut, 4)}{" "}
                {stopLossOrder?.stopLossData?.tokenOut.symbol} (
                {formatNumber(orderSurplus, 4)}% Surplus)
              </OrderInformation>
            </>
          )}
          <OrderInformation label="Oracle Token In">
            {stopLossOrder?.stopLossData?.sellTokenPriceOracle}
          </OrderInformation>
          <OrderInformation label="Oracle Token In">
            {stopLossOrder?.stopLossData?.buyTokenPriceOracle}
          </OrderInformation>
        </div>
        {ordersRelated.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="flex flex-col gap-y-1">
              <OrderInformation label="Related Orders">
                <div className="flex flex-col">
                  {ordersRelated.map((order) => (
                    <div className="flex items-center gap-x-1">
                      <span
                        className={cn(
                          order.hash === stopLossOrder?.hash && "font-bold",
                        )}
                      >
                        {order.hash}
                      </span>
                      <StatusBadge status={stopLossOrder?.status}/>
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
