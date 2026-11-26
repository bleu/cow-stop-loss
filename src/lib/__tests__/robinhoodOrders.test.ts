import { configuredTokenRoute } from "../oracleRouter";
import { getSupportedTokens } from "../supportedTokens";

const weth = {
  address: "0x0bd7d308f8e1639fab988df18a8011f41eacad73",
  symbol: "WETH",
  decimals: 18,
} as const;
const usdg = {
  address: "0x5fc5360d0400a0fd4f2af552add042d716f1d168",
  symbol: "USDG",
  decimals: 6,
} as const;

it("offers the reviewed Robinhood sell set in a normal build", () => {
  const { sellTokens, buyToken, unavailableReason } = getSupportedTokens(4663);
  expect(unavailableReason).toBeUndefined();
  expect(buyToken.token).toMatchObject(usdg);
  expect(sellTokens.map(({ token }) => token.symbol).sort()).toEqual([
    "AAPL",
    "AMD",
    "AMZN",
    "ASML",
    "BABA",
    "CLSK",
    "COIN",
    "CRCL",
    "CRWV",
    "DELL",
    "ENA",
    "EWY",
    "GME",
    "GOOGL",
    "INTC",
    "IONQ",
    "LINK",
    "META",
    "MSFT",
    "MSTR",
    "MU",
    "NBIS",
    "NVDA",
    "ORCL",
    "PLTR",
    "QQQ",
    "RGTI",
    "RKLB",
    "SLV",
    "SNDK",
    "SPCX",
    "SPY",
    "TSLA",
    "TSM",
    "USO",
    "WBTC",
    "WETH",
  ]);
  expect(
    configuredTokenRoute({
      chainId: 4663,
      tokenSell: weth,
      tokenBuy: usdg,
    }),
  ).toMatchObject({
    tokenSellOracle: "0x78f3556b67e17df817d51ef5a990cdaf09e8d3a9",
    tokenBuyOracle: "0x61b7e5650328764b076a108eff5fa7282a1b9ad2",
  });
});
