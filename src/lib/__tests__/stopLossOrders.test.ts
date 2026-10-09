import { loadStopLossOrders } from "#/lib/stopLossOrders";
import { OrderStatus } from "#/lib/types";

const wallet = "0x1111111111111111111111111111111111111111";
const receiver = "0x2222222222222222222222222222222222222222";
const parent = {
  eventId: "stop-loss-1",
  chainId: 1,
  owner: wallet,
  resolvedOwner: wallet,
  status: "Active",
  orderType: "StopLoss",
  handler: "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
  hash: `0x${"ab".repeat(32)}`,
  transaction: { blockTimestamp: "1700000000" },
  decodedParams: {
    sellToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    buyToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    sellAmount: "1000000000000000000",
    buyAmount: "2000000000",
    receiver,
    validTo: 1700003600,
    isSellOrder: true,
    isPartiallyFillable: true,
    strike: "2100000000000000000000",
    sellTokenPriceOracle: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    buyTokenPriceOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    maxTimeSinceLastOracleUpdate: 3600,
  },
  discreteOrders: { totalCount: 0, items: [] },
};

function page<T>(items: T[]): {
  items: T[];
  totalCount: number;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
} {
  return {
    items,
    totalCount: items.length,
    pageInfo: { hasNextPage: false, endCursor: null },
  };
}

afterEach(() => jest.restoreAllMocks());

test("shows an untriggered stop-loss for the connected wallet", async () => {
  jest.spyOn(Date, "now").mockReturnValue(1700000000000);
  jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    const { query, variables } = JSON.parse(String(init?.body));
    const data = query.includes("ownerMappings")
      ? { ownerMappings: page([]) }
      : {
          conditionalOrderGenerators: page(
            variables.chain === 1 ? [parent] : [],
          ),
        };
    return new Response(JSON.stringify({ data }));
  });

  const result = await loadStopLossOrders({ account: wallet });

  expect(result.chains.find((chain) => chain.chainId === 1)).toMatchObject({
    status: "success",
    orders: [
      {
        id: "1:stop-loss-1",
        parentId: "stop-loss-1",
        chainId: 1,
        owner: wallet,
        status: OrderStatus.OPEN,
        receiver,
        sellAmount: BigInt("1000000000000000000"),
        buyAmount: BigInt("2000000000"),
        validTo: 1700003600,
      },
    ],
  });
});

test("includes CowShed orders even when the parent has no resolved owner", async () => {
  const shed = "0x3333333333333333333333333333333333333333";
  const shedParent = {
    ...parent,
    eventId: "shed-stop-loss",
    owner: shed,
    resolvedOwner: null,
  };
  jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    const { query, variables } = JSON.parse(String(init?.body));
    const owners = variables.owners ?? [variables.wallet];
    const data = query.includes("ownerMappings")
      ? {
          ownerMappings: page(
            variables.chain === 1
              ? [
                  {
                    chainId: 1,
                    owner: wallet,
                    address: shed,
                    addressType: "cowshed_proxy",
                  },
                ]
              : [],
          ),
        }
      : {
          conditionalOrderGenerators: page(
            variables.chain === 1
              ? [parent, shedParent].filter((order) =>
                  owners.includes(order.owner),
                )
              : [],
          ),
        };
    return new Response(JSON.stringify({ data }));
  });

  const result = await loadStopLossOrders({ account: wallet });

  expect(
    result.chains
      .find((chain) => chain.chainId === 1)
      ?.orders.map((order) => order.owner),
  ).toEqual([wallet, shed]);
});

