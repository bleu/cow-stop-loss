import {
  decodeAbiParameters,
  decodeFunctionData,
  encodeAbiParameters,
  getAddress,
  parseAbi,
  parseAbiParameters,
  PublicClient,
  zeroAddress,
} from "viem";

import { defaultAdvancedSettings } from "#/hooks/useAdvancedSettings";
import { configuredTokenRoute } from "#/lib/oracleRouter";
import { invalidatePlacementReads } from "#/lib/placementReads";
import {
  buildApprovalRepair,
  buildPlacementApproval,
  buildPlacementSetup,
  prefetchPlacementChecks,
  preparePlacement,
  refreshApprovalRepair,
  refreshPlacementChecks,
  verifyPlacementConfirmation,
} from "#/lib/pollerStopLoss";
import { publicClientsFromIds } from "#/lib/publicClients";
import { encodeStopLossStaticInput } from "#/lib/staticInputEncoder";
import { getSupportedTokens } from "#/lib/supportedTokens";
import { fetchFormattedBalanceOf } from "#/lib/tokenUtils";
import { DraftOrder, OrderStatus } from "#/lib/types";

const account = "0x1111111111111111111111111111111111111111";
const domainSeparator = `0x${"ef".repeat(32)}` as const;
const tokenSell = {
  address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  decimals: 18,
  symbol: "WETH",
} as const;
const tokenBuy = {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  decimals: 6,
  symbol: "USDC",
} as const;
const route = configuredTokenRoute({ chainId: 1, tokenSell, tokenBuy });
const draft: DraftOrder = {
  id: "reviewed-order",
  tokenSell,
  tokenBuy,
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
  ...route,
  oraclePrice: 2000,
  status: OrderStatus.DRAFT,
};

beforeEach(() => {
  jest
    .spyOn(global, "fetch")
    .mockImplementation(
      async (url) => new Response(JSON.stringify(String(url).split("/").pop())),
    );
});
afterEach(() => {
  invalidatePlacementReads({ account, chainId: 1 });
  jest.restoreAllMocks();
});

test("reuses prefetched balances, allowances, contracts and oracles in order review", async () => {
  const source = publicClientsFromIds[1];
  const client = checkingClient();
  jest
    .spyOn(source, "getBlockNumber")
    .mockImplementation(client.getBlockNumber);
  jest
    .spyOn(source, "getBlock")
    .mockImplementation(client.getBlock as typeof source.getBlock);
  jest.spyOn(source, "getBytecode").mockImplementation(client.getBytecode);
  const read = jest
    .spyOn(source, "readContract")
    .mockImplementation(client.readContract);
  emptyFundingApi();
  const fetchOrders = jest.mocked(global.fetch).getMockImplementation()!;
  jest
    .mocked(global.fetch)
    .mockImplementation(async (url, init) =>
      String(url).includes("/app_data/")
        ? new Response(JSON.stringify(String(url).split("/").pop()))
        : fetchOrders(url, init),
    );
  await prefetchPlacementChecks({ account, chainId: 1, tokenSell });
  const callsBeforeReview = read.mock.calls.length;
  const requestsBeforeReview = jest.mocked(global.fetch).mock.calls.length;
  await expect(
    fetchFormattedBalanceOf({
      token: draft.tokenSell,
      address: account,
      chainId: 1,
    }),
  ).resolves.toBe("5");
  expect(
    read.mock.calls.filter(([args]) => args.functionName === "balanceOf"),
  ).toHaveLength(2);
  expect(
    read.mock.calls.filter(([args]) => args.functionName === "allowance"),
  ).toHaveLength(4);
  const oracleReads = read.mock.calls.filter(
    ([args]) => args.functionName === "latestRoundData",
  );
  expect(
    oracleReads.map(([args]) => args.address?.toLowerCase()).sort(),
  ).toEqual(
    [
      ...new Set(Object.values(route).map((address) => address.toLowerCase())),
    ].sort(),
  );
  const prepared = await preparePlacement({ draft, account, chainId: 1 });
  await expect(refreshPlacementChecks(prepared)).resolves.toMatchObject({
    status: "known",
  });
  expect(read).toHaveBeenCalledTimes(callsBeforeReview);
  expect(source.getBlockNumber).toHaveBeenCalledTimes(1);
  expect(source.getBlock).toHaveBeenCalledTimes(1);
  expect(source.getBytecode).toHaveBeenCalledTimes(5);
  expect(global.fetch).toHaveBeenCalledTimes(requestsBeforeReview + 1);
});

test("warms shared placement context without reading the token catalog", async () => {
  const source = publicClientsFromIds[1];
  const client = checkingClient();
  jest
    .spyOn(source, "getBlockNumber")
    .mockImplementation(client.getBlockNumber);
  jest
    .spyOn(source, "getBlock")
    .mockImplementation(client.getBlock as typeof source.getBlock);
  jest.spyOn(source, "getBytecode").mockImplementation(client.getBytecode);
  const read = jest
    .spyOn(source, "readContract")
    .mockImplementation(client.readContract);
  emptyFundingApi();

  await prefetchPlacementChecks({ account, chainId: 1 });

  expect(read.mock.calls.map(([args]) => args.functionName)).toEqual(
    expect.arrayContaining([
      "COW_SHED_FACTORY",
      "COMPOSABLE_COW",
      "proxyOf",
      "domainSeparator",
    ]),
  );
  expect(
    read.mock.calls.filter(([args]) =>
      ["balanceOf", "allowance", "latestRoundData", "decimals"].includes(
        args.functionName,
      ),
    ),
  ).toHaveLength(0);
});

test("uploads a funding pre-hook for the reviewed order's schedule", async () => {
  const client = {
    readContract: jest.fn(async ({ functionName }) =>
      functionName === "domainSeparator"
        ? domainSeparator
        : functionName === "COW_SHED_FACTORY"
          ? "0x3333333333333333333333333333333333333333"
          : "0x4444444444444444444444444444444444444444",
    ),
  } as unknown as PublicClient;
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const document = JSON.parse(prepared.fullAppData);
  const hook = document.metadata.hooks.pre[0];

  expect(hook).toMatchObject({
    target: "0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3",
    gasLimit: "350000",
  });
  expect(
    decodeFunctionData({
      abi: parseAbi(["function pollFunds(bytes32 id) returns (bool)"]),
      data: hook.callData,
    }),
  ).toEqual({
    functionName: "pollFunds",
    args: [
      "0xc7a10bd0f099ab322b1e38c1992d923b5d65a054d6bd03ea8cecbe3ab5d15b67",
    ],
  });
});

test("prepares the order for the factory pinned by the Poller", async () => {
  const factory = "0x3333333333333333333333333333333333333333";
  const owner = "0x4444444444444444444444444444444444444444";
  const client = {
    readContract: jest.fn(async ({ functionName }) => {
      if (functionName === "domainSeparator") return domainSeparator;
      if (functionName === "COW_SHED_FACTORY") return factory;
      if (functionName === "proxyOf") return owner;
      throw new Error(`Unexpected contract read: ${functionName}`);
    }),
  } as unknown as PublicClient;

  await expect(
    preparePlacement({ draft, account, chainId: 1, client }),
  ).resolves.toMatchObject({ account, chainId: 1, factory, owner });
});

test("keeps reviewed inputs unchanged when the form is edited", async () => {
  const edited = { ...draft, tokenSell: { ...draft.tokenSell } };
  const client = {
    readContract: jest.fn(async ({ functionName }) =>
      functionName === "domainSeparator"
        ? domainSeparator
        : functionName === "COW_SHED_FACTORY"
          ? "0x3333333333333333333333333333333333333333"
          : "0x4444444444444444444444444444444444444444",
    ),
  } as unknown as PublicClient;
  const prepared = await preparePlacement({
    draft: edited,
    account,
    chainId: 1,
    client,
  });
  edited.amountSell = "3";
  edited.tokenSell.symbol = "OTHER";

  expect(prepared.draft).toMatchObject({
    amountSell: "1",
    tokenSell: { symbol: "WETH" },
  });
});

test("encodes the reviewed receiver, amounts and advanced settings with the uploaded hash", async () => {
  const client = {
    readContract: jest.fn(async ({ functionName }) =>
      functionName === "domainSeparator"
        ? domainSeparator
        : functionName === "COW_SHED_FACTORY"
          ? "0x3333333333333333333333333333333333333333"
          : "0x4444444444444444444444444444444444444444",
    ),
  } as unknown as PublicClient;
  const prepared = await preparePlacement({
    draft: {
      ...draft,
      receiver: "0x2222222222222222222222222222222222222222",
      maxHoursSinceOracleUpdates: 0.5,
      partiallyFillable: false,
    },
    account,
    chainId: 1,
    client,
  });

  expect(
    decodeAbiParameters(
      parseAbiParameters(
        "address,address,uint256,uint256,bytes32,address,bool,bool,uint32,address,address,int256,uint32",
      ),
      prepared.staticInput,
    ),
  ).toEqual([
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    BigInt("1000000000000000000"),
    BigInt("1980000000"),
    prepared.appDataHash,
    "0x2222222222222222222222222222222222222222",
    true,
    false,
    1800003600,
    getAddress(route.tokenSellOracle),
    getAddress(route.tokenBuyOracle),
    BigInt("2000000000000000000000"),
    1800,
  ]);
});

