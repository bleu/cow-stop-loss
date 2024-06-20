import { formatNumber } from "@bleu/ui";
import { useEffect, useState } from "react";
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
  const [sellTokenWalletAmount, setSellTokenWalletAmount] = useState<number>();
  const [sellAmount, setSellAmount] = useState<number>();
  const [buyAmount, setBuyAmount] = useState<number>();
  const { getOrderDataByOrderId } = useBuilder();
  const recipeData = getOrderDataByOrderId(data.orderId);

  useEffect(() => {
    if (!recipeData) return;
    const newSellTokenWalletAmount = Number(
      formatUnits(
        BigInt(fetchBalance(data.tokenSell.address)),
        data.tokenSell.decimals
      )
    );
    setSellTokenWalletAmount(newSellTokenWalletAmount);
    const [newSellAmount, newBuyAmount] = calculateAmounts(recipeData);
    setSellAmount(newSellAmount);
    setBuyAmount(newBuyAmount);
  }, [recipeData, data, fetchBalance]);

  if (!sellAmount || !buyAmount)
    return (
      <BaseNode selected={selected}>
        <div className="flex flex-col">
          <div className="flex flex-row gap-2 items-center">
            <span className="text-sm font-bold text-highlight">Swap</span>
          </div>
          <div className="text-xs">Define oracles to calculate the amounts</div>
        </div>
      </BaseNode>
    );

  const sellAmountWithSymbol = `${formatNumber(sellAmount, 2, "decimal", "compact", 0.01)} ${data.tokenSell.symbol}`;
  const buyAmountWithSymbol = `${formatNumber(buyAmount, 2, "decimal", "compact", 0.01)} ${data.tokenBuy.symbol}`;
  return (
    <BaseNode selected={selected}>
      <div className="flex flex-col">
        <div className="flex flex-row gap-2 items-center">
          <span className="text-sm font-bold text-highlight">Swap</span>
          {sellAmount && (sellTokenWalletAmount || 0) < sellAmount && (
            <InfoTooltip
              variant="error"
              text="You don't have enough amount of the selling token. The order can still be posted but it can just be filled with the tokens that you have on your wallet."
            />
          )}
        </div>
        <div className="text-xs">
          {data.isSellOrder
            ? `Sell ${sellAmountWithSymbol} for at least ${buyAmountWithSymbol}`
            : `Buy ${buyAmountWithSymbol} with at most ${sellAmountWithSymbol}`}
        </div>
      </div>
    </BaseNode>
  );
}
