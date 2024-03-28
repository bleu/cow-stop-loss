import { formatNumber } from "@bleu-fi/ui";
import { formatUnits } from "viem";

import { useBuilder } from "#/contexts/builder";
import { useSafeBalances } from "#/hooks/useSafeBalances";
import { calculateAmounts } from "#/lib/calculateAmounts";
import { ISwapData } from "#/lib/types";

import { InfoTooltip } from "../Tooltip";
import { BaseNode } from ".";

export function SwapNode({
  selected,
  data,
}: {
  selected: boolean;
  data: ISwapData;
}) {
  const { fetchBalance } = useSafeBalances();
  const { getOrderDataByOrderId } = useBuilder();
  const recipeData = getOrderDataByOrderId(data.orderId);
  if (!recipeData) return null;
  const sellTokenWalletAmount = Number(
    formatUnits(
      BigInt(fetchBalance(data.tokenSell.address)),
      data.tokenSell.decimals
    )
  );
  const [sellAmount, buyAmount] = calculateAmounts(recipeData);
  const sellAmountWithSymbol = `${formatNumber(sellAmount, 2, "decimal", "compact", 0.01)} ${data.tokenSell.symbol}`;
  const buyAmountWithSymbol = `${formatNumber(buyAmount, 2, "decimal", "compact", 0.01)} ${data.tokenBuy.symbol}`;
  return (
    <BaseNode selected={selected}>
      <div className="flex flex-col">
        <div className="flex flex-row gap-2 items-center">
          <span className="text-sm font-bold text-highlight">Swap</span>
          {sellTokenWalletAmount < sellAmount && (
            <InfoTooltip variant="error" text="You don't have enough amount of the selling token. The order can still be posted but it will never be filled until you don't have enough tokens in your wallet." />
          )}
        </div>{" "}
        <div className="text-xs">
          {data.isSellOrder
            ? `Sell ${sellAmountWithSymbol} for at least ${buyAmountWithSymbol}`
            : `Buy ${buyAmountWithSymbol} with at most ${sellAmountWithSymbol}`}
        </div>
      </div>
    </BaseNode>
  );
}
