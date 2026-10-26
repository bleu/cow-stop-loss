jest.mock("#/lib/supportedTokens", () => {
  const actual = jest.requireActual("#/lib/supportedTokens");
  const { TEST_SUPPORTED_TOKENS } = jest.requireActual("#/test/approvedRoutes");
  return {
    ...actual,
    getSupportedTokens: (chainId: import("#/lib/publicClients").ChainId) =>
      TEST_SUPPORTED_TOKENS[chainId] ?? actual.getSupportedTokens(chainId),
  };
});

import type { PublicClient } from "viem";

import {
  assertOrderSizeLimit,
  isWithinOrderSizeLimit,
  ORDER_SIZE_LIMIT_EXCEEDED_ERROR,
  ORDER_SIZE_LIMIT_USD,
  ORDER_SIZE_PRICE_UNAVAILABLE_ERROR,
} from "../orderSizeLimit";
import { publicClientsFromIds } from "../publicClients";
import { getSupportedTokens } from "../supportedTokens";

const { sellTokens } = getSupportedTokens(1);
const tokenSell = sellTokens[0].token;
const timestamp = BigInt(100_000);
const unit = BigInt(10) ** BigInt(tokenSell.decimals);
const capAmount = BigInt(4) * unit;
const getBlock = jest.fn();
const readContract = jest.fn();
const client = { getBlock, readContract } as unknown as PublicClient;

