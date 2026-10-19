import {
  Address,
  decodeFunctionData,
  erc20Abi,
  parseAbi,
  PublicClient,
  zeroAddress,
} from "viem";

import { composableCowAbi } from "#/lib/abis/composableCow";
import {
  COMPOSABLE_COW_ADDRESS,
  EXTENSIBLE_FALLBACK_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
  SETTLEMENT_CONTRACT_ADDRESS,
  STOP_LOSS_ADDRESS,
} from "#/lib/contracts";
import {
  buildSafePlacementPlan,
  prepareSafePlacement,
  readSafePlacementChecks,
} from "#/lib/safeStopLoss";
import { decodeStopLossStaticInput } from "#/lib/staticInputDecoder";
import { encodeStopLossStaticInput } from "#/lib/staticInputEncoder";
import type { StopLossOrder } from "#/lib/stopLossOrders";
import { DraftOrder, OrderStatus } from "#/lib/types";

const account = "0x1111111111111111111111111111111111111111";
const domainSeparator =
  "0xdaee378bd0eb30ddf479272accf91761e697bc00e067a268f95f1d2732ed230b" as const;
const draft: DraftOrder = {
  id: "safe-order",
  tokenSell: {
    address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    decimals: 18,
    symbol: "WETH",
  },
  tokenBuy: {
    address: "0xbe72E441BF55620febc26715db68d3494213D8Cb",
    decimals: 18,
    symbol: "USDC (test)",
  },
  amountSell: "1",
  amountBuy: "1980",
  strikePrice: "2000",
  limitPrice: "1980",
  slippagePercent: "1",
  isSellOrder: true,
  receiver: account,
  partiallyFillable: true,
  maxHoursSinceOracleUpdates: 1,
  validTo: 1800003600,
  salt: `0x${"ab".repeat(32)}`,
  tokenSellOracle: "0x57Cb700070Cb1b0475E2D668FA8E89cF0Dda9509",
  tokenBuyOracle: "0xEd2D417d759b1E77fe6A8920C79AE4CE6D6930F7",
  oraclePrice: 2000,
  status: OrderStatus.DRAFT,
};

async function checksFixture() {
  jest.spyOn(global, "fetch").mockImplementation(async (url, init) => {
    if (String(url).includes("app_data"))
      return new Response(JSON.stringify(String(url).split("/").pop()));
    const field = JSON.parse(String(init?.body)).query.includes("CowShedOwners")
      ? "ownerMappings"
      : "conditionalOrderGenerators";
    return new Response(
      JSON.stringify({
        data: { [field]: { items: [], pageInfo: { hasNextPage: false } } },
      }),
    );
  });
  const rpc = {
    getBlockNumber: jest.fn(async () => BigInt(100)),
    getBlock: jest.fn(async () => ({ timestamp: BigInt(1800000000) })),
    getStorageAt: jest.fn(async () => `0x${"00".repeat(32)}`),
    getBytecode: jest.fn(
      async (_request: { address: Address; blockNumber?: bigint }) => "0x6000",
    ),
    readContract: jest.fn(
      async ({
        functionName,
      }: {
        address: Address;
        functionName: string;
        args?: readonly unknown[];
        blockNumber?: bigint;
      }): Promise<unknown> => {
        if (functionName === "domainSeparator") return domainSeparator;
        if (functionName === "vaultRelayer") return GPV2_VAULT_RELAYER_ADDRESS;
        if (functionName === "singleOrders") return false;
        if (functionName === "latestRoundData")
          return [
            BigInt(1),
            BigInt(200000000000),
            BigInt(1799999999),
            BigInt(1799999999),
            BigInt(1),
          ];
        if (functionName === "decimals") return 8;
        if (functionName === "balanceOf") return BigInt("3000000000000000000");
        if (functionName === "allowance") return BigInt(0);
        throw new Error(`Unexpected read: ${functionName}`);
      },
    ),
  };
  const client = rpc as unknown as PublicClient;
  return {
    rpc,
    client,
    prepared: await prepareSafePlacement({
      draft,
      account,
      chainId: 11155111,
      client,
    }),
  };
}

