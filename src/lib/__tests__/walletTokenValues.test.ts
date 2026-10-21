import { supportedChainIds } from "#/lib/publicClients";
import { getSupportedTokens } from "#/lib/supportedTokens";
import { fetchWalletTokenValues } from "#/lib/walletTokenValues";
import {
  TOKEN_BLOCK_TIME,
  TOKEN_WALLET,
  walletTokenRpc,
} from "#/test/walletTokenRpc";

it("loads exact token balances and USD values in one pinned multicall", async () => {
  const rpc = walletTokenRpc();
  const { sellTokens } = getSupportedTokens(1);
  const weth = sellTokens.find(({ token }) => token.symbol === "WETH")!;
  const btc = sellTokens.find(({ token }) => token.symbol === "cbBTC")!;
  rpc.setBalance(weth.token.address, BigInt("2450000000000000001"));
  rpc.setBalance(btc.token.address, BigInt("3500000"));
  rpc.setFeed(weth.oracles.USD!, BigInt("268000000000"));
  rpc.setFeed(btc.oracles.USD!, BigInt("97240000000000000000000"), 18);

  const snapshot = await fetchWalletTokenValues({
    chainId: 1,
    account: TOKEN_WALLET,
    client: rpc.client,
  });

  expect(
    snapshot.tokens.find(({ token }) => token.symbol === "WETH"),
  ).toMatchObject({ balance: BigInt("2450000000000000001"), usdPrice: 2680 });
  expect(
    snapshot.tokens.find(({ token }) => token.symbol === "WETH")?.usdValue,
  ).toBeCloseTo(6566);
  expect(
    snapshot.tokens.find(({ token }) => token.symbol === "cbBTC"),
  ).toMatchObject({ balance: BigInt("3500000"), usdPrice: 97240 });
  expect(
    snapshot.tokens.find(({ token }) => token.symbol === "cbBTC")?.usdValue,
  ).toBeCloseTo(3403.4);
  expect(rpc.calls.map(({ method }) => method)).toEqual([
    "eth_getBlockByNumber",
    "eth_call",
  ]);
  expect(rpc.calls[1].params[1]).toBe("0x1312d00");
});

it.each(supportedChainIds)(
  "batches the chain %s catalog without repeated contract reads",
  async (chainId) => {
    const rpc = walletTokenRpc();
    const { sellTokens, buyToken } = getSupportedTokens(chainId);
    for (const { token, oracles } of [...sellTokens, buyToken]) {
      rpc.setBalance(token.address, BigInt(0));
      if (oracles.USD) rpc.setFeed(oracles.USD, BigInt(100000000));
    }
    const snapshot = await fetchWalletTokenValues({
      chainId,
      account: TOKEN_WALLET,
      client: rpc.client,
    });
    expect(snapshot.tokens).toHaveLength(sellTokens.length + 1);
    expect(snapshot.tokens.every(({ balance }) => balance === BigInt(0))).toBe(
      true,
    );
    const reads = rpc.contractCalls.map(
      ({ address, functionName }) => `${address.toLowerCase()}:${functionName}`,
    );
    expect(new Set(reads).size).toBe(reads.length);
    expect(rpc.calls.map(({ method }) => method)).toEqual([
      "eth_getBlockByNumber",
      "eth_call",
    ]);
  },
);

it("keeps zero, missing balances, and missing prices distinct", async () => {
  const rpc = walletTokenRpc();
  const { sellTokens } = getSupportedTokens(1);
  const weth = sellTokens.find(({ token }) => token.symbol === "WETH")!;
  const link = sellTokens.find(({ token }) => token.symbol === "LINK")!;
  const btc = sellTokens.find(({ token }) => token.symbol === "cbBTC")!;
  rpc.setBalance(weth.token.address, BigInt(0));
  rpc.setFeed(weth.oracles.USD!, BigInt("268000000000"));
  rpc.setFeed(link.oracles.USD!, BigInt("1420000000"));
  rpc.setBalance(btc.token.address, BigInt("3500000"));
  const snapshot = await fetchWalletTokenValues({
    chainId: 1,
    account: TOKEN_WALLET,
    client: rpc.client,
  });
  expect(
    snapshot.tokens.find(({ token }) => token.symbol === "WETH"),
  ).toMatchObject({ balance: BigInt(0), usdValue: 0 });
  expect(
    snapshot.tokens.find(({ token }) => token.symbol === "LINK"),
  ).toMatchObject({ balance: undefined, usdPrice: 14.2, usdValue: undefined });
  expect(
    snapshot.tokens.find(({ token }) => token.symbol === "cbBTC"),
  ).toMatchObject({
    balance: BigInt("3500000"),
    usdPrice: undefined,
    usdValue: undefined,
  });
});

it("omits balance calls without a wallet and still reads approved USD prices", async () => {
  const rpc = walletTokenRpc();
  const weth = getSupportedTokens(1).sellTokens.find(
    ({ token }) => token.symbol === "WETH",
  )!;
  rpc.setFeed(weth.oracles.USD!, BigInt("268000000000"));
  const snapshot = await fetchWalletTokenValues({
    chainId: 1,
    client: rpc.client,
  });
  expect(
    snapshot.tokens.find(({ token }) => token.symbol === "WETH"),
  ).toMatchObject({ balance: undefined, usdPrice: 2680, usdValue: undefined });
  expect(
    rpc.contractCalls.some(({ functionName }) => functionName === "balanceOf"),
  ).toBe(false);
});

it.each([
  ["stale", BigInt(100), TOKEN_BLOCK_TIME - BigInt(5461), BigInt(1), BigInt(1)],
  ["future", BigInt(100), TOKEN_BLOCK_TIME + BigInt(1), BigInt(1), BigInt(1)],
  ["missing timestamp", BigInt(100), BigInt(0), BigInt(1), BigInt(1)],
  ["zero answer", BigInt(0), TOKEN_BLOCK_TIME, BigInt(1), BigInt(1)],
  ["negative answer", BigInt(-1), TOKEN_BLOCK_TIME, BigInt(1), BigInt(1)],
  ["missing round", BigInt(100), TOKEN_BLOCK_TIME, BigInt(0), BigInt(1)],
  ["incomplete round", BigInt(100), TOKEN_BLOCK_TIME, BigInt(2), BigInt(1)],
] as const)(
  "keeps the balance but omits a %s USD estimate",
  async (_label, answer, updatedAt, roundId, answeredInRound) => {
    const rpc = walletTokenRpc();
    const weth = getSupportedTokens(1).sellTokens.find(
      ({ token }) => token.symbol === "WETH",
    )!;
    rpc.setBalance(weth.token.address, BigInt("1000000000000000000"));
    rpc.setFeed(
      weth.oracles.USD!,
      answer,
      8,
      updatedAt,
      roundId,
      answeredInRound,
    );
    const snapshot = await fetchWalletTokenValues({
      chainId: 1,
      account: TOKEN_WALLET,
      client: rpc.client,
    });
    expect(
      snapshot.tokens.find(({ token }) => token.symbol === "WETH"),
    ).toMatchObject({
      balance: BigInt("1000000000000000000"),
      usdPrice: undefined,
      usdValue: undefined,
    });
  },
);
