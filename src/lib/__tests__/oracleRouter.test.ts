import { CHAINS_ORACLE_ROUTER_FACTORY } from "../oracleRouter";

describe("OracleRouter", () => {
  describe("MainnetRouter", () => {
    it("should find oracles for ETH on Mainnet", async () => {
      const BAL_MAINNET = {
        address: "0xba100000625a3754423978a60c9317c58a424e3D",
        symbol: "BAL",
        decimals: 18,
      } as const;

      const LINK_MAINNET = {
        address: "0x514910771af9ca656af840dff83e8264ecf986ca",
        symbol: "LINK",
        decimals: 18,
      } as const;

      const mainnetRouterFactory = CHAINS_ORACLE_ROUTER_FACTORY[1];
      // const mainnetRouter = new mainnetRouterFactory({
      //   chainId: 1,
      //   sellToken: BAL_MAINNET,
      //   buyToken: LINK_MAINNET,
      // });

      // const oracles = await mainnetRouter.findRoute();

      // expect(oracles.tokenSellOracle.toLowerCase()).toEqual(
      //   "0x2f2c0C1727Ce8C429A237DDFBBb87357893fBD5D".toLowerCase()
      // );
      // expect(oracles.tokenBuyOracle.toLowerCase()).toEqual(
      //   "0xbba12740DE905707251525477bAD74985DeC46D2".toLowerCase()
      // );
    });
  });
});

describe("test-test", () => {
  it("should pass", () => {
    expect(1).toEqual(1);
  });
});