test("rechecks executed prerequisites at a fresh block before continuing", async () => {
  const { rpc, client, prepared } = await checksFixture();
  let executed = false;
  const freshClient = {
    ...client,
    getBlockNumber: async (options?: { cacheTime?: number }) =>
      BigInt(executed && options?.cacheTime === 0 ? 101 : 100),
    getStorageAt: async ({ blockNumber }: { blockNumber?: bigint }) =>
      blockNumber === BigInt(101)
        ? `0x${"00".repeat(12)}${EXTENSIBLE_FALLBACK_ADDRESS.slice(2)}`
        : `0x${"00".repeat(32)}`,
  } as unknown as PublicClient;
  const read = rpc.readContract.getMockImplementation()!;
  rpc.readContract.mockImplementation(async (request) => {
    if (request.blockNumber === BigInt(101)) {
      if (request.functionName === "domainVerifiers")
        return COMPOSABLE_COW_ADDRESS;
      if (request.functionName === "allowance")
        return BigInt("1000000000000000000");
    }
    return read(request);
  });
  const before = await readSafePlacementChecks(prepared, {
    client: freshClient,
    indexedOrders: [],
  });
  expect(
    buildSafePlacementPlan(prepared, before).calls.map((call) => call.stage),
  ).toEqual(["fallback", "verifier", "approval", "create"]);
  executed = true;
  const after = await readSafePlacementChecks(prepared, {
    client: freshClient,
    indexedOrders: [],
  });
  expect(
    buildSafePlacementPlan(prepared, after).calls.map((call) => call.stage),
  ).toEqual(["create"]);
});

test.each([
  COMPOSABLE_COW_ADDRESS,
  STOP_LOSS_ADDRESS,
  EXTENSIBLE_FALLBACK_ADDRESS,
  SETTLEMENT_CONTRACT_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
  draft.tokenSell.address,
  account,
])(
  "blocks signing when a required contract is missing: %s",
  async (missing) => {
    const { rpc, client, prepared } = await checksFixture();
    rpc.getBytecode.mockImplementation(async ({ address, blockNumber }) => {
      expect(blockNumber).toBe(BigInt(100));
      return address === missing ? "0x" : "0x6000";
    });
    await expect(readSafePlacementChecks(prepared, { client })).rejects.toThrow(
      /not deployed/,
    );
  },
);

test.each(["settlement", "composable", "reviewed", "both"])(
  "blocks signing with an inconsistent settlement domain: %s",
  async (mismatch) => {
    const { rpc, client, prepared } = await checksFixture();
    const wrong = `0x${"ef".repeat(32)}` as const;
    const read = rpc.readContract.getMockImplementation()!;
    rpc.readContract.mockImplementation(async (request) => {
      if (
        request.functionName === "domainSeparator" &&
        (mismatch === "both" ||
          (mismatch === "settlement" &&
            request.address === SETTLEMENT_CONTRACT_ADDRESS) ||
          (mismatch === "composable" &&
            request.address === COMPOSABLE_COW_ADDRESS))
      )
        return wrong;
      return read(request);
    });
    if (mismatch === "reviewed" || mismatch === "both")
      prepared.domainSeparator = wrong;
    await expect(readSafePlacementChecks(prepared, { client })).rejects.toThrow(
      /domain.*match/i,
    );
  },
);

test("blocks signing when settlement uses a different vault relayer", async () => {
  const { rpc, client, prepared } = await checksFixture();
  const read = rpc.readContract.getMockImplementation()!;
  rpc.readContract.mockImplementation(async (request) =>
    request.functionName === "vaultRelayer" ? account : read(request),
  );
  await expect(readSafePlacementChecks(prepared, { client })).rejects.toThrow(
    /relayer.*match/i,
  );
});

function indexedOrder(overrides: Partial<StopLossOrder> = {}): StopLossOrder {
  return {
    id: "indexed",
    parentId: "parent",
    chainId: 11155111,
    owner: account,
    hash: `0x${"cd".repeat(32)}`,
    status: OrderStatus.OPEN,
    receiver: account,
    sellToken: draft.tokenSell,
    buyToken: draft.tokenBuy,
    sellAmount: BigInt("2000000000000000000"),
    buyAmount: BigInt("3960000000000000000000"),
    validTo: draft.validTo,
    strike: BigInt("2000000000000000000000"),
    partiallyFillable: true,
    isSellOrder: true,
    sellTokenPriceOracle: draft.tokenSellOracle,
    buyTokenPriceOracle: draft.tokenBuyOracle,
    maxTimeSinceLastOracleUpdate: 3600,
    executedSellAmount: null,
    executedBuyAmount: null,
    executedFee: null,
    ...overrides,
  };
}

