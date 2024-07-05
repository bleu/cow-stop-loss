"use client";

import {
  Button,
  Dialog,
  DialogContent,
  formatNumber,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from "@bleu/ui";
import { ArrowDownIcon } from "@radix-ui/react-icons";
import cn from "clsx";
import * as React from "react";
import { Address } from "viem";

import { useOrder } from "#/contexts/ordersContext";
import { useTokens } from "#/contexts/tokensContext";
import { useFallbackState } from "#/hooks/useFallbackState";
import { ChainId } from "#/lib/publicClients";
import { formatTimeDelta } from "#/lib/timeDelta";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import { createRawTxArgs } from "#/lib/transactionFactory";
import { DraftOrder, IToken } from "#/lib/types";

import { AddressWithLink } from "./AddressWithLink";
import { OraclePriceWarning } from "./OraclePriceAlert";
import { TokenAmount } from "./TokenAmount";
import { TokenInfo } from "./TokenInfo";
import { InfoTooltip } from "./Tooltip";

export function ReviewOrdersDialog({
  draftOrders,
  open,
  setOpen,
  showAddOrders = false,
}: {
  draftOrders: DraftOrder[];
  open: boolean;
  setOpen: (open: boolean) => void;
  showAddOrders?: boolean;
}) {
  const {
    addDraftOrders,
    removeDraftOrders,
    txManager: { writeContract },
    setTxPendingDialog,
  } = useOrder();
  const multipleOrders = draftOrders.length > 1;
  const {
    safe: { safeAddress, chainId },
    fallbackState,
    domainSeparator,
  } = useFallbackState();

  const onSubmit = async () => {
    if (!fallbackState || !domainSeparator) return;
    const txArgs = await createRawTxArgs({
      data: draftOrders,
      safeAddress: safeAddress as Address,
      chainId: chainId as ChainId,
      fallbackState,
      domainSeparator,
    });
    writeContract(txArgs, {
      onSuccess: () => {
        removeDraftOrders(draftOrders.map((order) => order.id));
        setOpen(false);
        setTxPendingDialog(true);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "data-[state=open]:animate-contentShow rounded-lg focus:outline-none bg-foreground w-[90vw] max-w-[450px]"
        )}
      >
        <div className="flex flex-col gap-2 w-full overflow-y-scroll max-h-[85vh]">
          <div className="text-2xl font-medium ">
            Review Stop Loss order{multipleOrders ? "s" : ""}
          </div>
          <TabsRoot>
            <TabsList defaultValue={String(0)} className="flex justify-start">
              {draftOrders.map((order, index) => {
                return (
                  <TabsTrigger
                    value={order.id}
                    className="data-[state=active]:text-white"
                  >{`#${index + 1}`}</TabsTrigger>
                );
              })}
            </TabsList>
            {draftOrders.map((order) => {
              return <OrderTab order={order} />;
            })}
          </TabsRoot>

          <Button className="w-full mt-3" onClick={onSubmit}>
            {multipleOrders
              ? `Place all ${draftOrders.length} Stop Loss orders`
              : "Place Stop Loss order"}
          </Button>
          {showAddOrders && (
            <Button
              variant="link"
              className=" text-wrap text-xs text-white"
              onClick={() => {
                addDraftOrders(draftOrders);
                setOpen(false);
              }}
            >
              Want to place another orders to save fees? Click here to save this
              one into drafts and create another one.
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderTab({ order }: { order: DraftOrder }) {
  return (
    <TabsContent value={order.id}>
      <div className="flex flex-col items-center gap-2 w-full">
        <TokenInformation
          title={order.isSellOrder ? "Sell exactly" : "Sell at most"}
          token={order.tokenSell}
          balance={order.amountSell}
        />
        <ArrowDownIcon className="size-8" />
        <TokenInformation
          title={order.isSellOrder ? "Receive at least" : "Receive exactly"}
          token={order.tokenBuy}
          balance={order.amountBuy}
        />
        <OraclePriceWarning draftOrder={order} />
        <div className="w-full flex flex-col gap-1 mt-2">
          <OrderInformation
            title="Trigger price"
            tooltipText={TOOLTIP_DESCRIPTIONS.TRIGGER_PRICE}
          >
            {order.tokenSell.symbol} = {formatNumber(order.strikePrice, 4)}{" "}
            {order.tokenBuy.symbol}
          </OrderInformation>
          <OrderInformation
            title="Limit price"
            tooltipText={TOOLTIP_DESCRIPTIONS.LIMIT_PRICE}
          >
            {order.tokenSell.symbol} = {formatNumber(order.limitPrice, 4)}{" "}
            {order.tokenBuy.symbol}
          </OrderInformation>
          <OrderInformation
            title="Current oracle price"
            tooltipText={TOOLTIP_DESCRIPTIONS.CURRENT_ORACLE_PRICE}
          >
            {order.tokenSell.symbol} = {formatNumber(order.oraclePrice, 4)}{" "}
            {order.tokenBuy.symbol}
          </OrderInformation>
          {order.marketPrice && (
            <OrderInformation
              title="Current market price"
              tooltipText={TOOLTIP_DESCRIPTIONS.CURRENT_MARKET_PRICE}
            >
              {order.tokenSell.symbol} = {formatNumber(order.marketPrice, 4)}{" "}
              {order.tokenBuy.symbol}
            </OrderInformation>
          )}
          <OrderInformation
            title="Type"
            tooltipText={TOOLTIP_DESCRIPTIONS.TYPE}
          >
            {order.partiallyFillable ? "Partial fillable" : "Fill or Kill"}
          </OrderInformation>
          <OrderInformation
            title="Receiver"
            tooltipText={TOOLTIP_DESCRIPTIONS.RECIPIENT}
          >
            <AddressWithLink address={order.receiver} />
          </OrderInformation>
          <OrderInformation
            title={`${order.tokenSell.symbol} oracle`}
            tooltipText={TOOLTIP_DESCRIPTIONS.ORACLE_TOKEN_SELL}
          >
            <AddressWithLink address={order.tokenSellOracle} />
          </OrderInformation>
          <OrderInformation
            title={`${order.tokenBuy.symbol} oracle`}
            tooltipText={TOOLTIP_DESCRIPTIONS.ORACLE_TOKEN_BUY}
          >
            <AddressWithLink address={order.tokenBuyOracle} />
          </OrderInformation>
          <OrderInformation
            title="Oracles validity time"
            tooltipText={TOOLTIP_DESCRIPTIONS.MAX_TIME_SINCE_LAST_ORACLE_UPDATE}
          >
            {formatTimeDelta(order.maxHoursSinceOracleUpdates * 3600)}
          </OrderInformation>
        </div>
      </div>
    </TabsContent>
  );
}

function OrderInformation({
  title,
  tooltipText,
  children,
}: {
  title: string;
  tooltipText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between text-sm pb-1 border-b border-background">
      <div className="flex gap-1">
        <span>{title}</span>
        <InfoTooltip text={tooltipText} />
      </div>
      <span>{children}</span>
    </div>
  );
}

function TokenInformation({
  title,
  token,
  balance,
}: {
  title: string;
  token: IToken;
  balance: number;
}) {
  const [tokenPrice, setTokenPrice] = React.useState<number>();
  const { getOrFetchTokenPrice } = useTokens();

  React.useEffect(() => {
    getOrFetchTokenPrice(token).then(setTokenPrice);
  }, [token]);

  return (
    <div className="flex flex-col gap-2 bg-background/80 rounded-lg p-2 w-full">
      <span className="text-xs">{title}</span>
      <div className="flex items-center justify-between">
        <TokenInfo token={token} />
        <TokenAmount
          token={token}
          balance={balance}
          usdPrice={tokenPrice || 0}
        />
      </div>
    </div>
  );
}
