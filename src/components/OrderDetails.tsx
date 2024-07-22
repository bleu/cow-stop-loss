"use client";

import {
  Button,
  ClickToCopy,
  epochToDate,
  formatDateTime,
  formatNumber,
  Separator,
} from "@bleu/ui";
import {
  ArrowLeftIcon,
  ArrowTopRightIcon,
  CopyIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Address, formatUnits } from "viem";

import { OrderDetailsInformation } from "#/components/OrderDetailsInformation";
import { StatusBadge } from "#/components/StatusBadge";
import { TokenLogo } from "#/components/TokenLogo";
import { Spinner } from "#/components/ui/spinner";
import { InfoTooltip } from "#/components/ui/tooltip";
import { useTxManager } from "#/hooks/useTxManager";
import { COMPOSABLE_COW_ADDRESS } from "#/lib/contracts";
import { getProcessedStopLossOrder } from "#/lib/ponderApi/fetchOrders";
import { ChainId } from "#/lib/publicClients";
import { formatTimeDelta } from "#/lib/timeDelta";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { OrderCancelArgs, TRANSACTION_TYPES } from "#/lib/transactionFactory";
import { OrderStatus } from "#/lib/types";
import { buildOrderCowExplorerUrl, truncateAddress } from "#/utils";

import { BlockExplorerLink } from "./ExplorerLink";