test("encodes a new default draft's oracle limit as 86400 seconds", async () => {
  const prepared = await preparePlacement({
    draft: { ...draft, ...defaultAdvancedSettings, receiver: account },
    account,
    chainId: 1,
    client: checkingClient(),
  });
  const staticInput = decodeAbiParameters(
    parseAbiParameters(
      "address,address,uint256,uint256,bytes32,address,bool,bool,uint32,address,address,int256,uint32",
    ),
    prepared.staticInput,
  );

  expect(staticInput[12]).toBe(86400);
});

test("keeps schedule, conditional-order and CoW digest identities distinct", async () => {
  const client = {
    readContract: jest.fn(async ({ functionName }) => {
      if (functionName === "domainSeparator") return domainSeparator;
      if (functionName === "COW_SHED_FACTORY") {
        return "0x3333333333333333333333333333333333333333";
      }
      return "0x4444444444444444444444444444444444444444";
    }),
  } as unknown as PublicClient;
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });

  expect(prepared).toMatchObject({
    scheduleId:
      "0xc7a10bd0f099ab322b1e38c1992d923b5d65a054d6bd03ea8cecbe3ab5d15b67",
    paramsHash:
      "0xcb3a06f7a2e5cd07d0f78d4c6039d19a6fbe9c188cff088da129929f75a40b3a",
    orderDigest:
      "0xc22a14dc364d83ca22dae70b50268a88ce17bb9291986857e29b4eea9734cad1",
  });
});

test("does not prepare placement when app-data upload fails", async () => {
  jest
    .mocked(global.fetch)
    .mockResolvedValue(
      new Response(JSON.stringify({ message: "Unavailable" }), { status: 503 }),
    );
  const client = {
    readContract: jest.fn(async ({ functionName }) =>
      functionName === "domainSeparator"
        ? domainSeparator
        : functionName === "COW_SHED_FACTORY"
          ? "0x3333333333333333333333333333333333333333"
          : "0x4444444444444444444444444444444444444444",
    ),
  } as unknown as PublicClient;

  await expect(
    preparePlacement({ draft, account, chainId: 1, client }),
  ).rejects.toThrow("App-data upload failed (503)");
});

test("rejects an app-data upload that returns a different hash", async () => {
  jest
    .mocked(global.fetch)
    .mockResolvedValue(new Response(JSON.stringify(`0x${"00".repeat(32)}`)));
  const client = {
    readContract: jest.fn(async ({ functionName }) =>
      functionName === "domainSeparator"
        ? domainSeparator
        : functionName === "COW_SHED_FACTORY"
          ? "0x3333333333333333333333333333333333333333"
          : "0x4444444444444444444444444444444444444444",
    ),
  } as unknown as PublicClient;

  await expect(
    preparePlacement({ draft, account, chainId: 1, client }),
  ).rejects.toThrow("App-data upload returned an unexpected hash");
});

test("reports unknown funding obligations when the order API is unavailable", async () => {
  const client = {
    readContract: jest.fn(async ({ functionName }) => {
      if (functionName === "domainSeparator") return domainSeparator;
      if (functionName === "COW_SHED_FACTORY") {
        return "0x3333333333333333333333333333333333333333";
      }
      return "0x4444444444444444444444444444444444444444";
    }),
  } as unknown as PublicClient;
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  jest
    .mocked(global.fetch)
    .mockResolvedValue(new Response("Unavailable", { status: 503 }));

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "Order API request failed (503)",
  });
});

