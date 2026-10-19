export const safeTransactionServices = {
  1: "https://api.safe.global/tx-service/eth",
  100: "https://api.safe.global/tx-service/gno",
  42161: "https://api.safe.global/tx-service/arb1",
  11155111: "https://api.safe.global/tx-service/sep",
} as const;

export function isSafeChainId(
  chainId: number,
): chainId is keyof typeof safeTransactionServices {
  return Object.prototype.hasOwnProperty.call(safeTransactionServices, chainId);
}