test("includes orders from every parent and CowShed ownership page", async () => {
  const shed = "0x4444444444444444444444444444444444444444";
  jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    const { query, variables } = JSON.parse(String(init?.body));
    const ownership = query.includes("ownerMappings");
    let result = page<unknown>([]);
    if (variables.chain === 1) {
      if (ownership) {
        result = variables.after
          ? page([
              {
                chainId: 1,
                owner: wallet,
                address: shed,
                addressType: "cowshed_proxy",
              },
            ])
          : {
              ...page([]),
              totalCount: 1,
              pageInfo: { hasNextPage: true, endCursor: "next-owner-page" },
            };
      } else {
        result = variables.after
          ? page(
              variables.owners?.includes(shed)
                ? [
                    {
                      ...parent,
                      eventId: "last-page",
                      owner: shed,
                      resolvedOwner: null,
                    },
                  ]
                : [],
            )
          : {
              ...page([parent]),
              totalCount: 2,
              pageInfo: { hasNextPage: true, endCursor: "next-order-page" },
            };
      }
    }
    return new Response(
      JSON.stringify({
        data: {
          [ownership ? "ownerMappings" : "conditionalOrderGenerators"]: result,
        },
      }),
    );
  });

  const result = await loadStopLossOrders({ account: wallet });

  expect(
    result.chains
      .find((chain) => chain.chainId === 1)
      ?.orders.map((order) => order.parentId),
  ).toEqual(["stop-loss-1", "last-page"]);
});

test("keeps successful chains visible when another chain is unavailable", async () => {
  jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    const { query, variables } = JSON.parse(String(init?.body));
    const ownership = query.includes("ownerMappings");
    const data = ownership
      ? { ownerMappings: page([]) }
      : {
          conditionalOrderGenerators: page(
            variables.chain === 1 ? [parent] : [],
          ),
        };
    return new Response(JSON.stringify({ data }), {
      status: !ownership && variables.chain === 100 ? 503 : 200,
    });
  });

  const result = await loadStopLossOrders({ account: wallet });

  expect(result.chains).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        chainId: 1,
        status: "success",
        orders: [expect.objectContaining({ parentId: "stop-loss-1" })],
      }),
      { chainId: 100, status: "error", orders: [], error: expect.any(String) },
    ]),
  );
});

test("shows only this wallet's stop-loss parents once per chain", async () => {
  const otherWallet = "0x5555555555555555555555555555555555555555";
  jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    const { query, variables } = JSON.parse(String(init?.body));
    const data = query.includes("ownerMappings")
      ? {
          ownerMappings: page([
            {
              chainId: 1,
              owner: otherWallet,
              address: otherWallet,
              addressType: "cowshed_proxy",
            },
          ]),
        }
      : {
          conditionalOrderGenerators: page(
            variables.chain === 1
              ? [
                  parent,
                  parent,
                  {
                    ...parent,
                    eventId: "other-wallet",
                    owner: otherWallet,
                    resolvedOwner: otherWallet,
                  },
                  { ...parent, eventId: "other-handler", handler: otherWallet },
                  { ...parent, eventId: "other-strategy", orderType: "TWAP" },
                  { ...parent, eventId: "other-chain", chainId: 100 },
                ]
              : variables.chain === 42161
                ? [{ ...parent, chainId: 42161 }]
                : [],
          ),
        };
    return new Response(JSON.stringify({ data }));
  });

  const result = await loadStopLossOrders({ account: wallet });

  expect(
    result.chains.flatMap((chain) => chain.orders.map((order) => order.id)),
  ).toEqual(["1:stop-loss-1", "42161:stop-loss-1"]);
});

test("retains prices, token units and oracle settings before the order triggers", async () => {
  jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    const { query, variables } = JSON.parse(String(init?.body));
    const data = query.includes("ownerMappings")
      ? { ownerMappings: page([]) }
      : {
          conditionalOrderGenerators: page(
            variables.chain === 1 ? [parent] : [],
          ),
        };
    return new Response(JSON.stringify({ data }));
  });

  const result = await loadStopLossOrders({ account: wallet });

  expect(
    result.chains.find((chain) => chain.chainId === 1)?.orders[0],
  ).toMatchObject({
    sellToken: {
      address: parent.decodedParams.sellToken,
      symbol: "WETH",
      decimals: 18,
    },
    buyToken: {
      address: parent.decodedParams.buyToken,
      symbol: "USDC",
      decimals: 6,
    },
    limitPrice: "2000",
    strike: BigInt("2100000000000000000000"),
    partiallyFillable: true,
    isSellOrder: true,
    createdAt: 1700000000,
    sellTokenPriceOracle: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    buyTokenPriceOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    maxTimeSinceLastOracleUpdate: 3600,
  });
});