test("approves the new amount plus live unfunded obligations without reserving the balance", async () => {
  const client = {
    getBlockNumber: jest.fn(async () => BigInt(100)),
    getBytecode: jest.fn(async () => "0x01"),
    getBlock: jest.fn(async () => ({ timestamp: BigInt(1800000000) })),
    readContract: jest.fn(async ({ functionName }) => {
      if (functionName === "domainSeparator") return domainSeparator;
      if (functionName === "COW_SHED_FACTORY")
        return "0x3333333333333333333333333333333333333333";
      if (functionName === "proxyOf")
        return "0x4444444444444444444444444444444444444444";
      if (functionName === "decimals") return 8;
      if (functionName === "trustedExecutor")
        return "0x3333333333333333333333333333333333333333";
      if (functionName === "COMPOSABLE_COW")
        return "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74";
      if (functionName === "latestRoundData")
        return [
          BigInt(1),
          BigInt(200000000000),
          BigInt(1800000000),
          BigInt(1800000000),
          BigInt(1),
        ];
      if (functionName === "schedules")
        return [
          "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
          BigInt(0),
          account,
          existing.owner,
          existing.draft.salt,
          existing.staticInput,
        ];
      if (functionName === "singleOrders") return true;
      if (functionName === "funded") return false;
      if (functionName === "allowance") return BigInt(0);
      if (functionName === "balanceOf") return BigInt("2000000000000000000");
      throw new Error(`Unexpected contract read: ${functionName}`);
    }),
  } as unknown as PublicClient;
  const existing = await preparePlacement({
    draft: {
      ...draft,
      salt: `0x${"cd".repeat(32)}`,
      amountSell: "2",
      amountBuy: "3960",
    },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  jest.mocked(global.fetch).mockImplementation(async (_url, init) => {
    const { query } = JSON.parse(String(init?.body));
    const field = query.includes("ownerMappings")
      ? "ownerMappings"
      : "conditionalOrderGenerators";
    return new Response(
      JSON.stringify({
        data: {
          [field]: {
            items:
              field === "ownerMappings"
                ? []
                : [
                    {
                      chainId: 1,
                      owner: existing.owner,
                      resolvedOwner: account,
                      handler: "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
                      orderType: "StopLoss",
                      salt: existing.draft.salt,
                      hash: existing.paramsHash,
                      staticInput: existing.staticInput,
                    },
                  ],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    );
  });

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "known",
    outstandingSellAmount: BigInt("2000000000000000000"),
    requiredAllowance: BigInt("3000000000000000000"),
    currentAllowance: BigInt(0),
    balance: BigInt("2000000000000000000"),
    approvalRequired: true,
    combinedCommitmentsExceedBalance: true,
  });
});

test("includes a confirmed unindexed order once in future funding obligations", async () => {
  const client = {
    getBlockNumber: jest.fn(async () => BigInt(100)),
    getBytecode: jest.fn(async () => "0x01"),
    getBlock: jest.fn(async () => ({ timestamp: BigInt(1800000000) })),
    readContract: jest.fn(async ({ functionName }) => {
      if (functionName === "domainSeparator") return domainSeparator;
      if (functionName === "COW_SHED_FACTORY")
        return "0x3333333333333333333333333333333333333333";
      if (functionName === "proxyOf")
        return "0x4444444444444444444444444444444444444444";
      if (functionName === "decimals") return 8;
      if (functionName === "trustedExecutor")
        return "0x3333333333333333333333333333333333333333";
      if (functionName === "COMPOSABLE_COW")
        return "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74";
      if (functionName === "latestRoundData")
        return [
          BigInt(1),
          BigInt(200000000000),
          BigInt(1800000000),
          BigInt(1800000000),
          BigInt(1),
        ];
      if (functionName === "schedules")
        return [
          "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
          BigInt(0),
          account,
          existing.owner,
          existing.draft.salt,
          existing.staticInput,
        ];
      if (functionName === "singleOrders") return true;
      if (functionName === "funded") return false;
      if (functionName === "allowance") return BigInt("5000000000000000000");
      if (functionName === "balanceOf") return BigInt("5000000000000000000");
      throw new Error(`Unexpected contract read: ${functionName}`);
    }),
  } as unknown as PublicClient;
  const existing = await preparePlacement({
    draft: {
      ...draft,
      salt: `0x${"cd".repeat(32)}`,
      amountSell: "2",
      amountBuy: "3960",
    },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  jest.mocked(global.fetch).mockImplementation(async (_url, init) => {
    const { query } = JSON.parse(String(init?.body));
    const field = query.includes("ownerMappings")
      ? "ownerMappings"
      : "conditionalOrderGenerators";
    return new Response(
      JSON.stringify({
        data: {
          [field]: {
            items: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    );
  });

  expect(
    await refreshPlacementChecks(prepared, {
      client,
      localOrders: [existing, existing],
    }),
  ).toMatchObject({
    status: "known",
    outstandingSellAmount: BigInt("2000000000000000000"),
    requiredAllowance: BigInt("3000000000000000000"),
    approvalRequired: false,
    currentAllowance: BigInt("5000000000000000000"),
  });
});

test("blocks wallet actions when a required price is older than the reviewed maximum age", async () => {
  const client = {
    getBlockNumber: jest.fn(async () => BigInt(100)),
    getBytecode: jest.fn(async () => "0x01"),
    getBlock: jest.fn(async () => ({ timestamp: BigInt(1800000000) })),
    readContract: jest.fn(async ({ functionName }) => {
      if (functionName === "domainSeparator") return domainSeparator;
      if (functionName === "COW_SHED_FACTORY")
        return "0x3333333333333333333333333333333333333333";
      if (functionName === "proxyOf")
        return "0x4444444444444444444444444444444444444444";
      if (functionName === "decimals") return 8;
      if (functionName === "trustedExecutor")
        return "0x3333333333333333333333333333333333333333";
      if (functionName === "COMPOSABLE_COW")
        return "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74";
      if (functionName === "latestRoundData")
        return [
          BigInt(1),
          BigInt(200000000000),
          BigInt(1799996399),
          BigInt(1799996399),
          BigInt(1),
        ];
      if (functionName === "decimals") return 8;
      if (functionName === "allowance" || functionName === "balanceOf")
        return BigInt("5000000000000000000");
      throw new Error(`Unexpected contract read: ${functionName}`);
    }),
  } as unknown as PublicClient;
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  jest.mocked(global.fetch).mockImplementation(async (_url, init) => {
    const { query } = JSON.parse(String(init?.body));
    const field = query.includes("ownerMappings")
      ? "ownerMappings"
      : "conditionalOrderGenerators";
    return new Response(
      JSON.stringify({
        data: {
          [field]: {
            items: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    );
  });

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error:
      "Oracle price data is stale. Try again later, or increase the oracle time limit in Advanced Settings.",
  });
});

test.each([
  [1, 1799996400],
  [2.5, 1799991000],
  [6, 1799978400],
])(
  "accepts prices exactly at the reviewed %s-hour limit and blocks one second older",
  async (maxHoursSinceOracleUpdates, updatedAt) => {
    const client = checkingClient({
      latestRoundData: [
        BigInt(1),
        BigInt(200000000000),
        BigInt(updatedAt),
        BigInt(updatedAt),
        BigInt(1),
      ],
    });
    const prepared = await preparePlacement({
      draft: { ...draft, maxHoursSinceOracleUpdates },
      account,
      chainId: 1,
      client,
    });
    emptyFundingApi();

    expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
      status: "known",
    });

    const olderClient = checkingClient({
      latestRoundData: [
        BigInt(1),
        BigInt(200000000000),
        BigInt(updatedAt - 1),
        BigInt(updatedAt - 1),
        BigInt(1),
      ],
    });
    expect(
      await refreshPlacementChecks(prepared, { client: olderClient }),
    ).toMatchObject({
      status: "unknown",
      error:
        "Oracle price data is stale. Try again later, or increase the oracle time limit in Advanced Settings.",
    });
    await expect(
      buildPlacementApproval(prepared, {
        checks: await refreshPlacementChecks(prepared, { client: olderClient }),
      }),
    ).rejects.toThrow(
      "Oracle price data is stale. Try again later, or increase the oracle time limit in Advanced Settings.",
    );
    await expect(
      buildPlacementSetup(prepared, {
        client: olderClient,
        checks: await refreshPlacementChecks(prepared, { client: olderClient }),
      }),
    ).rejects.toThrow(
      "Oracle price data is stale. Try again later, or increase the oracle time limit in Advanced Settings.",
    );
  },
);

test.each([
  [BigInt(1), BigInt(0), BigInt(1800000000), BigInt(1800000000), BigInt(1)],
  [BigInt(1), BigInt(-1), BigInt(1800000000), BigInt(1800000000), BigInt(1)],
  [
    BigInt(2),
    BigInt(200000000000),
    BigInt(1800000000),
    BigInt(1800000000),
    BigInt(1),
  ],
  [BigInt(1), BigInt(200000000000), BigInt(0), BigInt(0), BigInt(1)],
  [
    BigInt(1),
    BigInt(200000000000),
    BigInt(1800000001),
    BigInt(1800000001),
    BigInt(1),
  ],
])("blocks invalid required feed round %#", async (...round) => {
  const client = checkingClient({ latestRoundData: round });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "Required price feed is invalid",
  });
});

test("keeps an oracle RPC failure distinct from a stale price", async () => {
  const client = checkingClient();
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) => {
    if (args.functionName === "latestRoundData")
      throw new Error("Oracle RPC unavailable");
    return read(args);
  }) as PublicClient["readContract"];
  emptyFundingApi();

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "Oracle RPC unavailable",
  });
  await expect(
    buildPlacementApproval(prepared, {
      checks: await refreshPlacementChecks(prepared, { client }),
    }),
  ).rejects.toThrow("Oracle RPC unavailable");
  await expect(
    buildPlacementSetup(prepared, {
      client,
      checks: await refreshPlacementChecks(prepared, { client }),
    }),
  ).rejects.toThrow("Oracle RPC unavailable");
});

test("blocks an individual order above the wallet balance", async () => {
  const client = checkingClient({ balanceOf: BigInt("999999999999999999") });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "Insufficient balance for this order",
  });
});

test.each([
  [1799999999, "unknown"],
  [1800000000, "known"],
])(
  "uses chain expiry semantics for a new order valid until %s",
  async (validTo, status) => {
    const client = checkingClient();
    const prepared = await preparePlacement({
      draft: { ...draft, validTo: Number(validTo) },
      account,
      chainId: 1,
      client,
    });
    emptyFundingApi();

    expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
      status,
    });
  },
);

test("blocks placement when the configured Poller has no deployed code", async () => {
  const client = checkingClient();
  client.getBytecode = jest.fn(async () => undefined);
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "Required stop-loss contract is not deployed",
  });
});

test("blocks a Poller pinned to another ComposableCow", async () => {
  const client = checkingClient({
    COMPOSABLE_COW: "0x5555555555555555555555555555555555555555",
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "Poller contract configuration does not match this app",
  });
});

test("blocks an existing CowShed that does not trust the pinned factory", async () => {
  const client = checkingClient({
    trustedExecutor: "0x5555555555555555555555555555555555555555",
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "CowShed does not trust the Poller-pinned factory",
  });
});

test("rejects an unsupported token or price-feed route before uploading", async () => {
  await expect(
    preparePlacement({
      draft: {
        ...draft,
        tokenSellOracle: "0x5555555555555555555555555555555555555555",
      },
      account,
      chainId: 1,
      client: checkingClient(),
    }),
  ).rejects.toThrow("Unsupported token or price-feed route");
  expect(global.fetch).not.toHaveBeenCalled();
});

test("rejects saved Gnosis USDC.e placement without changing its identity or blocking historical repair", async () => {
  const { sellTokens, buyToken } = getSupportedTokens(100);
  const tokenSell = sellTokens.find(
    ({ token }) => token.symbol === "WETH",
  )!.token;
  const client = checkingClient({
    allowance: BigInt(0),
    schedules: [
      zeroAddress,
      BigInt(0),
      zeroAddress,
      zeroAddress,
      draft.salt,
      "0x",
    ],
  });
  const prepared = await preparePlacement({
    draft: {
      ...draft,
      tokenSell,
      tokenBuy: buyToken.token,
      ...configuredTokenRoute({
        chainId: 100,
        tokenSell,
        tokenBuy: buyToken.token,
      }),
    },
    account,
    chainId: 100,
    client,
  });
  emptyFundingApi();
  const checks = await refreshPlacementChecks(prepared, { client });
  expect(checks.status).toBe("known");
  if (checks.status === "unknown") throw new Error(checks.error);
  await expect(
    buildPlacementApproval(prepared, { checks }),
  ).resolves.toMatchObject({
    kind: "approval",
  });
  await expect(
    buildPlacementSetup(prepared, {
      client,
      checks: { ...checks, approvalRequired: false },
    }),
  ).resolves.toMatchObject({ to: prepared.factory });

  const legacy = {
    ...prepared,
    draft: {
      ...prepared.draft,
      tokenBuy: {
        address: "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0" as const,
        symbol: "USDC.e",
        decimals: 6,
      },
      tokenBuyOracle: "0x26C31ac71010aF62E6B486D1132E266D6298857D" as const,
    },
  };
  legacy.staticInput = encodeStopLossStaticInput(
    legacy.draft,
    legacy.appDataHash,
  );
  const saved = structuredClone(legacy);
  jest.mocked(client.readContract).mockClear();
  jest.mocked(global.fetch).mockClear();

  await expect(refreshPlacementChecks(legacy, { client })).resolves.toEqual({
    status: "unknown",
    error: "Unsupported buy token",
  });
  await expect(buildPlacementApproval(legacy, { checks })).rejects.toThrow(
    "Unsupported buy token",
  );
  await expect(
    buildPlacementSetup(legacy, {
      client,
      checks: { ...checks, approvalRequired: false },
    }),
  ).rejects.toThrow("Unsupported buy token");
  expect(client.readContract).not.toHaveBeenCalled();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(legacy).toEqual(saved);
  await expect(
    buildApprovalRepair({ ...legacy, kind: "repair" }, { checks }),
  ).resolves.toEqual([
    expect.objectContaining({ stage: "wallet" }),
    expect.objectContaining({ stage: "settlement" }),
  ]);
});

