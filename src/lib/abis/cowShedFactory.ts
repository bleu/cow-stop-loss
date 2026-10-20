import { parseAbi } from "viem";

export const cowShedFactoryAbi = parseAbi([
  "function proxyOf(address who) view returns (address)",
  "function executeOwnHooks((address target,uint256 value,bytes callData,bool allowFailure,bool isDelegateCall)[] calls) payable returns (address proxy)",
]);

export const cowShedAbi = parseAbi([
  "function trustedExecutor() view returns (address)",
]);
