import type { Address } from "viem";

import {
  CHAINS_ORACLE_ROUTER_FACTORY,
  configuredTokenRoute,
} from "../oracleRouter";
import { publicClientsFromIds, supportedChainIds } from "../publicClients";
import { getSupportedTokens } from "../supportedTokens";

const timestamp = BigInt(100_000);
const client = publicClientsFromIds[1];

function routerFor(chainId: (typeof supportedChainIds)[number] = 1) {
  const { sellTokens, buyToken } = getSupportedTokens(chainId);
  const Router = CHAINS_ORACLE_ROUTER_FACTORY[chainId];
  return new Router({
    chainId,
    tokenSell: sellTokens[0].token,
    tokenBuy: buyToken.token,
  });
}

afterEach(() => jest.restoreAllMocks());

it.each(supportedChainIds)(
  "uses the same canonical route for every eligible token on chain %s",
  async (chainId) => {
    const { sellTokens, buyToken } = getSupportedTokens(chainId);
    for (const sell of sellTokens) {
      const args = { chainId, tokenSell: sell.token, tokenBuy: buyToken.token };
      const quote = sell.oracles.ETH && buyToken.oracles.ETH ? "ETH" : "USD";
      const route = {
        tokenSellOracle: sell.oracles[quote],
        tokenBuyOracle: buyToken.oracles[quote],
      };
      expect(configuredTokenRoute(args)).toEqual(route);
      const Router = CHAINS_ORACLE_ROUTER_FACTORY[chainId];
      await expect(new Router(args).findRoute()).resolves.toEqual(route);
    }
  },
);

it("uses shared ETH before USD and uses USD when ETH is not shared", () => {
  const { sellTokens, buyToken } = getSupportedTokens(1);
  const dual = sellTokens.find(({ oracles }) => oracles.ETH && oracles.USD)!;
  expect(
    configuredTokenRoute({
      chainId: 1,
      tokenSell: dual.token,
      tokenBuy: buyToken.token,
    }),
  ).toEqual({
    tokenSellOracle: dual.oracles.ETH,
    tokenBuyOracle: buyToken.oracles.ETH,
  });
  const weth = sellTokens.find(({ token }) => token.symbol === "WETH")!;
  expect(
    configuredTokenRoute({
      chainId: 1,
      tokenSell: weth.token,
      tokenBuy: buyToken.token,
    }),
  ).toEqual({
    tokenSellOracle: weth.oracles.USD,
    tokenBuyOracle: buyToken.oracles.USD,
  });
});

it("routes Gnosis into USDT without oracle discovery", async () => {
  jest.spyOn(global, "fetch").mockRejectedValue(new Error("HTTP unavailable"));
  const router = routerFor(100);
  expect(router.tokenBuy.symbol).toBe("USDT");
  await expect(router.findRoute()).resolves.toEqual({
    tokenSellOracle: "0xa767f745331d267c7751297d982b050c93985627",
    tokenBuyOracle: "0x68811d7df835b1c33e6eeae8e7c141ef48d48cc7",
  });
});

it("offers only EOA WETH into USDC (test) on Sepolia with fixed test feeds", async () => {
  const { sellTokens, buyToken } = getSupportedTokens(11155111);
  expect(sellTokens).toHaveLength(1);
  expect(sellTokens[0].token.symbol).toBe("WETH");
  expect(buyToken.token).toMatchObject({ symbol: "USDC (test)", decimals: 18 });
  await expect(routerFor(11155111).findRoute()).resolves.toEqual({
    tokenSellOracle: "0x57Cb700070Cb1b0475E2D668FA8E89cF0Dda9509",
    tokenBuyOracle: "0xEd2D417d759b1E77fe6A8920C79AE4CE6D6930F7",
  });
});