test.each([
  "sell decimals",
  "sell symbol",
  "buy decimals",
  "buy symbol",
  "sell feed",
  "buy feed",
  "encoded sell token",
  "encoded buy token",
  "encoded sell feed",
  "encoded buy feed",
])(
  "rejects saved placement with forged %s before building wallet transactions",
  async (field) => {
    const client = checkingClient({ allowance: BigInt(0) });
    const prepared = await preparePlacement({
      draft,
      account,
      chainId: 1,
      client,
    });
    emptyFundingApi();
    const checks = await refreshPlacementChecks(prepared, { client });
    expect(checks.status).toBe("known");
    if (checks.status === "unknown") throw new Error(checks.error);
    const forgedAddress = "0x5555555555555555555555555555555555555555";
    if (field === "sell decimals") prepared.draft.tokenSell.decimals = 6;
    if (field === "sell symbol") prepared.draft.tokenSell.symbol = "FORGED";
    if (field === "buy decimals") prepared.draft.tokenBuy.decimals = 18;
    if (field === "buy symbol") prepared.draft.tokenBuy.symbol = "FORGED";
    if (field === "sell feed") prepared.draft.tokenSellOracle = forgedAddress;
    if (field === "buy feed") prepared.draft.tokenBuyOracle = forgedAddress;
    if (field.startsWith("encoded")) {
      const encoded = {
        ...prepared.draft,
        tokenSell: { ...prepared.draft.tokenSell },
        tokenBuy: { ...prepared.draft.tokenBuy },
      };
      if (field === "encoded sell token")
        encoded.tokenSell.address = forgedAddress;
      if (field === "encoded buy token")
        encoded.tokenBuy.address = forgedAddress;
      if (field === "encoded sell feed")
        encoded.tokenSellOracle = forgedAddress;
      if (field === "encoded buy feed") encoded.tokenBuyOracle = forgedAddress;
      prepared.staticInput = encodeStopLossStaticInput(
        encoded,
        prepared.appDataHash,
      );
    }
    jest.mocked(client.readContract).mockClear();
    jest.mocked(global.fetch).mockClear();
    const error =
      field.startsWith("sell ") && !field.endsWith("feed")
        ? "Unsupported sell token"
        : field.startsWith("buy ") && !field.endsWith("feed")
          ? "Unsupported buy token"
          : "Unsupported token or price-feed route";

    await expect(refreshPlacementChecks(prepared, { client })).resolves.toEqual(
      { status: "unknown", error },
    );
    await expect(buildPlacementApproval(prepared, { checks })).rejects.toThrow(
      error,
    );
    await expect(
      buildPlacementSetup(prepared, {
        client,
        checks: { ...checks, approvalRequired: false },
      }),
    ).rejects.toThrow(error);
    expect(client.readContract).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  },
);

test("excludes funded orders even before the API reports a fill", async () => {
  const client = checkingClient();
  const existing = await preparePlacement({
    draft: {
      ...draft,
      salt: `0x${"cd".repeat(32)}`,
      amountSell: "2",
      amountBuy: "3960",
    },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) => {
    if (args.functionName === "schedules")
      return [
        "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
        BigInt(4),
        account,
        existing.owner,
        existing.draft.salt,
        existing.staticInput,
      ];
    if (args.functionName === "singleOrders") return true;
    if (args.functionName === "funded") return true;
    return read(args);
  }) as PublicClient["readContract"];
  executionApi(existing, "0");

  expect(
    await refreshPlacementChecks(prepared, { client, localOrders: [existing] }),
  ).toMatchObject({
    status: "known",
    outstandingSellAmount: BigInt(0),
    requiredAllowance: BigInt("1000000000000000000"),
  });
  expect(client.readContract).toHaveBeenCalledWith(
    expect.objectContaining({
      functionName: "funded",
      args: [existing.scheduleId, existing.orderDigest],
    }),
  );
});

test("excludes a registered order whose conditional authorization was removed", async () => {
  const client = checkingClient();
  const existing = await preparePlacement({
    draft: {
      ...draft,
      salt: `0x${"cd".repeat(32)}`,
      amountSell: "2",
      amountBuy: "3960",
    },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) => {
    if (args.functionName === "schedules")
      return [
        "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
        BigInt(4),
        account,
        existing.owner,
        existing.draft.salt,
        existing.staticInput,
      ];
    if (args.functionName === "singleOrders") return false;
    if (args.functionName === "funded") return false;
    return read(args);
  }) as PublicClient["readContract"];
  fundingApi([fundingParent(existing)]);

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "known",
    outstandingSellAmount: BigInt(0),
    requiredAllowance: BigInt("1000000000000000000"),
  });
});

test("excludes an order whose Poller schedule was revoked or never registered", async () => {
  const client = checkingClient({
    schedules: [
      zeroAddress,
      BigInt(5),
      zeroAddress,
      zeroAddress,
      `0x${"00".repeat(32)}`,
      "0x",
    ],
  });
  const existing = await preparePlacement({
    draft: {
      ...draft,
      salt: `0x${"cd".repeat(32)}`,
      amountSell: "2",
      amountBuy: "3960",
    },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  fundingApi([fundingParent(existing)]);

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "known",
    outstandingSellAmount: BigInt(0),
    requiredAllowance: BigInt("1000000000000000000"),
  });
});

test("includes an existing order at its exact expiry timestamp", async () => {
  const client = checkingClient({ singleOrders: true, funded: false });
  const existing = await preparePlacement({
    draft: { ...draft, salt: `0x${"cd".repeat(32)}`, validTo: 1800000000 },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) =>
    args.functionName === "schedules"
      ? [
          "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
          BigInt(0),
          account,
          existing.owner,
          existing.draft.salt,
          existing.staticInput,
        ]
      : read(args),
  ) as PublicClient["readContract"];
  fundingApi([fundingParent(existing)]);

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "known",
    outstandingSellAmount: BigInt("1000000000000000000"),
    requiredAllowance: BigInt("2000000000000000000"),
  });
});

test("uses each existing order's older CowShed owner for its funding schedule", async () => {
  const oldOwner = "0x5555555555555555555555555555555555555555";
  const existing = await preparePlacement({
    draft: {
      ...draft,
      salt: `0x${"cd".repeat(32)}`,
      amountSell: "2",
      amountBuy: "3960",
    },
    account,
    chainId: 1,
    client: checkingClient({ proxyOf: oldOwner }),
  });
  const client = checkingClient();
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) => {
    if (args.functionName === "schedules") {
      if (
        !Array.isArray(args.args) ||
        args.args[0] !==
          "0x6ad2abb56b54d23ff959bd6661d05f8ae1b7742a4dd21a759d57441b3533842d"
      )
        throw new Error("Wrong older-shed schedule");
      return [
        "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
        BigInt(4),
        account,
        oldOwner,
        existing.draft.salt,
        existing.staticInput,
      ];
    }
    if (args.functionName === "singleOrders")
      return Array.isArray(args.args) && args.args[0] === oldOwner;
    if (args.functionName === "funded") return false;
    return read(args);
  }) as PublicClient["readContract"];
  fundingApi([fundingParent(existing)]);

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "known",
    outstandingSellAmount: BigInt("2000000000000000000"),
    requiredAllowance: BigInt("3000000000000000000"),
  });
});

test("includes the full maximum sell obligation of an existing exact-buy order", async () => {
  const owner = "0x4444444444444444444444444444444444444444";
  const salt = `0x${"cd".repeat(32)}` as const;
  const staticInput = encodeAbiParameters(
    parseAbiParameters(
      "address,address,uint256,uint256,bytes32,address,bool,bool,uint32,address,address,int256,uint32",
    ),
    [
      draft.tokenSell.address,
      draft.tokenBuy.address,
      BigInt("2000000000000000000"),
      BigInt("3960000000"),
      `0x${"aa".repeat(32)}`,
      account,
      false,
      true,
      1800003600,
      draft.tokenSellOracle,
      draft.tokenBuyOracle,
      BigInt("2000000000000000000000"),
      3600,
    ],
  );
  const client = checkingClient();
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) => {
    if (args.functionName === "schedules")
      return [
        "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
        BigInt(4),
        account,
        owner,
        salt,
        staticInput,
      ];
    if (args.functionName === "singleOrders") return true;
    if (args.functionName === "funded") {
      expect(args.args).toEqual([
        "0x1d091ca0f927bd07154abca08bdf34433fb7b7502e76936676e6ba41c72ca920",
        "0xdc7004f3a8f387eff6f1510ee5d2b6a7c232e7610026eeb35226accf01e9f029",
      ]);
      return false;
    }
    return read(args);
  }) as PublicClient["readContract"];
  fundingApi([
    {
      chainId: 1,
      owner,
      resolvedOwner: account,
      handler: "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
      orderType: "StopLoss",
      salt,
      hash: "0x2b26b81dbe61b632268031e5f7c71d95597e8973e45e09777536a1f263d39d30",
      staticInput,
    },
  ]);

  const checks = await refreshPlacementChecks(prepared, { client });
  if (checks.status === "unknown") throw new Error(checks.error);
  expect(checks).toMatchObject({
    status: "known",
    outstandingSellAmount: BigInt("2000000000000000000"),
    requiredAllowance: BigInt("3000000000000000000"),
  });
});