test("reserves the full sell amount of an outstanding direct Safe order", async () => {
  const { client, prepared } = await checksFixture();
  const checks = await readSafePlacementChecks(prepared, {
    client,
    indexedOrders: [
      indexedOrder({
        status: OrderStatus.PARTIALLY_FILLED,
        executedSellAmount: BigInt("1000000000000000000"),
      }),
    ],
  });
  expect(checks.requiredAllowance).toBe(BigInt("3000000000000000000"));
  const plan = buildSafePlacementPlan(prepared, checks);
  const approval = plan.calls.find((call) => call.stage === "approval")!;
  expect(
    decodeFunctionData({ abi: erc20Abi, data: approval.data }).args,
  ).toEqual([GPV2_VAULT_RELAYER_ADDRESS, BigInt("3000000000000000000")]);
});

test.each<Partial<StopLossOrder>>([
  { owner: "0x2222222222222222222222222222222222222222" },
  { chainId: 100 },
  { sellToken: draft.tokenBuy },
  { validTo: 1800000000 },
  { status: OrderStatus.FULFILLED },
  { status: OrderStatus.CANCELLED },
  { status: OrderStatus.PARTIALLY_FILLED_AND_CANCELLED },
  { status: OrderStatus.EXPIRED },
  { status: OrderStatus.PARTIALLY_FILLED_AND_EXPIRED },
])(
  "excludes commitments outside this Safe's outstanding token funding: %#",
  async (excluded) => {
    const { client, prepared } = await checksFixture();
    const checks = await readSafePlacementChecks(prepared, {
      client,
      indexedOrders: [indexedOrder(excluded)],
    });
    expect(checks.requiredAllowance).toBe(BigInt("1000000000000000000"));
  },
);

test.each(["unavailable", "incomplete"])(
  "blocks signing when indexed funding data is %s",
  async (failure) => {
    const { client, prepared } = await checksFixture();
    jest
      .mocked(global.fetch)
      .mockImplementation(async () =>
        failure === "unavailable"
          ? new Response("Unavailable", { status: 503 })
          : new Response(JSON.stringify({ data: {} })),
      );
    await expect(readSafePlacementChecks(prepared, { client })).rejects.toThrow(
      /Order API|funding data/i,
    );
  },
);

test("reserves saved accepted Safe placements before indexing", async () => {
  const { client, prepared } = await checksFixture();
  const accepted = await prepareSafePlacement({
    draft: {
      ...draft,
      salt: `0x${"cd".repeat(32)}`,
      amountSell: "2",
      amountBuy: "3960",
    },
    account,
    chainId: 11155111,
    client,
  });
  const checks = await readSafePlacementChecks(prepared, {
    client,
    indexedOrders: [],
    localOrders: [accepted],
  });
  expect(checks.requiredAllowance).toBe(BigInt("3000000000000000000"));
});

test("counts one commitment when accepted Safe orders also appear in the index", async () => {
  const { client, prepared } = await checksFixture();
  const accepted = await prepareSafePlacement({
    draft: {
      ...draft,
      salt: `0x${"cd".repeat(32)}`,
      amountSell: "2",
      amountBuy: "3960",
    },
    account,
    chainId: 11155111,
    client,
  });
  const indexed = indexedOrder({ hash: accepted.paramsHash });
  const checks = await readSafePlacementChecks(prepared, {
    client,
    indexedOrders: [
      indexed,
      {
        ...indexed,
        id: "duplicate",
        hash: `0x${indexed.hash.slice(2).toUpperCase()}`,
      },
    ],
    localOrders: [accepted, accepted],
  });
  expect(checks.requiredAllowance).toBe(BigInt("3000000000000000000"));
});

test("blocks a new Safe order when combined commitments exceed its balance", async () => {
  const { client, prepared } = await checksFixture();
  const checks = await readSafePlacementChecks(prepared, {
    client,
    indexedOrders: [
      indexedOrder({ sellAmount: BigInt("3000000000000000000") }),
    ],
  });
  expect(() => buildSafePlacementPlan(prepared, checks)).toThrow(
    /balance.*commitments|commitments.*balance/i,
  );
});

