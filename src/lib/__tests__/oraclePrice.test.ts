// Opt in to simulated TEST approvals; production policy remains unchanged.
jest.mock("#/lib/supportedTokens", () => {
  const actual = jest.requireActual("#/lib/supportedTokens");
  const { TEST_SUPPORTED_TOKENS } = jest.requireActual("#/test/approvedRoutes");
  return {
    ...actual,
    getSupportedTokens: (chainId: import("#/lib/publicClients").ChainId) =>
      TEST_SUPPORTED_TOKENS[chainId] ?? actual.getSupportedTokens(chainId),
  };
});

import { configuredTokenOracle, fetchOracleUsdPrice } from "../oraclePrice";
import { type ChainId, publicClientsFromIds } from "../publicClients";
import { getSupportedTokens } from "../supportedTokens";

const client = publicClientsFromIds[1];
const { sellTokens } = getSupportedTokens(1);
const oracle = sellTokens[0].oracles.USD!;
const timestamp = BigInt(100_000);

beforeEach(() => {
  jest.spyOn(client, "getBlock").mockResolvedValue({
    number: BigInt(123),
    timestamp,
  } as Awaited<ReturnType<typeof client.getBlock>>);
  jest
    .spyOn(client, "readContract")
    .mockImplementation(async ({ functionName }) =>
      functionName === "decimals"
        ? 8
        : [BigInt(1), BigInt("250050000000"), BigInt(1), timestamp, BigInt(1)],
    );
});

afterEach(() => jest.restoreAllMocks());

it("looks up supported token addresses without case sensitivity", () => {
  expect(
    configuredTokenOracle(
      sellTokens[0].token.address.toLowerCase() as `0x${string}`,
      1,
    ),
  ).toBe(oracle);
  expect(
    configuredTokenOracle("0x1111111111111111111111111111111111111111", 1),
  ).toBeUndefined();
});

it("normalizes decimals and pins both contract reads to the selected block", async () => {
  await expect(fetchOracleUsdPrice({ chainId: 1, oracle })).resolves.toBe(
    2500.5,
  );
  expect(client.readContract).toHaveBeenCalledTimes(2);
  for (const [request] of jest.mocked(client.readContract).mock.calls) {
    expect(request).toMatchObject({
      address: oracle,
      blockNumber: BigInt(123),
    });
  }
});

it.each([
  ["zero answer", BigInt(1), BigInt(0), timestamp, BigInt(1)],
  ["negative answer", BigInt(1), BigInt(-1), timestamp, BigInt(1)],
  ["zero round", BigInt(0), BigInt(1), timestamp, BigInt(1)],
  ["missing timestamp", BigInt(1), BigInt(1), BigInt(0), BigInt(1)],
  ["future timestamp", BigInt(1), BigInt(1), timestamp + BigInt(1), BigInt(1)],
  ["incomplete round", BigInt(2), BigInt(1), timestamp, BigInt(1)],
])("rejects a %s", async (_, roundId, answer, updatedAt, answeredInRound) => {
  jest
    .mocked(client.readContract)
    .mockResolvedValueOnce([
      roundId,
      answer,
      BigInt(1),
      updatedAt,
      answeredInRound,
    ]);
  await expect(fetchOracleUsdPrice({ chainId: 1, oracle })).rejects.toThrow(
    "Required price feed is invalid",
  );
});

it("uses the configured maximum age against the selected block timestamp", async () => {
  jest
    .mocked(client.readContract)
    .mockResolvedValueOnce([
      BigInt(1),
      BigInt(1),
      BigInt(1),
      timestamp - BigInt(3601),
      BigInt(1),
    ]);
  await expect(
    fetchOracleUsdPrice({ chainId: 1, oracle, maxAge: 3600 }),
  ).rejects.toThrow("Oracle price data is stale");
});

it("does not return a price when the RPC fails", async () => {
  jest
    .mocked(client.getBlock)
    .mockRejectedValueOnce(new Error("RPC unavailable"));
  await expect(fetchOracleUsdPrice({ chainId: 1, oracle })).rejects.toThrow(
    "RPC unavailable",
  );
  expect(client.readContract).not.toHaveBeenCalled();
});

it("does not select a feed on an unsupported wallet chain", () => {
  expect(
    configuredTokenOracle(sellTokens[0].token.address, 999 as ChainId),
  ).toBeUndefined();
});

it("does not treat an ETH-only feed as a USD estimate", () => {
  const ethOnly = sellTokens.find(
    ({ oracles }) => oracles.ETH && !oracles.USD,
  )!;
  expect(ethOnly).toBeDefined();
  expect(ethOnly.priceFeed).toBeUndefined();
  expect(configuredTokenOracle(ethOnly.token.address, 1)).toBeUndefined();
});

it("selects the direct USD feed even when the pair route prefers ETH", () => {
  const dual = sellTokens.find(({ oracles }) => oracles.ETH && oracles.USD)!;
  expect(configuredTokenOracle(dual.token.address, 1)).toBe(dual.oracles.USD);
  expect(configuredTokenOracle(dual.token.address, 1)).not.toBe(
    dual.oracles.ETH,
  );
});

it("does not assign creation USD feeds to historical token metadata", () => {
  expect(
    configuredTokenOracle("0x2a22f9c3b484c3629090feed35f17ff8f88f76f0", 100),
  ).toBeUndefined();
});

it("rejects ETH-quoted feeds passed to the USD price reader", async () => {
  const ethOnly = sellTokens.find(
    ({ oracles }) => oracles.ETH && !oracles.USD,
  )!;
  await expect(
    fetchOracleUsdPrice({ chainId: 1, oracle: ethOnly.oracles.ETH! }),
  ).rejects.toThrow("No configured USD price feed");
  expect(client.getBlock).not.toHaveBeenCalled();
  expect(client.readContract).not.toHaveBeenCalled();
});