test("keeps funding unknown when an indexed parent lacks its static input", async () => {
  const client = checkingClient();
  const existing = await preparePlacement({
    draft: { ...draft, salt: `0x${"cd".repeat(32)}` },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  fundingApi([{ ...fundingParent(existing), staticInput: null }]);

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "Order API returned incomplete funding data",
  });
});

test("keeps funding unknown when the API returns partial data with GraphQL errors", async () => {
  const client = checkingClient();
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  jest.mocked(global.fetch).mockImplementation(async (_url, init) => {
    const { query } = JSON.parse(String(init?.body));
    const field = query.includes("ownerMappings")
      ? "ownerMappings"
      : "conditionalOrderGenerators";
    return new Response(
      JSON.stringify({
        data: {
          [field]: {
            items: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
        errors: [{ message: "Parent query failed" }],
      }),
    );
  });

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "Order API returned incomplete data",
  });
});

test("keeps funding unknown when an existing schedule cannot be read on-chain", async () => {
  const client = checkingClient();
  const existing = await preparePlacement({
    draft: { ...draft, salt: `0x${"cd".repeat(32)}` },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) => {
    if (args.functionName === "schedules")
      throw new Error("Schedule RPC unavailable");
    return read(args);
  }) as PublicClient["readContract"];
  fundingApi([fundingParent(existing)]);

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "Schedule RPC unavailable",
  });
});

test("keeps funding unknown when a parent hash does not match its static parameters", async () => {
  const client = checkingClient();
  const existing = await preparePlacement({
    draft: { ...draft, salt: `0x${"cd".repeat(32)}` },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  fundingApi([{ ...fundingParent(existing), hash: `0x${"00".repeat(32)}` }]);

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "Order API returned inconsistent funding parameters",
  });
});

function fundingParent(prepared: Awaited<ReturnType<typeof preparePlacement>>) {
  return {
    chainId: prepared.chainId,
    owner: prepared.owner,
    resolvedOwner: prepared.account,
    handler: "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
    orderType: "StopLoss",
    salt: prepared.draft.salt,
    hash: prepared.paramsHash,
    staticInput: prepared.staticInput,
  };
}

function fundingApi(parents: readonly unknown[]) {
  jest.mocked(global.fetch).mockImplementation(async (_url, init) => {
    const { query } = JSON.parse(String(init?.body));
    const field = query.includes("ownerMappings")
      ? "ownerMappings"
      : "conditionalOrderGenerators";
    return new Response(
      JSON.stringify({
        data: {
          [field]: {
            items: field === "ownerMappings" ? [] : parents,
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    );
  });
}

test("builds one atomic factory transaction for a new shed with dispatch and current epoch", async () => {
  const client = checkingClient({
    schedules: [
      zeroAddress,
      BigInt(7),
      zeroAddress,
      zeroAddress,
      `0x${"00".repeat(32)}`,
      "0x",
    ],
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  client.getBytecode = jest.fn(async ({ address }) =>
    address.toLowerCase() === prepared.owner.toLowerCase() ? undefined : "0x01",
  );
  emptyFundingApi();

  const transaction = await buildPlacementSetup(prepared, {
    client,
    checks: await refreshPlacementChecks(prepared, { client }),
  });
  expect(transaction).toMatchObject({
    to: prepared.factory,
    account,
    chainId: 1,
    value: BigInt(0),
  });
  const setup = decodeFunctionData({
    abi: parseAbi([
      "function executeOwnHooks((address target,uint256 value,bytes callData,bool allowFailure,bool isDelegateCall)[] calls) payable returns (address proxy)",
    ]),
    data: transaction.data,
  });
  const calls = setup.args![0];
  expect(calls).toHaveLength(3);
  expect(
    calls.every(
      (call) =>
        call.value === BigInt(0) && !call.allowFailure && !call.isDelegateCall,
    ),
  ).toBe(true);
  expect(calls.map((call) => call.target.toLowerCase())).toEqual([
    draft.tokenSell.address.toLowerCase(),
    "0xfdafc9d1902f4e0b84f65f49f244b32b31013b74",
    prepared.poller.toLowerCase(),
  ]);
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data: calls[0].callData,
    }).args,
  ).toEqual([
    "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110",
    BigInt(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    ),
  ]);
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function create((address handler,bytes32 salt,bytes staticInput) params,bool dispatch)",
      ]),
      data: calls[1].callData,
    }).args,
  ).toEqual([
    {
      handler: "0x412c36e5011CD2517016D243a2dfB37f73A242E7",
      salt: draft.salt,
      staticInput: prepared.staticInput,
    },
    true,
  ]);
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function registerFromShed((address handler,uint96 authEpoch,address funder,address owner,bytes32 salt,bytes staticInput) schedule) returns (bytes32 id)",
      ]),
      data: calls[2].callData,
    }).args,
  ).toEqual([
    {
      handler: "0x412c36e5011CD2517016D243a2dfB37f73A242E7",
      authEpoch: BigInt(7),
      funder: account,
      owner: prepared.owner,
      salt: draft.salt,
      staticInput: prepared.staticInput,
    },
  ]);
});