it.each([1, 11155111] as const)(
  "rejects unsupported sell tokens on chain %s",
  async (chainId) => {
    const router = routerFor(chainId);
    router.tokenSell = {
      address: "0x0000000000000000000000000000000000000001",
      symbol: "FAKE",
      decimals: 18,
    };
    await expect(router.findRoute()).rejects.toThrow("Unsupported sell token");
  },
);

it.each(["symbol", "decimals", "address"] as const)(
  "rejects forged sell metadata: %s",
  async (field) => {
    const router = routerFor();
    router.tokenSell = {
      ...router.tokenSell,
      [field]:
        field === "decimals"
          ? 6
          : field === "symbol"
            ? "FAKE"
            : "0x0000000000000000000000000000000000000001",
    };
    await expect(router.findRoute()).rejects.toThrow("Unsupported sell token");
  },
);

it("rejects arbitrary and historical buy tokens", async () => {
  const router = routerFor(100);
  router.tokenBuy = {
    address: "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0",
    symbol: "USDC.e",
    decimals: 6,
  };
  await expect(router.findRoute()).rejects.toThrow("Unsupported buy token");
});

it("normalizes feed decimals and pins pair reads to one block", async () => {
  const router = routerFor();
  const route = await router.findRoute();
  jest
    .spyOn(client, "getBlock")
    .mockResolvedValue({ number: BigInt(123), timestamp } as Awaited<
      ReturnType<typeof client.getBlock>
    >);
  jest
    .spyOn(client, "readContract")
    .mockImplementation(async ({ address, functionName }) => {
      const isSell =
        address?.toLowerCase() === route.tokenSellOracle.toLowerCase();
      if (functionName === "decimals") return isSell ? 8 : 18;
      return [
        BigInt(1),
        BigInt(isSell ? "250050000000" : "2000000000000000000"),
        BigInt(1),
        timestamp,
        BigInt(1),
      ];
    });
  await expect(router.calculatePrice(route)).resolves.toBe(1250.25);
  expect(client.getBlock).toHaveBeenCalledTimes(1);
  expect(client.readContract).toHaveBeenCalledTimes(4);
  for (const [request] of jest.mocked(client.readContract).mock.calls)
    expect(request.blockNumber).toBe(BigInt(123));
});

it("deduplicates identical pair feeds", async () => {
  const router = routerFor();
  jest
    .spyOn(client, "getBlock")
    .mockResolvedValue({ number: BigInt(123), timestamp } as Awaited<
      ReturnType<typeof client.getBlock>
    >);
  jest
    .spyOn(client, "readContract")
    .mockImplementation(async ({ functionName }) =>
      functionName === "decimals"
        ? 8
        : [BigInt(1), BigInt(100), BigInt(1), timestamp, BigInt(1)],
    );
  const oracle = getSupportedTokens(1).buyToken.oracles.USD as Address;
  await expect(
    router.calculatePrice({ tokenSellOracle: oracle, tokenBuyOracle: oracle }),
  ).resolves.toBe(1);
  expect(client.readContract).toHaveBeenCalledTimes(2);
});

it("retains round and freshness checks for pair prices", async () => {
  const router = routerFor();
  const route = await router.findRoute();
  jest
    .spyOn(client, "getBlock")
    .mockResolvedValue({ number: BigInt(123), timestamp } as Awaited<
      ReturnType<typeof client.getBlock>
    >);
  const read = jest
    .spyOn(client, "readContract")
    .mockResolvedValue([
      BigInt(1),
      BigInt(100),
      BigInt(1),
      timestamp - BigInt(3601),
      BigInt(1),
    ]);
  await expect(router.calculatePrice(route, 3600)).rejects.toThrow(
    "Oracle price data is stale",
  );
  read.mockResolvedValue([
    BigInt(2),
    BigInt(100),
    BigInt(1),
    timestamp,
    BigInt(1),
  ]);
  await expect(router.calculatePrice(route)).rejects.toThrow(
    "Required price feed is invalid",
  );
});
