import { CHAINS_ORACLE_ROUTER_FACTORY } from "../oracleRouter";
import { getSupportedTokens } from "../supportedTokens";

describe("Supported stop loss pairs", () => {
  afterEach(() => jest.restoreAllMocks());

  it("routes Ethereum WETH into USDC without oracle discovery", async () => {
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[1];
    const router = new Router({
      chainId: 1,
      tokenSell: {
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        symbol: "WETH",
        decimals: 18,
      },
      tokenBuy: {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
      },
    });
    jest
      .spyOn(router.publicClient, "readContract")
      .mockRejectedValue(new Error("RPC unavailable"));
    jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("HTTP unavailable"));

    await expect(router.findRoute()).resolves.toEqual({
      tokenSellOracle: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      tokenBuyOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    });
  });

  it("uses BTC/USD for Ethereum WBTC into USDC", async () => {
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[1];
    const router = new Router({
      chainId: 1,
      tokenSell: {
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        symbol: "WBTC",
        decimals: 8,
      },
      tokenBuy: {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
      },
    });

    await expect(router.findRoute()).resolves.toEqual({
      tokenSellOracle: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      tokenBuyOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    });
  });

  it("routes Gnosis WETH into USDC.e without oracle discovery", async () => {
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[100];
    const router = new Router({
      chainId: 100,
      tokenSell: {
        address: "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
        symbol: "WETH",
        decimals: 18,
      },
      tokenBuy: {
        address: "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0",
        symbol: "USDC.e",
        decimals: 6,
      },
    });
    jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("HTTP unavailable"));

    await expect(router.findRoute()).resolves.toEqual({
      tokenSellOracle: "0xa767f745331D267c7751297D982b050c93985627",
      tokenBuyOracle: "0x26C31ac71010aF62E6B486D1132E266D6298857D",
    });
  });

  it("routes Gnosis WBTC into USDC.e", async () => {
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[100];
    const router = new Router({
      chainId: 100,
      tokenSell: {
        address: "0x8e5bbbb09ed1ebde8674cda39a0c169401db4252",
        symbol: "WBTC",
        decimals: 8,
      },
      tokenBuy: {
        address: "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0",
        symbol: "USDC.e",
        decimals: 6,
      },
    });

    await expect(router.findRoute()).resolves.toEqual({
      tokenSellOracle: "0x00288135bE38B83249F380e9b6b9a04c90EC39eE",
      tokenBuyOracle: "0x26C31ac71010aF62E6B486D1132E266D6298857D",
    });
  });

  it("routes Arbitrum WETH into native USDC without oracle discovery", async () => {
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[42161];
    const router = new Router({
      chainId: 42161,
      tokenSell: {
        address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
        symbol: "WETH",
        decimals: 18,
      },
      tokenBuy: {
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        symbol: "USDC",
        decimals: 6,
      },
    });
    jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("HTTP unavailable"));

    await expect(router.findRoute()).resolves.toEqual({
      tokenSellOracle: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
      tokenBuyOracle: "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3",
    });
  });

  it("routes Arbitrum WBTC into native USDC", async () => {
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[42161];
    const router = new Router({
      chainId: 42161,
      tokenSell: {
        address: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
        symbol: "WBTC",
        decimals: 8,
      },
      tokenBuy: {
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        symbol: "USDC",
        decimals: 6,
      },
    });

    await expect(router.findRoute()).resolves.toEqual({
      tokenSellOracle: "0xd0C7101eACbB49F3deCcCc166d238410D6D46d57",
      tokenBuyOracle: "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3",
    });
  });

  it("offers only WETH into USDC(test) on Sepolia with the existing test feeds", () => {
    expect(getSupportedTokens(11155111)).toEqual({
      sellTokens: [
        {
          token: {
            address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
            symbol: "WETH",
            decimals: 18,
          },
          priceFeed: "0x57Cb700070Cb1b0475E2D668FA8E89cF0Dda9509",
        },
      ],
      buyToken: {
        token: {
          address: "0xbe72E441BF55620febc26715db68d3494213D8Cb",
          symbol: "USDC (test)",
          decimals: 18,
        },
        priceFeed: "0xEd2D417d759b1E77fe6A8920C79AE4CE6D6930F7",
      },
    });
  });

  it("normalizes each feed's decimals before calculating the price ratio", async () => {
    const { sellTokens, buyToken } = getSupportedTokens(1);
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[1];
    const router = new Router({
      chainId: 1,
      tokenSell: sellTokens[0].token,
      tokenBuy: buyToken.token,
    });
    jest
      .spyOn(router.publicClient, "readContract")
      .mockImplementation(async ({ address, functionName }) => {
        const isSellFeed =
          address?.toLowerCase() ===
          "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419";
        if (functionName === "decimals") return isSellFeed ? 8 : 18;
        const answer = isSellFeed
          ? BigInt("250050000000")
          : BigInt("2000000000000000000");
        return [BigInt(1), answer, BigInt(0), BigInt(0), BigInt(1)];
      });

    await expect(router.calculatePrice(await router.findRoute())).resolves.toBe(
      1250.25,
    );
  });

  it("reports a clear error when a configured feed cannot be read", async () => {
    const { sellTokens, buyToken } = getSupportedTokens(1);
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[1];
    const router = new Router({
      chainId: 1,
      tokenSell: sellTokens[0].token,
      tokenBuy: buyToken.token,
    });
    jest
      .spyOn(router.publicClient, "readContract")
      .mockRejectedValue(new Error("RPC unavailable"));

    await expect(
      router.calculatePrice(await router.findRoute()),
    ).rejects.toThrow(
      "Unable to read configured price feeds. Please try again.",
    );
  });
});

describe("SepoliaRouter", () => {
  it("keeps the existing fixed test feeds", async () => {
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[11155111];
    const router = new Router({
      chainId: 11155111,
      tokenSell: {
        address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
        symbol: "WETH",
        decimals: 18,
      },
      tokenBuy: {
        address: "0xbe72E441BF55620febc26715db68d3494213D8Cb",
        symbol: "USDC (test)",
        decimals: 18,
      },
    });

    await expect(router.findRoute()).resolves.toEqual({
      tokenSellOracle: "0x57Cb700070Cb1b0475E2D668FA8E89cF0Dda9509",
      tokenBuyOracle: "0xEd2D417d759b1E77fe6A8920C79AE4CE6D6930F7",
    });
  });

  it("rejects unsupported Sepolia tokens despite the fixed test feeds", async () => {
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[11155111];
    const router = new Router({
      chainId: 11155111,
      tokenSell: {
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        symbol: "UNI",
        decimals: 18,
      },
      tokenBuy: {
        address: "0xbe72E441BF55620febc26715db68d3494213D8Cb",
        symbol: "USDC (test)",
        decimals: 18,
      },
    });

    await expect(router.findRoute()).rejects.toThrow("Unsupported sell token");
  });
});