test("does not recreate an authorized order when browser recovery is absent", async () => {
  const client = checkingClient({
    singleOrders: true,
    schedules: [
      zeroAddress,
      BigInt(0),
      zeroAddress,
      zeroAddress,
      `0x${"00".repeat(32)}`,
      "0x",
    ],
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();
  await expect(
    buildPlacementSetup(prepared, {
      client,
      checks: await refreshPlacementChecks(prepared, { client }),
    }),
  ).rejects.toThrow("This order has already been created.");
});

test("does not build setup before wallet-to-Poller approval is sufficient", async () => {
  const client = checkingClient({
    allowance: BigInt(0),
    schedules: [
      zeroAddress,
      BigInt(0),
      zeroAddress,
      zeroAddress,
      `0x${"00".repeat(32)}`,
      "0x",
    ],
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();

  await expect(
    buildPlacementSetup(prepared, {
      client,
      checks: await refreshPlacementChecks(prepared, { client }),
    }),
  ).rejects.toThrow("Approve the funding amount before placing this order");
});

test("builds transactions from the reviewed snapshot without another API check", async () => {
  const client = checkingClient({
    schedules: [
      zeroAddress,
      BigInt(0),
      zeroAddress,
      zeroAddress,
      `0x${"00".repeat(32)}`,
      "0x",
    ],
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();
  const checks = await refreshPlacementChecks(prepared, { client });
  jest
    .mocked(global.fetch)
    .mockRejectedValue(new Error("API became unavailable"));

  await expect(buildPlacementApproval(prepared, { checks })).resolves.toEqual({
    kind: "none",
    transaction: null,
  });
  await expect(
    buildPlacementSetup(prepared, { client, checks }),
  ).resolves.toMatchObject({
    to: prepared.factory,
  });
});

test.each([
  BigInt("5000000000000000000"),
  BigInt(
    "115792089237316195423570985008687907853269984665640564039457584007913129639935",
  ),
])(
  "keeps a sufficient CowShed settlement allowance of %s unchanged",
  async (settlementAllowance) => {
    const client = checkingClient({
      schedules: [
        zeroAddress,
        BigInt(0),
        zeroAddress,
        zeroAddress,
        `0x${"00".repeat(32)}`,
        "0x",
      ],
    });
    const prepared = await preparePlacement({
      draft,
      account,
      chainId: 1,
      client,
    });
    const read = client.readContract;
    client.readContract = jest.fn(async (args) => {
      if (
        args.functionName === "allowance" &&
        Array.isArray(args.args) &&
        args.args[0] === prepared.owner
      )
        return settlementAllowance;
      return read(args);
    }) as PublicClient["readContract"];
    emptyFundingApi();

    const transaction = await buildPlacementSetup(prepared, {
      client,
      checks: await refreshPlacementChecks(prepared, { client }),
    });
    const { args } = decodeFunctionData({
      abi: parseAbi([
        "function executeOwnHooks((address target,uint256 value,bytes callData,bool allowFailure,bool isDelegateCall)[] calls) payable returns (address proxy)",
      ]),
      data: transaction.data,
    });
    expect(args![0]).toHaveLength(2);
    expect(args![0][0].target.toLowerCase()).toBe(
      "0xfdafc9d1902f4e0b84f65f49f244b32b31013b74",
    );
  },
);

test("covers shared unfunded settlement obligations rather than only the new order", async () => {
  const client = checkingClient({
    schedules: [
      zeroAddress,
      BigInt(0),
      zeroAddress,
      zeroAddress,
      `0x${"00".repeat(32)}`,
      "0x",
    ],
  });
  const existing = await preparePlacement({
    draft: {
      ...draft,
      salt: `0x${"cd".repeat(32)}`,
      amountSell: "2",
      amountBuy: "3960",
    },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) => {
    if (
      args.functionName === "schedules" &&
      (Array.isArray(args.args) ? args.args[0] : undefined) ===
        existing.scheduleId
    )
      return [
        "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
        BigInt(0),
        account,
        existing.owner,
        existing.draft.salt,
        existing.staticInput,
      ];
    if (args.functionName === "singleOrders")
      return (
        (Array.isArray(args.args) ? args.args[1] : undefined) ===
        existing.paramsHash
      );
    if (args.functionName === "funded") return false;
    if (
      args.functionName === "allowance" &&
      (Array.isArray(args.args) ? args.args[0] : undefined) === prepared.owner
    )
      return BigInt("2000000000000000000");
    return read(args);
  }) as PublicClient["readContract"];
  fundingApi([fundingParent(existing), fundingParent(existing)]);
  const checks = await refreshPlacementChecks(prepared, {
    client,
    localOrders: [existing],
  });
  const transaction = await buildPlacementSetup(prepared, { client, checks });
  const { args } = decodeFunctionData({
    abi: parseAbi([
      "function executeOwnHooks((address target,uint256 value,bytes callData,bool allowFailure,bool isDelegateCall)[] calls) payable returns (address proxy)",
    ]),
    data: transaction.data,
  });
  expect(args![0]).toHaveLength(3);
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data: args![0][0].callData,
    }).args,
  ).toEqual([
    "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110",
    BigInt(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    ),
  ]);
});

test("keeps finite settlement permission that covers a funded partial order plus the new order", async () => {
  const client = checkingClient({
    schedules: [
      zeroAddress,
      BigInt(0),
      zeroAddress,
      zeroAddress,
      `0x${"00".repeat(32)}`,
      "0x",
    ],
  });
  const existing = await preparePlacement({
    draft: {
      ...draft,
      salt: `0x${"cd".repeat(32)}`,
      amountSell: "2",
      amountBuy: "3960",
    },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) => {
    if (
      args.functionName === "schedules" &&
      Array.isArray(args.args) &&
      args.args[0] === existing.scheduleId
    )
      return [
        "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
        BigInt(0),
        account,
        existing.owner,
        existing.draft.salt,
        existing.staticInput,
      ];
    if (args.functionName === "singleOrders")
      return Array.isArray(args.args) && args.args[1] === existing.paramsHash;
    if (args.functionName === "funded") return true;
    if (
      args.functionName === "allowance" &&
      Array.isArray(args.args) &&
      args.args[0] === prepared.owner
    )
      return BigInt("2500000000000000000");
    return read(args);
  }) as PublicClient["readContract"];
  executionApi(existing, "500000000000000000");
  const checks = await refreshPlacementChecks(prepared, {
    client,
    localOrders: [existing],
  });
  expect(checks).toMatchObject({
    status: "known",
    requiredAllowance: BigInt("1000000000000000000"),
    requiredSettlementAllowance: BigInt("2500000000000000000"),
  });
  const transaction = await buildPlacementSetup(prepared, { client, checks });
  const { args } = decodeFunctionData({
    abi: parseAbi([
      "function executeOwnHooks((address target,uint256 value,bytes callData,bool allowFailure,bool isDelegateCall)[] calls) payable returns (address proxy)",
    ]),
    data: transaction.data,
  });
  expect(args![0]).toHaveLength(2);
});

test.each(["3960000000", null])(
  "checks legacy exact-buy completion with executed buy amount %s",
  async (executedBuyAmount) => {
    const owner = "0x4444444444444444444444444444444444444444";
    const salt = `0x${"cd".repeat(32)}` as const;
    const hash =
      "0x2b26b81dbe61b632268031e5f7c71d95597e8973e45e09777536a1f263d39d30";
    const staticInput = encodeAbiParameters(
      parseAbiParameters(
        "address,address,uint256,uint256,bytes32,address,bool,bool,uint32,address,address,int256,uint32",
      ),
      [
        draft.tokenSell.address,
        draft.tokenBuy.address,
        BigInt("2000000000000000000"),
        BigInt("3960000000"),
        `0x${"aa".repeat(32)}`,
        account,
        false,
        true,
        1800003600,
        draft.tokenSellOracle,
        draft.tokenBuyOracle,
        BigInt("2000000000000000000000"),
        3600,
      ],
    );
    const client = checkingClient({
      schedules: [
        "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
        BigInt(0),
        account,
        owner,
        salt,
        staticInput,
      ],
      funded: true,
      allowance: BigInt("1000000000000000000"),
    });
    const prepared = await preparePlacement({
      draft,
      account,
      chainId: 1,
      client,
    });
    const read = client.readContract;
    client.readContract = jest.fn(async (args) =>
      args.functionName === "singleOrders"
        ? Array.isArray(args.args) && args.args[1] === hash
        : read(args),
    ) as PublicClient["readContract"];
    fundingApi([
      {
        eventId: "legacy-buy",
        chainId: 1,
        owner,
        resolvedOwner: account,
        handler: "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
        orderType: "StopLoss",
        status: "Active",
        salt,
        hash,
        staticInput,
        transaction: null,
        decodedParams: {
          receiver: account,
          sellToken: draft.tokenSell.address,
          buyToken: draft.tokenBuy.address,
          sellAmount: "2000000000000000000",
          buyAmount: "3960000000",
          validTo: 1800003600,
          strike: "2000000000000000000000",
          isSellOrder: false,
          isPartiallyFillable: true,
          sellTokenPriceOracle: draft.tokenSellOracle,
          buyTokenPriceOracle: draft.tokenBuyOracle,
          maxTimeSinceLastOracleUpdate: 3600,
        },
        discreteOrders: {
          items: [
            {
              orderUid:
                "0xdc7004f3a8f387eff6f1510ee5d2b6a7c232e7610026eeb35226accf01e9f02944444444444444444444444444444444444444446b49e010",
              status: "fulfilled",
              validTo: 1800003600,
              executedSellAmount: "1500000000000000000",
              executedBuyAmount,
              executedFee: "100000000000000000",
            },
          ],
        },
      },
    ]);

    const checks = await refreshPlacementChecks(prepared, { client });
    if (executedBuyAmount === null) {
      expect(checks).toMatchObject({
        status: "known",
        requiredAllowance: BigInt("1000000000000000000"),
        requiredSettlementAllowance: BigInt("3000000000000000000"),
        settlementApprovalRequired: true,
      });
      await expect(
        buildPlacementSetup(prepared, { client, checks }),
      ).resolves.toMatchObject({ to: prepared.factory });
      return;
    }
    expect(checks).toMatchObject({
      status: "known",
      requiredAllowance: BigInt("1000000000000000000"),
      requiredSettlementAllowance: BigInt("1000000000000000000"),
      settlementApprovalRequired: false,
    });
    const transaction = await buildPlacementSetup(prepared, { client, checks });
    const { args } = decodeFunctionData({
      abi: parseAbi([
        "function executeOwnHooks((address target,uint256 value,bytes callData,bool allowFailure,bool isDelegateCall)[] calls) payable returns (address proxy)",
      ]),
      data: transaction.data,
    });
    expect(args![0]).toHaveLength(2);
  },
);

test("still covers funded settlement after its wallet funding schedule is revoked", async () => {
  const client = checkingClient({
    schedules: [
      zeroAddress,
      BigInt(1),
      zeroAddress,
      zeroAddress,
      `0x${"00".repeat(32)}`,
      "0x",
    ],
    singleOrders: true,
    funded: true,
  });
  const existing = await preparePlacement({
    draft: {
      ...draft,
      salt: `0x${"cd".repeat(32)}`,
      amountSell: "2",
      amountBuy: "3960",
    },
    account,
    chainId: 1,
    client,
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  executionApi(existing, "500000000000000000");
  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "known",
    requiredAllowance: BigInt("1000000000000000000"),
    requiredSettlementAllowance: BigInt("2500000000000000000"),
  });
});

function executionApi(
  existing: Awaited<ReturnType<typeof preparePlacement>>,
  executedSellAmount: string | null,
  uid?: string,
) {
  jest.mocked(global.fetch).mockImplementation(async (_url, init) => {
    const { query } = JSON.parse(String(init?.body));
    const mappings = query.includes("ownerMappings");
    const display = query.includes("query StopLossOrders");
    return new Response(
      JSON.stringify({
        data: {
          [mappings ? "ownerMappings" : "conditionalOrderGenerators"]: {
            items: mappings
              ? []
              : display
                ? [
                    {
                      ...fundingParent(existing),
                      eventId: "existing",
                      status: "Active",
                      transaction: null,
                      decodedParams: {
                        receiver: account,
                        sellToken: draft.tokenSell.address,
                        buyToken: draft.tokenBuy.address,
                        sellAmount: "2000000000000000000",
                        buyAmount: "3960000000",
                        validTo: 1800003600,
                        strike: "2000000000000000000000",
                        isPartiallyFillable: true,
                        isSellOrder: true,
                        sellTokenPriceOracle: draft.tokenSellOracle,
                        buyTokenPriceOracle: draft.tokenBuyOracle,
                        maxTimeSinceLastOracleUpdate: 3600,
                      },
                      discreteOrders: {
                        items: [
                          {
                            orderUid:
                              uid ??
                              `${existing.orderDigest}${existing.owner.slice(2)}6b49e010`,
                            status: "open",
                            validTo: 1800003600,
                            executedSellAmount,
                            executedBuyAmount: "990000000",
                            executedFee: "100000000000000000",
                          },
                        ],
                      },
                    },
                  ]
                : [fundingParent(existing)],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    );
  });
}

test("repairs the selected existing wallet obligation once without creating an order", async () => {
  const client = checkingClient({
    allowance: BigInt(1),
    singleOrders: true,
    funded: false,
  });
  const existing = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) => {
    if (args.functionName === "schedules")
      return [
        "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
        BigInt(0),
        account,
        existing.owner,
        existing.draft.salt,
        existing.staticInput,
      ];
    if (
      args.functionName === "allowance" &&
      Array.isArray(args.args) &&
      args.args[0] === existing.owner
    )
      return BigInt("1000000000000000000");
    return read(args);
  }) as PublicClient["readContract"];
  fundingApi([fundingParent(existing), fundingParent(existing)]);
  const review = await refreshApprovalRepair(
    { account, chainId: 1, owner: existing.owner, hash: existing.paramsHash },
    { client, localOrders: [existing] },
  );
  expect(review.checks).toMatchObject({
    status: "known",
    requiredAllowance: BigInt("1000000000000000000"),
    requiredSettlementAllowance: BigInt("1000000000000000000"),
    settlementApprovalRequired: false,
  });
  if (!review.prepared) throw new Error("Repair identity unavailable");
  const work = await buildApprovalRepair(review.prepared, {
    checks: review.checks,
  });
  expect(work).toHaveLength(1);
  expect(work[0].stage).toBe("wallet");
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data: work[0].transaction.data,
    }).args,
  ).toEqual([
    "0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3",
    BigInt("1000000000000000000"),
  ]);
});

test("repairs only deficient settlement for a funded order without new registration", async () => {
  const client = checkingClient({
    allowance: BigInt(1),
    singleOrders: true,
    funded: true,
  });
  const existing = await preparePlacement({
    draft: { ...draft, amountSell: "2", amountBuy: "3960" },
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) =>
    args.functionName === "schedules"
      ? [
          "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
          BigInt(0),
          account,
          existing.owner,
          existing.draft.salt,
          existing.staticInput,
        ]
      : read(args),
  ) as PublicClient["readContract"];
  executionApi(existing, "500000000000000000");
  const review = await refreshApprovalRepair(
    { account, chainId: 1, owner: existing.owner, hash: existing.paramsHash },
    { client },
  );
  expect(review.checks).toMatchObject({
    status: "known",
    requiredAllowance: BigInt(0),
    requiredSettlementAllowance: BigInt("1500000000000000000"),
    settlementApprovalRequired: true,
  });
  if (!review.prepared) throw new Error("Repair identity unavailable");
  const work = await buildApprovalRepair(review.prepared, {
    checks: review.checks,
  });
  expect(work.map(({ stage }) => stage)).toEqual(["settlement"]);
  const { args } = decodeFunctionData({
    abi: parseAbi([
      "function executeOwnHooks((address target,uint256 value,bytes callData,bool allowFailure,bool isDelegateCall)[] calls) payable returns (address proxy)",
    ]),
    data: work[0].transaction.data,
  });
  expect(work[0].transaction.to).toBe(existing.factory);
  expect(args![0]).toHaveLength(1);
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data: args![0][0].callData,
    }).args,
  ).toEqual([
    "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110",
    BigInt(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    ),
  ]);
});