test.each<Partial<StopLossOrder>>([
  { sellAmount: BigInt(-1) },
  { sellAmount: BigInt(0) },
  { hash: "" },
  { validTo: Number.NaN },
])(
  "blocks signing with incomplete indexed commitments: %#",
  async (invalid) => {
    const { client, prepared } = await checksFixture();
    await expect(
      readSafePlacementChecks(prepared, {
        client,
        indexedOrders: [indexedOrder(invalid)],
      }),
    ).rejects.toThrow(/incomplete.*funding|inconsistent.*funding/i);
  },
);

afterEach(() => jest.restoreAllMocks());

test.each<DraftOrder>([
  { ...draft, receiver: "0x0000000000000000000000000000000000000000" },
  { ...draft, tokenSellOracle: account },
])(
  "rejects unsupported Safe order terms before uploading app data: %#",
  async (invalid) => {
    const fetch = jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("Unexpected upload"));
    await expect(
      prepareSafePlacement({ draft: invalid, account, chainId: 11155111 }),
    ).rejects.toThrow(/exact-sell|Receiver|Unsupported/);
    expect(fetch).not.toHaveBeenCalled();
  },
);

test("keeps unapproved production oracle routes blocked for Safe orders", async () => {
  const fetch = jest
    .spyOn(global, "fetch")
    .mockRejectedValue(new Error("Unexpected upload"));
  await expect(
    prepareSafePlacement({
      draft: {
        ...draft,
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
        tokenSellOracle: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
        tokenBuyOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      },
      account,
      chainId: 1,
    }),
  ).rejects.toThrow(/New orders are unavailable/);
  expect(fetch).not.toHaveBeenCalled();
});

test("rejects Safe preparation on a chain without a supported status service", async () => {
  const fetch = jest
    .spyOn(global, "fetch")
    .mockRejectedValue(new Error("Unexpected upload"));
  await expect(
    prepareSafePlacement({ draft, account, chainId: 8453 }),
  ).rejects.toThrow(/Safe.*not supported/);
  expect(fetch).not.toHaveBeenCalled();
});

test("rejects a Safe oracle time limit above the approved route limit before upload", async () => {
  const fetch = jest
    .spyOn(global, "fetch")
    .mockImplementation(
      async (url) => new Response(JSON.stringify(String(url).split("/").pop())),
    );
  const client = {
    readContract: async () => domainSeparator,
  } as unknown as PublicClient;
  await expect(
    prepareSafePlacement({
      draft: {
        ...draft,
        maxHoursSinceOracleUpdates: 25,
      },
      account,
      chainId: 11155111,
      client,
    }),
  ).rejects.toThrow(/Oracle time limit/);
  expect(fetch).not.toHaveBeenCalled();
});

test("blocks saved Safe terms whose encoded oracle age exceeds the current approval", async () => {
  const { client, prepared } = await checksFixture();
  prepared.staticInput = encodeStopLossStaticInput(
    { ...prepared.draft, maxHoursSinceOracleUpdates: 25 },
    prepared.appDataHash,
  );
  await expect(
    readSafePlacementChecks(prepared, { client, indexedOrders: [] }),
  ).rejects.toThrow(/Oracle time limit/);
});

test("does not plan a saved Safe order outside the current oracle approval", async () => {
  const { client, prepared } = await checksFixture();
  const checks = await readSafePlacementChecks(prepared, {
    client,
    indexedOrders: [],
  });
  prepared.draft.maxHoursSinceOracleUpdates = 25;
  prepared.staticInput = encodeStopLossStaticInput(
    prepared.draft,
    prepared.appDataHash,
  );
  expect(() => buildSafePlacementPlan(prepared, checks)).toThrow(
    /Oracle time limit/,
  );
});

test("prepares a Safe-owned order without a poller funding hook", async () => {
  jest
    .spyOn(global, "fetch")
    .mockImplementation(
      async (url) => new Response(JSON.stringify(String(url).split("/").pop())),
    );
  const client = {
    readContract: async ({ functionName }: { functionName: string }) => {
      if (functionName === "domainSeparator") return domainSeparator;
      throw new Error(`Unexpected contract read: ${functionName}`);
    },
  } as unknown as PublicClient;

  const prepared = await prepareSafePlacement({
    draft,
    account,
    chainId: 11155111,
    client,
  });

  expect({
    owner: prepared.owner,
    metadata: JSON.parse(prepared.fullAppData).metadata,
    terms: decodeStopLossStaticInput(prepared.staticInput),
  }).toMatchObject({
    owner: account,
    metadata: { widget: { appCode: "Stop Loss" } },
    terms: {
      sellAmount: BigInt("1000000000000000000"),
      buyAmount: BigInt("1980000000000000000000"),
      validTo: 1800003600,
    },
  });
  expect(JSON.parse(prepared.fullAppData).metadata.hooks).toBeUndefined();
});