test("keeps partial fills attached to the stop-loss's single CoW order", async () => {
  jest.spyOn(Date, "now").mockReturnValue(1700000000000);
  const partial = {
    ...parent,
    discreteOrders: {
      totalCount: 1,
      items: [
        {
          orderUid: "0xexecuted-order",
          status: "open",
          validTo: 1700003600,
          executedSellAmount: "400000000000000000",
          executedBuyAmount: "840000000",
          executedFee: "0",
        },
      ],
    },
  };
  jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    const { query, variables } = JSON.parse(String(init?.body));
    const data = query.includes("ownerMappings")
      ? { ownerMappings: page([]) }
      : {
          conditionalOrderGenerators: page(
            variables.chain === 1 ? [partial] : [],
          ),
        };
    return new Response(JSON.stringify({ data }));
  });

  const result = await loadStopLossOrders({ account: wallet });

  expect(
    result.chains.find((chain) => chain.chainId === 1)?.orders,
  ).toMatchObject([
    {
      parentId: "stop-loss-1",
      status: OrderStatus.PARTIALLY_FILLED,
      executedSellAmount: BigInt("400000000000000000"),
      executedBuyAmount: BigInt("840000000"),
      executionPrice: "2100",
      cowOrder: { uid: "0xexecuted-order", status: "open" },
    },
  ]);
});

function serveOrders(orders: unknown[]) {
  jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    const { query, variables } = JSON.parse(String(init?.body));
    const data = query.includes("ownerMappings")
      ? { ownerMappings: page([]) }
      : {
          conditionalOrderGenerators: page(variables.chain === 1 ? orders : []),
        };
    return new Response(JSON.stringify({ data }));
  });
}

test("retains the creation transaction for the chain's explorer", async () => {
  const hash = `0x${"ef".repeat(32)}`;
  serveOrders([{ ...parent, transaction: { ...parent.transaction, hash } }]);

  const result = await loadStopLossOrders({ account: wallet });

  expect(
    result.chains.find((chain) => chain.chainId === 1)?.orders[0],
  ).toMatchObject({ transactionHash: hash });
});

test("expires an Active untriggered parent using its absolute expiry", async () => {
  jest.spyOn(Date, "now").mockReturnValue(1700003601000);
  serveOrders([parent]);

  const result = await loadStopLossOrders({ account: wallet });

  expect(
    result.chains.find((chain) => chain.chainId === 1)?.orders[0].status,
  ).toBe(OrderStatus.EXPIRED);
});

test("keeps fully executed sell and buy orders filled after expiry", async () => {
  jest.spyOn(Date, "now").mockReturnValue(1700003601000);
  const execution = {
    orderUid: "0xfilled-order",
    status: "open",
    validTo: 1700003600,
    executedSellAmount: "1010000000000000000",
    executedBuyAmount: "2100000000",
    executedFee: "10000000000000000",
  };
  serveOrders([
    { ...parent, discreteOrders: { totalCount: 1, items: [execution] } },
    {
      ...parent,
      eventId: "buy-order",
      decodedParams: { ...parent.decodedParams, isSellOrder: false },
      discreteOrders: {
        totalCount: 1,
        items: [
          {
            ...execution,
            executedSellAmount: "500000000000000000",
            executedBuyAmount: "2000000000",
            executedFee: "0",
          },
        ],
      },
    },
  ]);

  const result = await loadStopLossOrders({ account: wallet });

  expect(
    result.chains
      .find((chain) => chain.chainId === 1)
      ?.orders.map((order) => order.status),
  ).toEqual([OrderStatus.FULFILLED, OrderStatus.FULFILLED]);
});

test("does not subtract surplus fees from the StopLoss sell amount or execution price", async () => {
  jest.spyOn(Date, "now").mockReturnValue(1700000000000);
  serveOrders([
    {
      ...parent,
      discreteOrders: {
        items: [
          {
            orderUid: "0xfilled-with-surplus-fee",
            status: "open",
            validTo: 1700003600,
            executedSellAmount: "1000000000000000000",
            executedBuyAmount: "2100000000",
            executedFee: "10000000000000000",
          },
        ],
      },
    },
  ]);

  const result = await loadStopLossOrders({ account: wallet });

  expect(
    result.chains.find((chain) => chain.chainId === 1)?.orders[0],
  ).toMatchObject({
    status: OrderStatus.FULFILLED,
    executionPrice: "2100",
    executedFee: BigInt("10000000000000000"),
  });
});