export function OrderDetails({
  orderId,
  chainId,
  address,
}: {
  orderId: string;
  address: Address;
  chainId: ChainId;
}) {
  const orderFetcher = async () => {
    return getProcessedStopLossOrder({
      chainId,
      orderId,
      userAddress: address,
    });
  };
  const {
    data: order,
    isValidating,
    isLoading,
    mutate,
  } = useSWR([orderId], orderFetcher);

  const router = useRouter();

  const { writeContract, isPonderUpdating } = useTxManager();

  const isUpdating = isLoading || isPonderUpdating || isValidating;

  if (isUpdating && !order) {
    return <Spinner />;
  }

  if (!order) {
    return null;
  }

  const orderDateTime = formatDateTime(
    epochToDate(Number(order?.blockTimestamp))
  );

  const orderValidTo = formatDateTime(
    epochToDate(Number(order?.stopLossData?.validTo))
  );

  const maxOracleUpdateTime = formatTimeDelta(
    order?.stopLossData?.maxTimeSinceLastOracleUpdate as number
  );

  const amountIn =
    Number(order?.stopLossData?.tokenSellAmount) /
    10 ** Number(order?.stopLossData?.tokenSell.decimals);
  const amountOut =
    Number(order?.stopLossData?.tokenBuyAmount) /
    10 ** Number(order?.stopLossData?.tokenBuy.decimals);
  const executedAmountIn =
    Number(order?.stopLossData?.executedTokenSellAmount) /
    10 ** Number(order?.stopLossData?.tokenSell.decimals);
  const executedAmountOut =
    Number(order?.stopLossData?.executedTokenBuyAmount) /
    10 ** Number(order?.stopLossData?.tokenBuy.decimals);
  const strikePrice = formatUnits(order?.stopLossData?.strike as bigint, 18);
  const limitPrice = amountOut / amountIn;
  const executionPrice = executedAmountOut / executedAmountIn;
  const orderSurplus = ((executionPrice - limitPrice) / limitPrice) * 100;
  const priceUnit = `${order?.stopLossData?.tokenBuy.symbol} per ${order?.stopLossData?.tokenSell.symbol}`;

  const onCancelOrder = () => {
    if (!order) return;
    const deleteTxArgs = {
      type: TRANSACTION_TYPES.ORDER_CANCEL,
      hash: order.hash,
    } as OrderCancelArgs;
    writeContract([deleteTxArgs]);
  };

  return (
    <div className="flex size-full justify-center items-center">
      <div className="bg-muted my-10 text-white p-10 rounded relative">
        <div className="flex flex-row justify-between items-center mb-5">
          <button onClick={router.back}>
            <ArrowLeftIcon className="size-4" />
          </button>
          <div className="flex gap-2 items-center justify-start">
            <h1 className="text-2xl font-bold">Order Details</h1>
            {isUpdating ? (
              <Spinner size="sm" />
            ) : (
              <button
                onClick={() => mutate()}
                className="hover:text-primary px-1"
              >
                <ReloadIcon className="size-4" />
              </button>
            )}
          </div>
          <Button
            onClick={onCancelOrder}
            variant="destructive"
            disabled={
              order?.status !== OrderStatus.OPEN &&
              order?.status !== OrderStatus.PARTIALLY_FILLED
            }
          >
            Cancel
          </Button>
        </div>
        <div className="flex flex-col gap-y-1">
          <OrderDetailsInformation
            label="Order Creation"
            tooltipText={TOOLTIP_DESCRIPTIONS.ORDER_CREATION}
          >
            <div className="flex items-center gap-x-1">
              {order?.txHash}
              <BlockExplorerLink
                type="transaction"
                label={<ArrowTopRightIcon />}
                identifier={order?.txHash}
                networkId={chainId as ChainId}
              />
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
              <BlockExplorerLink
                type="address"
                label={<ArrowTopRightIcon />}
                identifier={COMPOSABLE_COW_ADDRESS}
                networkId={chainId as ChainId}
              />
              <ClickToCopy text={order?.hash as string}>
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Status"
            tooltipText={TOOLTIP_DESCRIPTIONS.STATUS}
          >
            <StatusBadge status={order?.status || ""} />
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Type"
            tooltipText={TOOLTIP_DESCRIPTIONS.TYPE}
          >
            {order?.stopLossData?.isPartiallyFillable
              ? "Partially fillable order"
              : "Fill or kill order"}
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Submission Time"
            tooltipText={TOOLTIP_DESCRIPTIONS.SUBMISSION_TIME}
          >
            {orderDateTime}
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Valid To"
            tooltipText={TOOLTIP_DESCRIPTIONS.VALID_TO}
          >
            {orderValidTo}
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Oracle Validity Time"
            tooltipText={TOOLTIP_DESCRIPTIONS.MAX_TIME_SINCE_LAST_ORACLE_UPDATE}
          >
            {maxOracleUpdateTime}
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Receiver"
            tooltipText={TOOLTIP_DESCRIPTIONS.RECEIVER}
          >
            <div className="flex items-center gap-x-1">
              {order?.stopLossData?.to}
              <BlockExplorerLink
                type="address"
                label={<ArrowTopRightIcon />}
                identifier={order?.stopLossData?.to}
                networkId={chainId as ChainId}
              />
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
                <InfoTooltip
                  text={amountIn.toFixed(
                    order?.stopLossData?.tokenSell.decimals
                  )}
                />
                {order?.stopLossData?.tokenSell.symbol}
                <BlockExplorerLink
                  type="address"
                  label={<ArrowTopRightIcon />}
                  identifier={order?.stopLossData?.tokenSell.address}
                  networkId={chainId as ChainId}
                />
                <TokenLogo
                  tokenAddress={order?.stopLossData?.tokenSell.address.toLowerCase()}
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
                <InfoTooltip
                  text={amountOut.toFixed(
                    order?.stopLossData?.tokenBuy.decimals
                  )}
                />
                {order?.stopLossData?.tokenBuy.symbol}
                <BlockExplorerLink
                  type="address"
                  label={<ArrowTopRightIcon />}
                  identifier={order?.stopLossData?.tokenBuy.address}
                  networkId={chainId as ChainId}
                />
                <TokenLogo
                  tokenAddress={order?.stopLossData?.tokenBuy.address}
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
            <div className="flex gap-1">
              {formatNumber(strikePrice, 4)}{" "}
              <InfoTooltip text={Number(strikePrice).toFixed(18)} /> {priceUnit}
            </div>
          </OrderDetailsInformation>
          <OrderDetailsInformation
            label="Limit Price"
            tooltipText={TOOLTIP_DESCRIPTIONS.LIMIT_PRICE}
          >
            <div className="flex gap-1">
              {formatNumber(limitPrice, 4)}{" "}
              <InfoTooltip text={Number(limitPrice).toFixed(18)} /> {priceUnit}
            </div>
          </OrderDetailsInformation>
          {(Number(order?.stopLossData?.filledPctBpt) || 0) > 0 && (
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
                  {order?.stopLossData?.tokenSell.symbol} for{" "}
                  {formatNumber(executedAmountOut, 4)}{" "}
                  {order?.stopLossData?.tokenBuy.symbol}
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
              <BlockExplorerLink
                type="address"
                label={<ArrowTopRightIcon />}
                identifier={order?.stopLossData?.sellTokenPriceOracle}
                networkId={chainId as ChainId}
              />
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
              <BlockExplorerLink
                type="address"
                label={<ArrowTopRightIcon />}
                identifier={order?.stopLossData?.buyTokenPriceOracle}
                networkId={chainId as ChainId}
              />
              <ClickToCopy
                text={order?.stopLossData?.buyTokenPriceOracle as string}
              >
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderDetailsInformation>
        </div>
        {order?.cowOrder && (
          <OrderDetailsInformation
            label="Orderbook CoW Order"
            tooltipText={TOOLTIP_DESCRIPTIONS.RELATED_ORDER}
          >
            <div className="flex items-center gap-x-1">
              {truncateAddress(order.cowOrder.uid)}
              <Link
                className="hover:text-primary hover:underline"
                href={buildOrderCowExplorerUrl({
                  chainId: order?.chainId as ChainId,
                  orderId: order?.cowOrder.uid as `0x${string}`,
                })}
                rel="noreferrer noopener"
                target="_blank"
              >
                <ArrowTopRightIcon />
              </Link>
              <ClickToCopy text={order?.cowOrder.uid}>
                <CopyIcon className="hover:text-primary" />
              </ClickToCopy>
            </div>
          </OrderDetailsInformation>
        )}
      </div>
    </div>
  );
}
