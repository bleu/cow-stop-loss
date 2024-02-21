import { ChainId } from "../publicClients";
import { COW_API_URL_BY_CHAIN_ID } from "./api";

export async function fetchCowQuote({
  tokenIn,
  tokenOut,
  amount,
  chainId,
  isSell = true,
  priceQuality = "fast",
}: {
  tokenIn: {
    address: string;
    decimals: number;
    symbol: string;
  };
  tokenOut: {
    address: string;
    decimals: number;
    symbol: string;
  };
  amount: number;
  chainId: ChainId;
  isSell: boolean;
  priceQuality?: "fast" | "optimal";
}) {
  const url = COW_API_URL_BY_CHAIN_ID[chainId];

  const bodyObject = {
    sellToken: tokenIn.address,
    buyToken: tokenOut.address,
    receiver: "0x0000000000000000000000000000000000000000",
    from: "0x0000000000000000000000000000000000000000",
    kind: isSell ? "sell" : "buy",
    partiallyFillable: false,
    priceQuality,
    sellTokenBalance: "erc20",
    buyTokenBalance: "erc20",
    [isSell ? "sellAmountBeforeFee" : "buyAmountAfterFee"]: amount
      .toLocaleString()
      .replaceAll(",", ""),
    signingScheme: "eip1271",
    onChainOrder: true,
  };
  return fetch(`${url}/api/v1/quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyObject),
  }).then((res) => res.json());
}