test("builds creation settlement permission from the reviewed snapshot without another allowance read", async () => {
  const client = checkingClient({
    schedules: [
      zeroAddress,
      BigInt(0),
      zeroAddress,
      zeroAddress,
      `0x${"00".repeat(32)}`,
      "0x",
    ],
    allowance: BigInt("1000000000000000000"),
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();
  const checks = await refreshPlacementChecks(prepared, { client });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) => {
    if (args.functionName === "allowance")
      throw new Error("Allowance RPC became unavailable");
    return read(args);
  }) as PublicClient["readContract"];
  await expect(
    buildPlacementSetup(prepared, { client, checks }),
  ).resolves.toMatchObject({ to: prepared.factory });
});

test("does not confirm creation when settlement covers only its new amount", async () => {
  const client = checkingClient({
    singleOrders: true,
    allowance: BigInt("1000000000000000000"),
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) =>
    args.functionName === "schedules"
      ? [
          "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
          BigInt(0),
          account,
          prepared.owner,
          prepared.draft.salt,
          prepared.staticInput,
        ]
      : read(args),
  ) as PublicClient["readContract"];
  const confirmation = {
    client,
    requiredSettlementAllowance: BigInt("3000000000000000000"),
  };
  await expect(
    verifyPlacementConfirmation(prepared, confirmation),
  ).resolves.toBe(false);
});

test("blocks repair when the displayed selected order is no longer authorized", async () => {
  const client = checkingClient({
    singleOrders: false,
    schedules: [
      zeroAddress,
      BigInt(0),
      zeroAddress,
      zeroAddress,
      `0x${"00".repeat(32)}`,
      "0x",
    ],
  });
  const existing = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  fundingApi([fundingParent(existing)]);
  const review = await refreshApprovalRepair(
    { account, chainId: 1, owner: existing.owner, hash: existing.paramsHash },
    { client },
  );
  expect(review.checks).toMatchObject({
    status: "unknown",
    error: "Selected order is no longer authorized",
  });
});

test.each([
  "missing amount",
  "missing child",
  "missing parent",
  "wrong UID",
  "negative amount",
  "excess amount",
])(
  "places a new order with incomplete funded execution: %s",
  async (scenario) => {
    const client = checkingClient({ singleOrders: true, funded: true });
    const existing = await preparePlacement({
      draft: { ...draft, amountSell: "2", amountBuy: "3960" },
      account,
      chainId: 1,
      client,
    });
    const prepared = await preparePlacement({
      draft: { ...draft, salt: `0x${"cd".repeat(32)}` },
      account,
      chainId: 1,
      client,
    });
    const read = client.readContract;
    client.readContract = jest.fn(async (args) => {
      if (args.functionName === "singleOrders")
        return Array.isArray(args.args) && args.args[1] === existing.paramsHash;
      if (args.functionName === "schedules")
        return [
          "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
          BigInt(0),
          account,
          existing.owner,
          existing.draft.salt,
          existing.staticInput,
        ];
      return read(args);
    }) as PublicClient["readContract"];
    executionApi(
      existing,
      scenario === "negative amount"
        ? "-1"
        : scenario === "excess amount"
          ? "3000000000000000000"
          : scenario === "wrong UID"
            ? "500000000000000000"
            : null,
      scenario === "wrong UID" ? `0x${"00".repeat(56)}` : undefined,
    );
    const fetchExecution = jest.mocked(global.fetch).getMockImplementation()!;
    jest.mocked(global.fetch).mockImplementation(async (url, init) => {
      const response = await fetchExecution(url, init);
      const body = await response.json();
      if (
        JSON.parse(String(init?.body)).query.includes("query StopLossOrders")
      ) {
        const parents = body.data.conditionalOrderGenerators.items;
        if (scenario === "missing parent") parents.length = 0;
        if (scenario === "missing child") parents[0].discreteOrders.items = [];
      }
      return new Response(JSON.stringify(body));
    });
    const checks = await refreshPlacementChecks(prepared, { client });
    expect(checks).toMatchObject({
      status: "known",
      requiredAllowance: BigInt("1000000000000000000"),
      requiredSettlementAllowance: BigInt("3000000000000000000"),
    });
    await expect(
      buildPlacementSetup(prepared, { client, checks }),
    ).resolves.toMatchObject({
      to: prepared.factory,
    });
  },
);

