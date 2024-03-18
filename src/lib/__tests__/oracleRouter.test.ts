import {
  CHAINS_ORACLE_ROUTER_FACTORY,
  GnosisRouter,
  WETH_GNOSIS_ADDRESS,
  WETH_MAINNET_ADDRESS,
} from "../oracleRouter";

describe("OracleRouter", () => {
  const BAL_MAINNET = {
    address: "0xba100000625a3754423978a60c9317c58a424e3D",
    symbol: "BAL",
    decimals: 18,
  } as const;

  const WETH_MAINNET = {
    address: WETH_MAINNET_ADDRESS,
    symbol: "WETH",
    decimals: 18,
  } as const;

  const LINK_MAINNET = {
    address: "0x514910771af9ca656af840dff83e8264ecf986ca",
    symbol: "LINK",
    decimals: 18,
  } as const;

  const BAL_GNOSIS = {
    address: "0x7eF541E2a22058048904fE5744f9c7E4C57AF717",
    symbol: "BAL",
    decimals: 18,
  } as const;

  const LINK_GNOSIS = {
    address: "0xE2e73A1c69ecF83F464EFCE6A5be353a37cA09b2",
    symbol: "LINK",
    decimals: 18,
  } as const;

  const WETH_GNOSIS = {
    address: WETH_GNOSIS_ADDRESS,
    symbol: "WETH",
    decimals: 18,
  } as const;

  describe("MainnetRouter", () => {
    const mainnetRouterFactory = CHAINS_ORACLE_ROUTER_FACTORY[1];
    it("should find BAL and LINK oracles", async () => {
      const mainnetRouter = new mainnetRouterFactory({
        chainId: 1,
        tokenSell: BAL_MAINNET,
        tokenBuy: LINK_MAINNET,
      });

      const oracles = await mainnetRouter.findRoute();

      expect(oracles.tokenSellOracle.toLowerCase()).toEqual(
        "0x2f2c0C1727Ce8C429A237DDFBBb87357893fBD5D".toLowerCase()
      );
      expect(oracles.tokenBuyOracle.toLowerCase()).toEqual(
        "0xbba12740DE905707251525477bAD74985DeC46D2".toLowerCase()
      );
    }, 15000);
    it("should raise error for gnosis tokens", async () => {
      const mainnetRouter = new mainnetRouterFactory({
        chainId: 1,
        tokenSell: BAL_GNOSIS,
        tokenBuy: LINK_GNOSIS,
      });

      await expect(mainnetRouter.findRoute()).rejects.toThrow(
        "No matching oracles found"
      );
    }, 15000);
    it("should find WETH USD oracle", async () => {
      const mainnetRouter = new mainnetRouterFactory({
        chainId: 1,
        tokenSell: WETH_MAINNET,
        tokenBuy: BAL_MAINNET,
      });

      const wethOracles = await mainnetRouter.findSellOracle();
      expect(typeof wethOracles.USD).toBe(`string`);
    }, 15000);
  });
  describe("GnosisRouter", () => {
    const gnosisRouterFactory = CHAINS_ORACLE_ROUTER_FACTORY[100];
    const gnosisRouter = new gnosisRouterFactory({
      chainId: 100,
      tokenSell: BAL_GNOSIS,
      tokenBuy: LINK_GNOSIS,
    }) as GnosisRouter;
    it("should fetch feeds from JSON", async () => {
      const feeds = await gnosisRouter.fetchPriceFeeds();
      expect(feeds.length).toBeGreaterThan(0);
    });
    it("should feeds be in the right format", async () => {
      const feeds = await gnosisRouter.fetchPriceFeeds();
      feeds.forEach((feed) => {
        expect(feed.pair).toEqual([expect.any(String), expect.any(String)]);
        expect(feed.contractAddress).toEqual(expect.any(String));
      });
    });
    it("should find BAL and LINK oracles on Gnosis", async () => {
      const gnosisRouter = new gnosisRouterFactory({
        chainId: 100,
        tokenSell: BAL_GNOSIS,
        tokenBuy: LINK_GNOSIS,
      });

      const oracles = await gnosisRouter.findRoute();

      expect(oracles.tokenSellOracle.toLowerCase()).toEqual(
        "0x3F2BA1E94112120d11F1a525913134fBE510bF37".toLowerCase()
      );
      expect(oracles.tokenBuyOracle.toLowerCase()).toEqual(
        "0x813a79EfDfd6a4352b7C583d8d38B2B5d1151d7E".toLowerCase()
      );
    });
    it("should find WETH USD oracle", async () => {
      const gnosisRouter = new gnosisRouterFactory({
        chainId: 1,
        tokenSell: WETH_GNOSIS,
        tokenBuy: BAL_GNOSIS,
      });

      const wethOracles = await gnosisRouter.findSellOracle();
      expect(typeof wethOracles.USD).toBe(`string`);
    });
  });

  describe("SepoliaRouter", () => {
    it("should find faucet oracle for Sepolia", async () => {
      const sepoliaRouterFactory = CHAINS_ORACLE_ROUTER_FACTORY[11155111];
      const sepoliaRouter = new sepoliaRouterFactory({
        chainId: 11155111,
        tokenSell: BAL_GNOSIS,
        tokenBuy: BAL_GNOSIS,
      });

      const oracles = await sepoliaRouter.findRoute();

      expect(oracles.tokenBuyOracle.toLowerCase()).toEqual(
        "0xEd2D417d759b1E77fe6A8920C79AE4CE6D6930F7".toLowerCase()
      );
      expect(oracles.tokenSellOracle.toLowerCase()).toEqual(
        "0x57Cb700070Cb1b0475E2D668FA8E89cF0Dda9509".toLowerCase()
      );
    });
  });
});