test("uses the ComposableCoW conditional-order tuple hash", async () => {
  jest
    .spyOn(global, "fetch")
    .mockImplementation(
      async (url) => new Response(JSON.stringify(String(url).split("/").pop())),
    );
  const client = {
    readContract: async () => domainSeparator,
  } as unknown as PublicClient;
  const prepared = await prepareSafePlacement({
    draft,
    account,
    chainId: 11155111,
    client,
  });
  expect(prepared.paramsHash).toBe(
    "0xfd6866ffa549c014d3c2cffe714be616593d7bfe3bd814df65b88b08787d7869",
  );
});

test("batches Safe setup, relayer approval, and direct order creation in that order", async () => {
  jest
    .spyOn(global, "fetch")
    .mockImplementation(
      async (url) => new Response(JSON.stringify(String(url).split("/").pop())),
    );
  const client = {
    readContract: async () => domainSeparator,
  } as unknown as PublicClient;
  const prepared = await prepareSafePlacement({
    draft,
    account,
    chainId: 11155111,
    client,
  });
  const plan = buildSafePlacementPlan(prepared, {
    fallbackHandler: zeroAddress,
    domainVerifier: zeroAddress,
    allowance: BigInt(0),
    requiredAllowance: BigInt("1000000000000000000"),
    balance: BigInt("2000000000000000000"),
    created: false,
  });
  const safeAbi = parseAbi([
    "function setFallbackHandler(address handler)",
    "function setDomainVerifier(bytes32 domainSeparator, address verifier)",
  ]);
  expect(
    plan.calls.map(({ to, data }, i) => ({
      to,
      ...decodeFunctionData({
        abi: i < 2 ? safeAbi : i === 2 ? erc20Abi : composableCowAbi,
        data,
      }),
    })),
  ).toMatchObject([
    {
      to: account,
      functionName: "setFallbackHandler",
      args: [EXTENSIBLE_FALLBACK_ADDRESS],
    },
    {
      to: account,
      functionName: "setDomainVerifier",
      args: [domainSeparator, COMPOSABLE_COW_ADDRESS],
    },
    {
      to: draft.tokenSell.address,
      functionName: "approve",
      args: [GPV2_VAULT_RELAYER_ADDRESS, BigInt("1000000000000000000")],
    },
    {
      to: COMPOSABLE_COW_ADDRESS,
      functionName: "create",
      args: [{ salt: draft.salt }, true],
    },
  ]);
});

test("skips Safe setup and approval that are already satisfied", async () => {
  jest
    .spyOn(global, "fetch")
    .mockImplementation(
      async (url) => new Response(JSON.stringify(String(url).split("/").pop())),
    );
  const client = {
    readContract: async () => domainSeparator,
  } as unknown as PublicClient;
  const prepared = await prepareSafePlacement({
    draft,
    account,
    chainId: 11155111,
    client,
  });
  const plan = buildSafePlacementPlan(prepared, {
    fallbackHandler: EXTENSIBLE_FALLBACK_ADDRESS,
    domainVerifier: COMPOSABLE_COW_ADDRESS,
    allowance: BigInt("2000000000000000000"),
    requiredAllowance: BigInt("1000000000000000000"),
    balance: BigInt("2000000000000000000"),
    created: false,
  });
  expect(plan.calls.map((call) => call.stage)).toEqual(["create"]);
});

test("resets a nonzero insufficient relayer allowance before approving", async () => {
  jest
    .spyOn(global, "fetch")
    .mockImplementation(
      async (url) => new Response(JSON.stringify(String(url).split("/").pop())),
    );
  const client = {
    readContract: async () => domainSeparator,
  } as unknown as PublicClient;
  const prepared = await prepareSafePlacement({
    draft,
    account,
    chainId: 11155111,
    client,
  });
  const plan = buildSafePlacementPlan(prepared, {
    fallbackHandler: EXTENSIBLE_FALLBACK_ADDRESS,
    domainVerifier: COMPOSABLE_COW_ADDRESS,
    allowance: BigInt(1),
    requiredAllowance: BigInt("1000000000000000000"),
    balance: BigInt("2000000000000000000"),
    created: false,
  });
  expect(plan.calls.map((call) => call.stage)).toEqual([
    "approval-reset",
    "approval",
    "create",
  ]);
  expect(
    decodeFunctionData({ abi: erc20Abi, data: plan.calls[0].data }).args,
  ).toEqual([GPV2_VAULT_RELAYER_ADDRESS, BigInt(0)]);
});