beforeEach(() => {
  getBlock.mockResolvedValue({ number: BigInt(123), timestamp });
  readContract.mockImplementation(async ({ functionName }) =>
    functionName === "decimals"
      ? 8
      : [
          BigInt(1),
          BigInt(2500) * BigInt(10) ** BigInt(8),
          BigInt(1),
          timestamp,
          BigInt(1),
        ],
  );
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe("exact order size comparison", () => {
  it.each([0, 6, 8, 18, 36])("handles %i token decimals", (tokenDecimals) => {
    const scale = BigInt(10) ** BigInt(tokenDecimals);
    const args = {
      tokenDecimals,
      answer: BigInt(100_000_000),
      oracleDecimals: 8,
    };
    const sellAmount = ORDER_SIZE_LIMIT_USD * scale;
    expect(
      isWithinOrderSizeLimit({ ...args, sellAmount: sellAmount - BigInt(1) }),
    ).toBe(true);
    expect(isWithinOrderSizeLimit({ ...args, sellAmount })).toBe(true);
    expect(
      isWithinOrderSizeLimit({ ...args, sellAmount: sellAmount + BigInt(1) }),
    ).toBe(false);
  });

  it.each([0, 6, 8, 18])("handles %i oracle decimals", (oracleDecimals) => {
    const args = {
      tokenDecimals: 18,
      answer: BigInt(2500) * BigInt(10) ** BigInt(oracleDecimals),
      oracleDecimals,
    };
    expect(isWithinOrderSizeLimit({ ...args, sellAmount: capAmount })).toBe(
      true,
    );
    expect(
      isWithinOrderSizeLimit({ ...args, sellAmount: capAmount + BigInt(1) }),
    ).toBe(false);
  });

  it("compares a fractional notional without rounding down", () => {
    expect(
      isWithinOrderSizeLimit({
        sellAmount: BigInt(30001),
        tokenDecimals: 0,
        answer: BigInt(33333333),
        oracleDecimals: 8,
      }),
    ).toBe(false);
  });

  it("handles raw amounts beyond Number precision", () => {
    expect(
      isWithinOrderSizeLimit({
        sellAmount: BigInt(2) ** BigInt(255),
        tokenDecimals: 18,
        answer: BigInt(1),
        oracleDecimals: 18,
      }),
    ).toBe(false);
  });

  it.each([-1, 0.5, 256, NaN])("rejects invalid decimals %s", (decimals) => {
    expect(() =>
      isWithinOrderSizeLimit({
        sellAmount: BigInt(1),
        tokenDecimals: decimals,
        answer: BigInt(1),
        oracleDecimals: 8,
      }),
    ).toThrow(ORDER_SIZE_PRICE_UNAVAILABLE_ERROR);
    expect(() =>
      isWithinOrderSizeLimit({
        sellAmount: BigInt(1),
        tokenDecimals: 18,
        answer: BigInt(1),
        oracleDecimals: decimals,
      }),
    ).toThrow(ORDER_SIZE_PRICE_UNAVAILABLE_ERROR);
  });
});

describe("fresh USD order size validation", () => {
  it.each([-1, 0])(
    "accepts amounts at or below the cap (%i raw units)",
    async (offset) => {
      await expect(
        assertOrderSizeLimit({
          chainId: 1,
          tokenSell,
          sellAmount: capAmount + BigInt(offset),
          client,
        }),
      ).resolves.toBeUndefined();
    },
  );

  it("rejects one raw unit above the cap", async () => {
    await expect(
      assertOrderSizeLimit({
        chainId: 1,
        tokenSell,
        sellAmount: capAmount + BigInt(1),
        client,
      }),
    ).rejects.toThrow(ORDER_SIZE_LIMIT_EXCEEDED_ERROR);
  });

  it("uses only the injected client and pins reads to its fresh block", async () => {
    const globalRead = jest.spyOn(publicClientsFromIds[1], "readContract");
    await assertOrderSizeLimit({
      chainId: 1,
      tokenSell,
      sellAmount: unit,
      client,
    });
    expect(getBlock).toHaveBeenCalledTimes(1);
    expect(readContract).toHaveBeenCalledTimes(2);
    for (const [request] of readContract.mock.calls) {
      expect(request).toMatchObject({
        address: sellTokens[0].oracles.USD,
        blockNumber: BigInt(123),
      });
    }
    expect(globalRead).not.toHaveBeenCalled();
  });

  it("does not cache prices between checks", async () => {
    await assertOrderSizeLimit({
      chainId: 1,
      tokenSell,
      sellAmount: capAmount,
      client,
    });
    readContract.mockResolvedValueOnce([
      BigInt(1),
      BigInt(2501_00000000),
      BigInt(1),
      timestamp,
      BigInt(1),
    ]);
    await expect(
      assertOrderSizeLimit({
        chainId: 1,
        tokenSell,
        sellAmount: capAmount,
        client,
      }),
    ).rejects.toThrow(ORDER_SIZE_LIMIT_EXCEEDED_ERROR);
    expect(getBlock).toHaveBeenCalledTimes(2);
  });

  it("rejects forged token decimals before reading a feed", async () => {
    await expect(
      assertOrderSizeLimit({
        chainId: 1,
        tokenSell: { ...tokenSell, decimals: tokenSell.decimals + 1 },
        sellAmount: capAmount,
        client,
      }),
    ).rejects.toThrow(ORDER_SIZE_PRICE_UNAVAILABLE_ERROR);
    expect(getBlock).not.toHaveBeenCalled();
  });

  it("rejects unknown tokens before reading a feed", async () => {
    await expect(
      assertOrderSizeLimit({
        chainId: 1,
        tokenSell: {
          ...tokenSell,
          address: "0x1111111111111111111111111111111111111111",
        },
        sellAmount: unit,
        client,
      }),
    ).rejects.toThrow(ORDER_SIZE_PRICE_UNAVAILABLE_ERROR);
    expect(getBlock).not.toHaveBeenCalled();
  });

  it("does not synthesize USD for an ETH-only token", async () => {
    const ethOnly = sellTokens.find(
      ({ oracles }) => oracles.ETH && !oracles.USD,
    )!;
    await expect(
      assertOrderSizeLimit({
        chainId: 1,
        tokenSell: ethOnly.token,
        sellAmount: BigInt(1),
        client,
      }),
    ).rejects.toThrow(ORDER_SIZE_PRICE_UNAVAILABLE_ERROR);
    expect(readContract).not.toHaveBeenCalled();
  });

  it("reads direct USD when the pair route prefers ETH", async () => {
    const dual = sellTokens.find(({ oracles }) => oracles.ETH && oracles.USD)!;
    await assertOrderSizeLimit({
      chainId: 1,
      tokenSell: dual.token,
      sellAmount: BigInt(1),
      client,
    });
    expect(
      readContract.mock.calls.every(
        ([request]) => request.address === dual.oracles.USD,
      ),
    ).toBe(true);
  });

  it.each([
    ["stale", BigInt(1), BigInt(1), timestamp - BigInt(86401), BigInt(1)],
    ["zero", BigInt(1), BigInt(0), timestamp, BigInt(1)],
    ["negative", BigInt(1), BigInt(-1), timestamp, BigInt(1)],
    ["incomplete", BigInt(2), BigInt(1), timestamp, BigInt(1)],
    ["future", BigInt(1), BigInt(1), timestamp + BigInt(1), BigInt(1)],
  ])(
    "fails closed for a %s feed",
    async (_, round, answer, updatedAt, answeredInRound) => {
      readContract.mockResolvedValueOnce([
        round,
        answer,
        BigInt(1),
        updatedAt,
        answeredInRound,
      ]);
      await expect(
        assertOrderSizeLimit({
          chainId: 1,
          tokenSell,
          sellAmount: unit,
          client,
        }),
      ).rejects.toThrow(ORDER_SIZE_PRICE_UNAVAILABLE_ERROR);
    },
  );

  it("fails closed when the RPC is unavailable", async () => {
    getBlock.mockRejectedValueOnce(new Error("RPC failed"));
    await expect(
      assertOrderSizeLimit({ chainId: 1, tokenSell, sellAmount: unit, client }),
    ).rejects.toThrow(ORDER_SIZE_PRICE_UNAVAILABLE_ERROR);
  });
});
