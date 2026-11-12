import { parseAbi } from "viem";

// Deployed GPv2 Settlement and HooksTrampoline interfaces; see docs/first-use-stop-loss.md.
export const settlementAbi = parseAbi([
  "function authenticator() view returns (address)",
  "function filledAmount(bytes orderUid) view returns (uint256)",
  "function settle(address[] tokens,uint256[] clearingPrices,(uint256 sellTokenIndex,uint256 buyTokenIndex,address receiver,uint256 sellAmount,uint256 buyAmount,uint32 validTo,bytes32 appData,uint256 feeAmount,uint256 flags,uint256 executedAmount,bytes signature)[] trades,(address target,uint256 value,bytes callData)[][3] interactions)",
  "event Trade(address indexed owner,address sellToken,address buyToken,uint256 sellAmount,uint256 buyAmount,uint256 feeAmount,bytes orderUid)",
]);

export const trampolineAbi = parseAbi([
  "function execute((address target,bytes callData,uint256 gasLimit)[] hooks)",
]);

export const pollerEvents = parseAbi([
  "event Pulled(bytes32 indexed id,bytes32 indexed orderDigest,uint256 amount)",
]);
