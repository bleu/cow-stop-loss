import type { PreparedSafePlacement, SafeCall } from "#/lib/safeStopLoss";
import { encodeStopLossStaticInput } from "#/lib/staticInputEncoder";
import { type DraftOrder, OrderStatus } from "#/lib/types";

export const safeAccount = "0x1111111111111111111111111111111111111111";
export const safeProposalId = `0x${"12".repeat(32)}` as const;
export const safeDraft: DraftOrder = {
  id: "safe-order",
  tokenSell: {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
    symbol: "WETH",
  },
  tokenBuy: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    symbol: "USDC",
  },
  amountSell: "1",
  amountBuy: "1980",
  strikePrice: "2000",
  limitPrice: "1980",
  slippagePercent: "1",
  isSellOrder: true,
  receiver: safeAccount,
  partiallyFillable: true,
  maxHoursSinceOracleUpdates: 1,
  validTo: 1800003600,
  salt: `0x${"ab".repeat(32)}`,
  tokenSellOracle: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  tokenBuyOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
  oraclePrice: 2000,
  status: OrderStatus.DRAFT,
};

export const safePrepared: PreparedSafePlacement = {
  account: safeAccount,
  owner: safeAccount,
  chainId: 1,
  draft: safeDraft,
  appDataHash: `0x${"34".repeat(32)}`,
  fullAppData: "{}",
  staticInput: encodeStopLossStaticInput(safeDraft, `0x${"34".repeat(32)}`),
  paramsHash: `0x${"56".repeat(32)}`,
  domainSeparator: `0x${"78".repeat(32)}`,
};

export const safeCreateCall: SafeCall = {
  to: "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74",
  data: "0x1234",
  value: BigInt(0),
  stage: "create",
};

export function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

export const memoryLocks = {
  request: async <T>(_name: string, action: () => T | Promise<T>) => action(),
};
