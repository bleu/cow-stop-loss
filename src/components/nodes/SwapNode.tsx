import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { formatUnits } from "viem";

import { useBuilder } from "#/contexts/builder";
import { useSafeBalances } from "#/hooks/useSafeBalances";
import { calculateAmounts } from "#/lib/calculateAmounts";
import { ISwapData } from "#/lib/types";
import { formatNumber } from "#/utils";

import { Tooltip } from "../Tooltip";
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
            <a>
              <Tooltip content="You don't have enough amount of the selling token. The order can still be posted but it just can be filled when you have the tokens.">
                <ExclamationTriangleIcon className="size-3 text-warning text-bold" />
              </Tooltip>
            </a>
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
