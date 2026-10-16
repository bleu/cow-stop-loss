import type { Address } from "viem";

import type { ChainId } from "#/lib/publicClients";
import type { IToken } from "#/lib/types";

import { useAdvancedSettingsStore } from "./useAdvancedSettings";
import { useTokenPrice } from "./useTokenPrice";

export const useTokenPairPrice = (
  tokenSell?: IToken,
  tokenBuy?: IToken,
  chainId?: ChainId,
  savedOracles?: {
    tokenSellOracle: Address;
    tokenBuyOracle: Address;
    maxAge: number;
  },
) => {
  const maxHours = useAdvancedSettingsStore(
    (state) => state.advancedSettings.maxHoursSinceOracleUpdates,
  );
  const maxAge = savedOracles?.maxAge ?? maxHours * 60 * 60;
  const sell = useTokenPrice(
    tokenSell,
    chainId,
    savedOracles?.tokenSellOracle,
    maxAge,
  );
  const buy = useTokenPrice(
    tokenBuy,
    chainId,
    savedOracles?.tokenBuyOracle,
    maxAge,
  );
  const price = sell.data && buy.data ? sell.data / buy.data : undefined;
  return {
    data: price && Number.isFinite(price) && price > 0 ? price : undefined,
    error: sell.error || buy.error,
    isLoading: sell.isLoading || buy.isLoading,
  };
};
