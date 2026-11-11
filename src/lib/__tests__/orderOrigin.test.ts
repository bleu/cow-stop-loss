import { encodeAbiParameters, type Hex, keccak256, stringToHex } from "viem";

import {
  getLocalOrderOrigin,
  getOrderOrigin,
  type OrderOrigin,
} from "../orderOrigin";
import { stopLossDataStructure } from "../staticInputEncoder";
import { loadStopLossOrders, type StopLossOrder } from "../stopLossOrders";
import { OrderStatus } from "../types";

const wallet = "0x1111111111111111111111111111111111111111";
const hashDocument = (document: string) => keccak256(stringToHex(document));
const documentFor = (fields: Record<string, unknown> = {}) =>
  JSON.stringify({ version: "1.15.0", metadata: {}, ...fields });

function order(
  appData?: Hex,
  chainId: StopLossOrder["chainId"] = 1,
): StopLossOrder {
  return {
    id: "order",
    parentId: "parent",
    chainId,
    appData,
    owner: wallet,
    status: OrderStatus.OPEN,
    receiver: wallet,
    sellAmount: BigInt(1),
    buyAmount: BigInt(1),
    validTo: 2_000_000_000,
    sellToken: { address: wallet, symbol: "SELL", decimals: 18 },
    buyToken: { address: wallet, symbol: "BUY", decimals: 18 },
    strike: BigInt(1),
    partiallyFillable: false,
    isSellOrder: true,
    hash: "0xparent",
    sellTokenPriceOracle: wallet,
    buyTokenPriceOracle: wallet,
    maxTimeSinceLastOracleUpdate: 3600,
    executedSellAmount: null,
    executedBuyAmount: null,
    executedFee: null,
  };
}

let caseId = 0;
function uniqueDocument() {
  return documentFor({ appCode: "bleu-stop-loss" }) + " ".repeat(++caseId);
}

afterEach(() => jest.restoreAllMocks());

test.each<[Record<string, unknown>, OrderOrigin]>([
  [{ appCode: "bleu-stop-loss" }, "app"],
  [{ metadata: { widget: { appCode: "bleu-stop-loss" } } }, "app"],
  [{ appCode: "another-app" }, "other"],
  [{ metadata: { widget: { appCode: "another-app" } } }, "other"],
  [{}, "unknown"],
  [{ appCode: "" }, "unknown"],
  [{ appCode: "  " }, "unknown"],
  [{ appCode: "BLEU-STOP-LOSS" }, "other"],
])("classifies validated app data %j as %s", async (fields, expected) => {
  const document = documentFor(fields);
  await expect(
    getLocalOrderOrigin(document, hashDocument(document)),
  ).resolves.toBe(expected);
});

test.each([
  "not json",
  "null",
  "[]",
  "{}",
  documentFor({ version: "unknown", appCode: "bleu-stop-loss" }),
  documentFor({ appCode: 123 }),
  documentFor({ metadata: { widget: { appCode: 123 } } }),
])("keeps invalid documents unknown: %s", async (document) => {
  await expect(
    getLocalOrderOrigin(document, hashDocument(document)),
  ).resolves.toBe("unknown");
});

test("checks the exact document bytes against the order hash", async () => {
  const document = documentFor({ appCode: "bleu-stop-loss" });
  const hash = hashDocument(document);
  await expect(getLocalOrderOrigin(`${document} `, hash)).resolves.toBe(
    "unknown",
  );
  await expect(
    getLocalOrderOrigin(documentFor({ appCode: "another-app" }), hash),
  ).resolves.toBe("unknown");
  await expect(
    getLocalOrderOrigin(document, `0x${hash.slice(2).toUpperCase()}`),
  ).resolves.toBe("app");
});

