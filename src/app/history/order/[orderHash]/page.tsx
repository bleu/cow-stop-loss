"use client"

import { Separator } from "@bleu-fi/ui";

import { Spinner } from "#/components/Spinner";
import { useOrder } from "#/contexts/ordersContext";
import { epochToDate, formatDateToLocalDatetime } from "#/utils";

import { OrderInformation } from "./(components)/OrderInformation";

export default function OrderPage({
  params,
}: {
  params: {
    orderHash: string
  };
}
){
  const { orders, loaded } = useOrder(); 

  if (!loaded) {
    return <Spinner />;
  }
  const stopLossOrder = orders.find((order) => order.hash === params.orderHash);
  const ordersRelated = orders.filter((order) => order.stopLossData?.appData === stopLossOrder?.stopLossData?.appData);

  return (
    <div className="flex w-full justify-center h-[calc(100vh - 80px - 52px)]">
      <div className="bg-blue3 my-10 text-white p-10 rounded">
        <OrderInformation label="Order Hash">{
          stopLossOrder?.hash
        }</OrderInformation>
        <OrderInformation label="Status">
          {stopLossOrder?.status}
        </OrderInformation> 
        <OrderInformation label="Submission Time">
          {formatDateToLocalDatetime(epochToDate(Number(stopLossOrder?.blockTimestamp)))}
        </OrderInformation>
        <OrderInformation label="Expiration Time">
          {stopLossOrder?.stopLossData?.validityBucketSeconds}
        </OrderInformation>
        <Separator />
        <OrderInformation label="Amount">
          <div className="flex flex-col">
            <span>
              {Number(stopLossOrder?.stopLossData?.tokenAmountIn)/(10 ** Number(stopLossOrder?.stopLossData?.tokenIn.decimals))} {stopLossOrder?.stopLossData?.tokenIn.symbol}
            </span>
            <span>
              {Number(stopLossOrder?.stopLossData?.tokenAmountOut)/(10 ** Number(stopLossOrder?.stopLossData?.tokenOut.decimals))} {stopLossOrder?.stopLossData?.tokenOut.symbol}
            </span>
          </div>
        </OrderInformation>
        <OrderInformation label="Limit Price">
          {stopLossOrder?.stopLossData?.validityBucketSeconds}
        </OrderInformation>
        <OrderInformation label="Execution Price">
          {stopLossOrder?.stopLossData?.validityBucketSeconds}
        </OrderInformation>
        <OrderInformation label="Order">
          X for Y ({stopLossOrder?.stopLossData?.validityBucketSeconds}% Surplus)
        </OrderInformation>
        <OrderInformation label="Oracle Token In">
          {stopLossOrder?.stopLossData?.sellTokenPriceOracle}
        </OrderInformation>
        <OrderInformation label="Oracle Token In">
          {stopLossOrder?.stopLossData?.buyTokenPriceOracle}
        </OrderInformation>
        <Separator />
        <OrderInformation label="Orders Posted">
          <div className="flex flex-col">
            {ordersRelated.map((order) => (
              <span key={order.hash}>
                {order.hash} ({order.status})
              </span>
            ))}
          </div>
        </OrderInformation>
      </div>
    </div>
  )
}