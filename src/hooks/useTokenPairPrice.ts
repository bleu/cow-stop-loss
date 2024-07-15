import { IToken } from "#/lib/types";

import { useTokenPrice } from "./useTokenPrice";

export const useTokenPairPrice = (tokenSell?: IToken, tokenBuy?: IToken) => {
  const { data: sellPrice, error: sellError } = useTokenPrice(tokenSell);
  const { data: buyPrice, error: buyError } = useTokenPrice(tokenBuy);

  return {
    data: sellPrice && buyPrice ? sellPrice / buyPrice : undefined,
    error: sellError || buyError,
    isLoading: (!sellPrice && !sellError) || (!buyPrice && !buyError),
  };
};
