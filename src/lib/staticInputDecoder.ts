import { decodeAbiParameters, decodeFunctionData } from "viem";
import { stopLossDataStructure } from "./staticInputEncoder";
import { composableCowAbi } from "./abis/composableCow";

export type argTypeName =
  | "uint256"
  | "address"
  | "bool"
  | "address[]"
  | "bool[]"
  | "bytes"
  | "uint24[]";

export type argType =
  | string
  | bigint
  | boolean
  | string[]
  | boolean[]
  | bigint[];

export function decodeComposableCowCreateTxData(
  data: `0x${string}`,
): argType[] {
  const { functionName, args } = decodeFunctionData({
    abi: composableCowAbi,
    data: data,
  });

  if (functionName !== "create") {
    throw new Error("Invalid function name");
  }

  return decodeAbiParameters(
    stopLossDataStructure,
    args[0].staticInput,
  ) as argType[];
}