test("fetches CoW app data on demand and shares in-flight and completed lookups", async () => {
  const document = uniqueDocument();
  const hash = hashDocument(document);
  let finish!: (response: Response) => void;
  const fetch = jest.spyOn(global, "fetch").mockImplementation(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  expect(fetch).not.toHaveBeenCalled();
  const first = getOrderOrigin(order(hash));
  const second = getOrderOrigin(order(`0x${hash.slice(2).toUpperCase()}`));
  expect(second).toBe(first);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith(
    `https://api.cow.fi/mainnet/api/v1/app_data/${hash}`,
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  finish(new Response(JSON.stringify({ fullAppData: document })));
  await expect(first).resolves.toBe("app");
  await expect(getOrderOrigin(order(hash))).resolves.toBe("app");
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("keeps caches separate for each chain", async () => {
  const document = uniqueDocument();
  const hash = hashDocument(document);
  const fetch = jest
    .spyOn(global, "fetch")
    .mockImplementation(
      async () => new Response(JSON.stringify({ fullAppData: document })),
    );
  await expect(getOrderOrigin(order(hash, 1))).resolves.toBe("app");
  await expect(getOrderOrigin(order(hash, 100))).resolves.toBe("app");
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch).toHaveBeenLastCalledWith(
    `https://api.cow.fi/xdai/api/v1/app_data/${hash}`,
    expect.any(Object),
  );
});

test.each([undefined, "0x", "0x1234", `0x${"zz".repeat(32)}`])(
  "does not fetch missing or invalid hashes: %s",
  async (hash) => {
    const fetch = jest.spyOn(global, "fetch");
    await expect(getOrderOrigin(order(hash as Hex | undefined))).resolves.toBe(
      "unknown",
    );
    expect(fetch).not.toHaveBeenCalled();
  },
);

test.each([
  () => new Response("missing", { status: 404 }),
  () => new Response("failed", { status: 503 }),
  () => new Response("not json"),
  () => new Response(JSON.stringify({})),
  () => new Response(JSON.stringify({ fullAppData: {} })),
  () =>
    new Response(
      JSON.stringify({ fullAppData: documentFor({ appCode: "another-app" }) }),
    ),
  () => {
    throw new Error("offline");
  },
])("keeps lookup failures unknown and deduplicated", async (response) => {
  const hash = hashDocument(uniqueDocument());
  const fetch = jest
    .spyOn(global, "fetch")
    .mockImplementation(async () => response());
  await expect(getOrderOrigin(order(hash))).resolves.toBe("unknown");
  await expect(getOrderOrigin(order(hash))).resolves.toBe("unknown");
  expect(fetch).toHaveBeenCalledTimes(1);
});

test.each<[Record<string, unknown>, OrderOrigin]>([
  [{ appCode: "another-app" }, "other"],
  [{}, "unknown"],
])(
  "classifies fetched documents without assuming app origin: %j",
  async (fields, expected) => {
    const document = documentFor(fields) + " ".repeat(++caseId);
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ fullAppData: document })),
      );
    await expect(getOrderOrigin(order(hashDocument(document)))).resolves.toBe(
      expected,
    );
  },
);

test.each([true, false])(
  "exposes app data without adding requests or failing chain loading (valid: %s)",
  async (valid) => {
    const hash = hashDocument(uniqueDocument());
    const staticInput = valid
      ? encodeAbiParameters(stopLossDataStructure, [
          wallet,
          wallet,
          BigInt(1),
          BigInt(1),
          hash,
          wallet,
          true,
          false,
          2_000_000_000,
          wallet,
          wallet,
          BigInt(1),
          3600,
        ])
      : "0x1234";
    const page = (items: unknown[]) => ({
      items,
      pageInfo: { hasNextPage: false, endCursor: null },
    });
    const fetch = jest
      .spyOn(global, "fetch")
      .mockImplementation(async (_url, init) => {
        const { query } = JSON.parse(String(init?.body));
        const data = query.includes("ownerMappings")
          ? { ownerMappings: page([]) }
          : {
              conditionalOrderGenerators: page([
                {
                  eventId: "parent",
                  chainId: 1,
                  owner: wallet,
                  resolvedOwner: wallet,
                  handler: "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
                  orderType: "StopLoss",
                  status: "Active",
                  hash: "0xparent",
                  staticInput,
                  decodedParams: {
                    receiver: wallet,
                    sellToken: wallet,
                    buyToken: wallet,
                    sellAmount: "1",
                    buyAmount: "1",
                    validTo: 2_000_000_000,
                    strike: "1",
                    isPartiallyFillable: false,
                    isSellOrder: true,
                    sellTokenPriceOracle: wallet,
                    buyTokenPriceOracle: wallet,
                    maxTimeSinceLastOracleUpdate: 3600,
                  },
                  discreteOrders: { items: [] },
                  transaction: null,
                },
              ]),
            };
        return new Response(JSON.stringify({ data }));
      });
    const result = await loadStopLossOrders({ account: wallet, chainIds: [1] });
    expect(result.chains[0].status).toBe("success");
    expect(result.chains[0].orders[0].appData).toBe(valid ? hash : undefined);
    expect(fetch).toHaveBeenCalledTimes(2);
  },
);
