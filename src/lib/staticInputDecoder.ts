import { Address, decodeAbiParameters, decodeFunctionData } from "viem";
import { stopLossDataStructure } from "./staticInputEncoder";
import { composableCowAbi } from "./abis/composableCow";

export type argType =
  | string
  | bigint
  | boolean
  | string[]
  | boolean[]
  | bigint[];

export function decodeComposableCowCreateTxData(data: `0x${string}`) {
  const { functionName, args } = decodeFunctionData({
    abi: composableCowAbi,
    data: data,
  });

  if (functionName !== "create") {
    throw new Error("Invalid function name");
  }

  const argList = decodeAbiParameters(
    stopLossDataStructure,
    args[0].staticInput,
  ) as argType[];

  return {
    sellToken: argList[0] as Address,
    buyToken: argList[1] as Address,
    sellAmount: argList[2] as bigint,
    buyAmount: argList[3] as bigint,
    appData: argList[4] as `0x${string}`,
    receiver: argList[5] as Address,
    isSellOrder: argList[6] as boolean,
    isPartiallyFillable: argList[7] as boolean,
    validTo: argList[8] as bigint,
    sellTokenPriceOracle: argList[9] as Address,
    buyTokenPriceOracle: argList[10] as Address,
    strike: argList[11] as bigint,
    maxTimeSinceLastOracleUpdate: argList[12] as bigint,
  };
}