test("blocks repair instead of treating missing funded execution as zero", async () => {
  const client = checkingClient({ singleOrders: true, funded: true });
  const existing = await preparePlacement({
    draft: { ...draft, amountSell: "2", amountBuy: "3960" },
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) =>
    args.functionName === "schedules"
      ? [
          "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
          BigInt(0),
          account,
          existing.owner,
          existing.draft.salt,
          existing.staticInput,
        ]
      : read(args),
  ) as PublicClient["readContract"];
  executionApi(existing, null);
  const review = await refreshApprovalRepair(
    { account, chainId: 1, owner: existing.owner, hash: existing.paramsHash },
    { client },
  );
  expect(review.checks).toMatchObject({
    status: "unknown",
    error: "Settlement execution data is missing or inconsistent",
  });
  if (!review.prepared) throw new Error("Repair identity unavailable");
  await expect(
    buildApprovalRepair(review.prepared, { checks: review.checks }),
  ).rejects.toThrow("Settlement execution data is missing or inconsistent");
});

test("excludes other strategies before requiring StopLoss funding input", async () => {
  const client = checkingClient();
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  fundingApi([
    {
      ...fundingParent(prepared),
      orderType: "TWAP",
      handler: "0x5555555555555555555555555555555555555555",
      staticInput: null,
    },
  ]);
  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "known",
    requiredAllowance: BigInt("1000000000000000000"),
    requiredSettlementAllowance: BigInt("1000000000000000000"),
  });
});

test("directly grants unlimited settlement permission for a shortfall", async () => {
  const client = checkingClient({
    schedules: [
      zeroAddress,
      BigInt(0),
      zeroAddress,
      zeroAddress,
      `0x${"00".repeat(32)}`,
      "0x",
    ],
  });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) =>
    args.functionName === "allowance" &&
    Array.isArray(args.args) &&
    args.args[0] === prepared.owner
      ? BigInt(1)
      : read(args),
  ) as PublicClient["readContract"];
  emptyFundingApi();

  const transaction = await buildPlacementSetup(prepared, {
    client,
    checks: await refreshPlacementChecks(prepared, { client }),
  });
  const { args } = decodeFunctionData({
    abi: parseAbi([
      "function executeOwnHooks((address target,uint256 value,bytes callData,bool allowFailure,bool isDelegateCall)[] calls) payable returns (address proxy)",
    ]),
    data: transaction.data,
  });
  expect(args![0]).toHaveLength(3);
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data: args![0][0].callData,
    }).args,
  ).toEqual([
    "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110",
    BigInt(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    ),
  ]);
});

test("builds a limited wallet approval only for the reviewed funding total", async () => {
  const client = checkingClient({ allowance: BigInt(0) });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();

  const approval = await buildPlacementApproval(prepared, {
    checks: await refreshPlacementChecks(prepared, { client }),
  });
  expect(approval.kind).toBe("approval");
  expect(approval.transaction).toMatchObject({
    to: draft.tokenSell.address,
    account,
    chainId: 1,
    value: BigInt(0),
  });
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data: approval.transaction!.data,
    }).args,
  ).toEqual([
    "0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3",
    BigInt("1000000000000000000"),
  ]);
});

test("uses max uint256 when unlimited wallet approval is selected", async () => {
  const client = checkingClient({ allowance: BigInt(1) });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();

  const approval = await buildPlacementApproval(prepared, {
    checks: await refreshPlacementChecks(prepared, { client }),
    mode: "unlimited",
  });
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data: approval.transaction!.data,
    }).args,
  ).toEqual([
    "0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3",
    BigInt(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    ),
  ]);
});

test("does not lower or resubmit a sufficient wallet allowance", async () => {
  const client = checkingClient();
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();

  expect(
    await buildPlacementApproval(prepared, {
      checks: await refreshPlacementChecks(prepared, { client }),
    }),
  ).toEqual({ kind: "none", transaction: null });
});

test("directly approves the required total from a nonzero insufficient wallet allowance", async () => {
  const client = checkingClient({ allowance: BigInt(1) });
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  emptyFundingApi();

  const approval = await buildPlacementApproval(prepared, {
    checks: await refreshPlacementChecks(prepared, { client }),
  });
  expect(approval.kind).toBe("approval");
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data: approval.transaction!.data,
    }).args,
  ).toEqual([
    "0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3",
    BigInt("1000000000000000000"),
  ]);
});

test.each([
  BigInt("1000000000000000000"),
  BigInt(
    "115792089237316195423570985008687907853269984665640564039457584007913129639935",
  ),
])(
  "requires matching registration and sufficient settlement permission of %s before confirmation",
  async (settlementAllowance) => {
    const client = checkingClient({ singleOrders: false });
    const prepared = await preparePlacement({
      draft,
      account,
      chainId: 1,
      client,
    });

    await expect(
      verifyPlacementConfirmation(prepared, { client }),
    ).resolves.toBe(false);
    const read = client.readContract;
    client.readContract = jest.fn(async (args) => {
      if (args.functionName === "singleOrders") return true;
      if (args.functionName === "schedules")
        return [
          "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
          BigInt(0),
          account,
          prepared.owner,
          prepared.draft.salt,
          prepared.staticInput,
        ];
      if (args.functionName === "allowance") return settlementAllowance;
      return read(args);
    }) as PublicClient["readContract"];
    await expect(
      verifyPlacementConfirmation(prepared, { client }),
    ).resolves.toBe(true);
  },
);

test("blocks a required price whose feed scale cannot be read", async () => {
  const client = checkingClient();
  const prepared = await preparePlacement({
    draft,
    account,
    chainId: 1,
    client,
  });
  const read = client.readContract;
  client.readContract = jest.fn(async (args) => {
    if (args.functionName === "decimals")
      throw new Error("Feed scale unavailable");
    return read(args);
  }) as PublicClient["readContract"];
  emptyFundingApi();

  expect(await refreshPlacementChecks(prepared, { client })).toMatchObject({
    status: "unknown",
    error: "Feed scale unavailable",
  });
});

test("rejects changed draft amounts before uploading app data", async () => {
  await expect(
    preparePlacement({
      draft: { ...draft, amountBuy: "1" },
      account,
      chainId: 1,
      client: checkingClient(),
    }),
  ).rejects.toThrow("Draft amounts do not match its trigger and slippage");
  expect(global.fetch).not.toHaveBeenCalled();
});

function checkingClient(overrides: Record<string, unknown> = {}) {
  return {
    getBlockNumber: jest.fn(async () => BigInt(100)),
    getBytecode: jest.fn(async () => "0x01"),
    getBlock: jest.fn(async () => ({ timestamp: BigInt(1800000000) })),
    readContract: jest.fn(async ({ functionName }) => {
      const responses: Record<string, unknown> = {
        COW_SHED_FACTORY: "0x3333333333333333333333333333333333333333",
        proxyOf: "0x4444444444444444444444444444444444444444",
        domainSeparator,
        COMPOSABLE_COW: "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74",
        trustedExecutor: "0x3333333333333333333333333333333333333333",
        latestRoundData: [
          BigInt(1),
          BigInt(200000000000),
          BigInt(1800000000),
          BigInt(1800000000),
          BigInt(1),
        ],
        decimals: 8,
        singleOrders: false,
        allowance: BigInt("5000000000000000000"),
        balanceOf: BigInt("5000000000000000000"),
        ...overrides,
      };
      if (!(functionName in responses))
        throw new Error(`Unexpected read: ${functionName}`);
      return responses[functionName];
    }),
  } as unknown as PublicClient;
}

function emptyFundingApi() {
  jest.mocked(global.fetch).mockImplementation(async (_url, init) => {
    const { query } = JSON.parse(String(init?.body));
    const field = query.includes("ownerMappings")
      ? "ownerMappings"
      : "conditionalOrderGenerators";
    return new Response(
      JSON.stringify({
        data: {
          [field]: {
            items: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    );
  });
}

test("rejects exact-buy placement in the single-sell flow", async () => {
  await expect(
    preparePlacement({
      draft: { ...draft, isSellOrder: false } as unknown as DraftOrder,
      account,
      chainId: 1,
    }),
  ).rejects.toThrow("Only exact-sell placement is supported");
});

test.each([buildPlacementApproval, buildPlacementSetup])(
  "%p rejects prepared exact-buy input before building a transaction",
  async (build) => {
    const client = checkingClient();
    const prepared = await preparePlacement({
      draft,
      account,
      chainId: 1,
      client,
    });
    const parameters = parseAbiParameters(
      "address,address,uint256,uint256,bytes32,address,bool,bool,uint32,address,address,int256,uint32",
    );
    const values = decodeAbiParameters(parameters, prepared.staticInput);
    prepared.staticInput = encodeAbiParameters(parameters, [
      values[0],
      values[1],
      values[2],
      values[3],
      values[4],
      values[5],
      false,
      values[7],
      values[8],
      values[9],
      values[10],
      values[11],
      values[12],
    ]);
    emptyFundingApi();
    await expect(
      build(prepared, {
        client,
        checks: await refreshPlacementChecks(prepared, { client }),
      }),
    ).rejects.toThrow("Only exact-sell orders are supported.");
  },
);

test("rejects a zero receiver instead of sending proceeds to the CowShed", async () => {
  await expect(
    preparePlacement({
      draft: { ...draft, receiver: zeroAddress },
      account,
      chainId: 1,
    }),
  ).rejects.toThrow("Receiver cannot be the zero address");
});