test("does not plan a second creation for an existing Safe order", async () => {
  jest
    .spyOn(global, "fetch")
    .mockImplementation(
      async (url) => new Response(JSON.stringify(String(url).split("/").pop())),
    );
  const client = {
    readContract: async () => domainSeparator,
  } as unknown as PublicClient;
  const prepared = await prepareSafePlacement({
    draft,
    account,
    chainId: 11155111,
    client,
  });
  expect(() =>
    buildSafePlacementPlan(prepared, {
      fallbackHandler: EXTENSIBLE_FALLBACK_ADDRESS,
      domainVerifier: COMPOSABLE_COW_ADDRESS,
      allowance: BigInt("2000000000000000000"),
      requiredAllowance: BigInt("1000000000000000000"),
      balance: BigInt("2000000000000000000"),
      created: true,
    }),
  ).toThrow(/already.*created/i);
});

test.each(["balance", "expiry"])(
  "blocks Safe submission with invalid %s",
  async (invalid) => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation(
        async (url) =>
          new Response(JSON.stringify(String(url).split("/").pop())),
      );
    const client = {
      readContract: async () => domainSeparator,
    } as unknown as PublicClient;
    const prepared = await prepareSafePlacement({
      draft,
      account,
      chainId: 11155111,
      client,
    });
    if (invalid === "expiry") prepared.draft.validTo = 1;
    expect(() =>
      buildSafePlacementPlan(prepared, {
        fallbackHandler: EXTENSIBLE_FALLBACK_ADDRESS,
        domainVerifier: COMPOSABLE_COW_ADDRESS,
        allowance: BigInt(0),
        requiredAllowance: BigInt("1000000000000000000"),
        balance:
          invalid === "balance" ? BigInt(0) : BigInt("2000000000000000000"),
        created: false,
      }),
    ).toThrow(/balance|expired/);
  },
);

test("checks the Safe's own funding and configuration at one block", async () => {
  jest.spyOn(global, "fetch").mockImplementation(async (url, init) => {
    if (String(url).includes("app_data"))
      return new Response(JSON.stringify(String(url).split("/").pop()));
    const field = JSON.parse(String(init?.body)).query.includes("CowShedOwners")
      ? "ownerMappings"
      : "conditionalOrderGenerators";
    return new Response(
      JSON.stringify({
        data: { [field]: { items: [], pageInfo: { hasNextPage: false } } },
      }),
    );
  });
  const client = {
    getBlockNumber: async () => BigInt(100),
    getBlock: async () => ({ timestamp: BigInt(1800000000) }),
    getStorageAt: async () => `0x${"00".repeat(32)}`,
    getBytecode: async () => "0x6000",
    readContract: async ({
      functionName,
      args,
      blockNumber,
    }: {
      functionName: string;
      args?: unknown[];
      blockNumber?: bigint;
    }) => {
      if (functionName === "domainSeparator") return domainSeparator;
      if (blockNumber !== BigInt(100)) throw new Error("Unpinned funding read");
      if (functionName === "vaultRelayer") return GPV2_VAULT_RELAYER_ADDRESS;
      if (functionName === "singleOrders") return false;
      if (functionName === "latestRoundData")
        return [
          BigInt(1),
          BigInt(200000000000),
          BigInt(1799999999),
          BigInt(1799999999),
          BigInt(1),
        ];
      if (functionName === "decimals") return 8;
      if (args?.[0] !== account)
        throw new Error("Funding must belong to the Safe");
      if (functionName === "balanceOf") return BigInt("3000000000000000000");
      if (functionName === "allowance") return BigInt(0);
      throw new Error(`Unexpected read: ${functionName}`);
    },
  } as unknown as PublicClient;
  const prepared = await prepareSafePlacement({
    draft,
    account,
    chainId: 11155111,
    client,
  });
  await expect(
    readSafePlacementChecks(prepared, { client }),
  ).resolves.toMatchObject({
    balance: BigInt("3000000000000000000"),
    requiredAllowance: BigInt("1000000000000000000"),
    fallbackHandler: zeroAddress,
    created: false,
  });
});
