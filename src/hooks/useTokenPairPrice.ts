import { ChainId } from "#/lib/publicClients";
import { IToken } from "#/lib/types";

import { useTokenPrice } from "./useTokenPrice";

export const useTokenPairPrice = (
  tokenSell?: IToken,
  tokenBuy?: IToken,
  chainId?: ChainId,
) => {
  const { data: sellPrice, error: sellError } = useTokenPrice(
    tokenSell,
    chainId,
  );
  const { data: buyPrice, error: buyError } = useTokenPrice(tokenBuy, chainId);

  return {
    data: sellPrice && buyPrice ? sellPrice / buyPrice : undefined,
    error: sellError || buyError,
    isLoading: (!sellPrice && !sellError) || (!buyPrice && !buyError),
  };
};