test("distinguishes cancellation and expiry for partially filled and unfilled orders", async () => {
  jest.spyOn(Date, "now").mockReturnValue(1700000000000);
  const execution = {
    orderUid: "0xterminal-order",
    status: "open",
    validTo: 1700003600,
    executedSellAmount: "400000000000000000",
    executedBuyAmount: "840000000",
    executedFee: "0",
  };
  serveOrders([
    {
      ...parent,
      eventId: "partial-cancelled",
      status: "Cancelled",
      discreteOrders: { items: [execution] },
    },
    {
      ...parent,
      eventId: "partial-expired",
      discreteOrders: { items: [{ ...execution, status: "expired" }] },
    },
    {
      ...parent,
      eventId: "cancelled",
      discreteOrders: {
        items: [
          {
            ...execution,
            status: "cancelled",
            executedSellAmount: null,
            executedBuyAmount: null,
          },
        ],
      },
    },
    {
      ...parent,
      eventId: "expired",
      status: "Cancelled",
      discreteOrders: {
        items: [
          {
            ...execution,
            status: "expired",
            executedSellAmount: null,
            executedBuyAmount: null,
          },
        ],
      },
    },
  ]);

  const result = await loadStopLossOrders({ account: wallet });

  expect(
    result.chains
      .find((chain) => chain.chainId === 1)
      ?.orders.map((order) => order.status),
  ).toEqual([
    OrderStatus.PARTIALLY_FILLED_AND_CANCELLED,
    OrderStatus.PARTIALLY_FILLED_AND_EXPIRED,
    OrderStatus.CANCELLED,
    OrderStatus.EXPIRED,
  ]);
});

test("does not report partial GraphQL data as a complete chain result", async () => {
  jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    const { query, variables } = JSON.parse(String(init?.body));
    const ownership = query.includes("ownerMappings");
    const data = ownership
      ? { ownerMappings: page([]) }
      : {
          conditionalOrderGenerators: page(
            variables.chain === 1 ? [parent] : [],
          ),
        };
    return new Response(
      JSON.stringify({
        data,
        errors:
          !ownership && variables.chain === 1
            ? [{ message: "Indexer unavailable" }]
            : undefined,
      }),
    );
  });

  const result = await loadStopLossOrders({ account: wallet });

  expect(result.chains.find((chain) => chain.chainId === 1)).toMatchObject({
    status: "error",
    orders: [],
    error: expect.any(String),
  });
});

test("cancels an account's pending load instead of returning failed or late data", async () => {
  const controller = new AbortController();
  jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    if (init?.signal) {
      await new Promise((_resolve, reject) => {
        init.signal!.addEventListener(
          "abort",
          () => reject(init.signal!.reason),
          { once: true },
        );
      });
    }
    const { query } = JSON.parse(String(init?.body));
    const field = query.includes("ownerMappings")
      ? "ownerMappings"
      : "conditionalOrderGenerators";
    return new Response(JSON.stringify({ data: { [field]: page([]) } }));
  });
  const request = { account: wallet, signal: controller.signal } as const;

  const pending = loadStopLossOrders(request);
  controller.abort();

  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
});

test("does not call a truncated page complete when its next cursor is missing", async () => {
  jest.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
    const { query, variables } = JSON.parse(String(init?.body));
    const data = query.includes("ownerMappings")
      ? { ownerMappings: page([]) }
      : {
          conditionalOrderGenerators:
            variables.chain === 1
              ? {
                  ...page([parent]),
                  pageInfo: { hasNextPage: true, endCursor: null },
                }
              : page([]),
        };
    return new Response(JSON.stringify({ data }));
  });

  const result = await loadStopLossOrders({ account: wallet });

  expect(result.chains.find((chain) => chain.chainId === 1)).toMatchObject({
    status: "error",
    orders: [],
    error: expect.any(String),
  });
});
