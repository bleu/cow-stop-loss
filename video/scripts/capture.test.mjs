import test from "node:test";
import assert from "node:assert/strict";
import {
  encodeFunctionData,
  decodeFunctionResult,
  multicall3Abi,
  erc20Abi,
  decodeAbiParameters,
  parseAbiParameters,
  toFunctionSelector,
  encodeAbiParameters,
} from "viem";
import {
  createServices,
  injectWallet,
  NOW,
  READ_QUERIES,
} from "./fixtures/services.cjs";
import { auditWallet, finalizeCapture } from "./capture-safety.cjs";

function fixture(options) {
  const audit = {
    rpcRequests: 0,
    graphqlRequests: 0,
    quoteRequests: 0,
    slippageRequests: 0,
    appData: [],
    feedReads: [],
    blocked: [],
    pageErrors: [],
    consoleErrors: [],
    walletCalls: [],
  };
  return { audit, intercept: createServices(audit, options) };
}
function route(url, method, body) {
  return {
    outcome: null,
    request: () => ({
      url: () => url,
      method: () => method,
      postData: () => JSON.stringify(body),
    }),
    async fulfill(response) {
      this.outcome = { type: "fulfill", response };
    },
    async abort(reason) {
      this.outcome = { type: "abort", reason };
    },
    async continue() {
      this.outcome = { type: "continue" };
    },
  };
}

test("unknown services and local writes fail closed", async () => {
  const { audit, intercept } = fixture();
  for (const [url, method] of [
    ["https://unknown.example/rpc", "POST"],
    ["http://127.0.0.1:3157/api/orders", "POST"],
  ]) {
    const request = route(url, method, {
      jsonrpc: "2.0",
      method: "eth_chainId",
    });
    await intercept(request, "http://127.0.0.1:3157");
    assert.equal(request.outcome.type, "abort");
  }
  assert.equal(audit.blocked.length, 2);
});

test("RPC writes and unknown reads fail closed", async () => {
  const { audit, intercept } = fixture();
  for (const method of [
    "eth_sendTransaction",
    "eth_sendRawTransaction",
    "personal_sign",
    "eth_unknown",
  ]) {
    const request = route("https://ethereum-rpc.publicnode.com", "POST", {
      jsonrpc: "2.0",
      id: 1,
      method,
    });
    await intercept(request, "http://127.0.0.1:3157");
    assert.equal(request.outcome.type, "abort");
  }
  assert.equal(audit.blocked.length, 4);
});

test("fixture block permits Multicall3 and returns synthetic WETH balance", async () => {
  const { intercept, audit } = fixture();
  const block = route("https://ethereum-rpc.publicnode.com", "POST", {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBlockByNumber",
    params: ["latest", false],
  });
  await intercept(block, "http://127.0.0.1:3157");
  const result = JSON.parse(block.outcome.response.body).result;
  assert(BigInt(result.number) >= 14353601n);
  assert.equal(BigInt(result.timestamp), BigInt(NOW / 1000));
  const data = encodeFunctionData({
    abi: multicall3Abi,
    functionName: "aggregate3",
    args: [
      [
        {
          target: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          allowFailure: true,
          callData: encodeFunctionData({
            abi: erc20Abi,
            functionName: "balanceOf",
            args: ["0x1111111111111111111111111111111111111111"],
          }),
        },
      ],
    ],
  });
  const balance = route("https://ethereum-rpc.publicnode.com", "POST", {
    jsonrpc: "2.0",
    id: 2,
    method: "eth_call",
    params: [
      { to: "0xca11bde05977b3631167028862be2a173976ca11", data },
      result.number,
    ],
  });
  await intercept(balance, "http://127.0.0.1:3157");
  const rows = decodeFunctionResult({
    abi: multicall3Abi,
    functionName: "aggregate3",
    data: JSON.parse(balance.outcome.response.body).result,
  });
  assert.equal(rows[0].success, true);
  assert.equal(
    decodeFunctionResult({
      abi: erc20Abi,
      functionName: "balanceOf",
      data: rows[0].returnData,
    }),
    2n * 10n ** 18n,
  );
  assert.deepEqual(audit.blocked, []);
});

test("injected wallet blocks all signatures and transactions", async () => {
  global.window = {};
  injectWallet();
  for (const method of [
    "personal_sign",
    "eth_signTypedData_v4",
    "eth_sendTransaction",
    "eth_sendRawTransaction",
    "wallet_sendCalls",
  ]) {
    await assert.rejects(window.ethereum.request({ method }), /blocked/);
  }
  assert.deepEqual(
    await window.ethereum.request({ method: "eth_requestAccounts" }),
    ["0x1111111111111111111111111111111111111111"],
  );
  await assert.rejects(
    window.ethereum.request({ method: "wallet_switchEthereumChain" }),
    /Blocked/,
  );
  delete global.window;
});

const graphql = "https://programmatic-orders.cow.fi/graphql";
const origin = "http://127.0.0.1:3157";
const variables = {
  chain: 1,
  wallet: "0x1111111111111111111111111111111111111111",
  handler: "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
};
const query = READ_QUERIES.StopLossOrders;

for (const orderState of ["empty", "open", "trigger-reached", "filled"]) {
  test(`${orderState}: orders are scoped to Ethereum and the fixture account`, async () => {
    const { intercept, audit } = fixture({ orderState });
    for (const scope of [
      variables,
      { ...variables, chain: 100 },
      { ...variables, wallet: "0x2222222222222222222222222222222222222222" },
      { ...variables, handler: "0x2222222222222222222222222222222222222222" },
    ]) {
      const request = route(graphql, "POST", { query, variables: scope });
      await intercept(request, origin);
      assert.equal(request.outcome.type, "fulfill");
      const result = JSON.parse(request.outcome.response.body).data
        .conditionalOrderGenerators;
      assert.equal(
        result.items.length,
        scope === variables && orderState !== "empty" ? 1 : 0,
      );
      if (result.items.length) {
        const parent = result.items[0];
        assert.equal(parent.status, "Active");
        assert.equal(parent.transaction, null);
        assert.equal(parent.owner, variables.wallet);
        assert.equal(parent.resolvedOwner, variables.wallet);
        assert.equal(parent.decodedParams.sellAmount, "100000000000000000");
        assert.equal(parent.decodedParams.buyAmount, "297000000");
        assert.equal(parent.decodedParams.strike, "3000000000000000000000");
        assert.equal(
          parent.decodedParams.validTo,
          Date.parse("2026-11-25T12:00:00Z") / 1000,
        );
        assert(parent.decodedParams.validTo > NOW / 1000);
        assert.equal(
          parent.discreteOrders.items.length,
          orderState === "filled" ? 1 : 0,
        );
        if (orderState === "filled") {
          const child = parent.discreteOrders.items[0];
          assert.equal(child.status, "fulfilled");
          assert.equal(
            child.executedSellAmount,
            parent.decodedParams.sellAmount,
          );
          assert.equal(child.executedBuyAmount, "300000000");
          assert(
            BigInt(child.executedBuyAmount) >=
              BigInt(parent.decodedParams.buyAmount),
          );
          assert.equal(child.executedFee, "0");
        }
      }
    }
    const owners = route(graphql, "POST", {
      query: READ_QUERIES.CowShedOwners,
      variables,
    });
    await intercept(owners, origin);
    assert.deepEqual(
      JSON.parse(owners.outcome.response.body).data.ownerMappings.items,
      [],
    );
    assert.deepEqual(audit.blocked, []);
  });

  test(`${orderState}: market and quote agree; approval stays zero`, async () => {
    const { intercept } = fixture({ orderState });
    const request = route("https://ethereum-rpc.publicnode.com", "POST", {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        {
          to: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",
          data: toFunctionSelector("latestRoundData()"),
        },
        "latest",
      ],
    });
    await intercept(request, origin);
    const [, answer] = decodeAbiParameters(
      parseAbiParameters("uint80,int256,uint256,uint256,uint80"),
      JSON.parse(request.outcome.response.body).result,
    );
    const market = ["trigger-reached", "filled"].includes(orderState)
      ? 3000n
      : 3500n;
    assert.equal(answer, market * 10n ** 8n);
    const quote = route("https://api.cow.fi/mainnet/api/v1/quote", "POST", {
      sellToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      buyToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      sellAmountBeforeFee: "100000000000000000",
    });
    await intercept(quote, origin);
    assert.equal(
      JSON.parse(quote.outcome.response.body).quote.buyAmount,
      (market * 100000n).toString(),
    );
    const allowance = route("https://ethereum-rpc.publicnode.com", "POST", {
      jsonrpc: "2.0",
      id: 2,
      method: "eth_call",
      params: [
        {
          to: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "allowance",
            args: [
              variables.wallet,
              "0xc92e8bdf79f0507f65a392b0ab4667716bfe0110",
            ],
          }),
        },
        "latest",
      ],
    });
    await intercept(allowance, origin);
    assert.equal(
      BigInt(JSON.parse(allowance.outcome.response.body).result),
      0n,
    );
  });

  test(`${orderState}: service writes, RPC writes, mutations and explorers stay blocked`, async () => {
    const { intercept, audit } = fixture({ orderState });
    const requests = [
      route("https://ethereum-rpc.publicnode.com", "POST", {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendRawTransaction",
        params: ["0x00"],
      }),
      route("https://api.cow.fi/mainnet/api/v1/orders", "POST", {}),
      route("https://api.cow.fi/mainnet/api/v1/orders/example", "DELETE", {}),
      route("https://unknown.example/orders", "GET"),
      route("https://explorer.cow.fi/orders/synthetic", "GET"),
      route("https://etherscan.io/tx/synthetic", "GET"),
      route(graphql, "POST", {
        query: "mutation { conditionalOrderGenerators { items { eventId } } }",
      }),
      route(graphql, "POST", {
        query:
          "query Unknown { conditionalOrderGenerators { items { eventId } } }",
      }),
    ];
    for (const request of requests) {
      await intercept(request, origin);
      assert.equal(request.outcome.type, "abort");
    }
    assert.equal(audit.blocked.length, requests.length);
  });
}

test("conclusion warm-up reads return an active direct order and no Poller schedule", async () => {
  const { intercept, audit } = fixture({ orderState: "open" });
  const rpc = "https://ethereum-rpc.publicnode.com";
  const hash = "0x" + "ab".repeat(32);
  const requests = [
    {
      to: "0xfdafc9d1902f4e0b84f65f49f244b32b31013b74",
      data:
        toFunctionSelector("singleOrders(address,bytes32)") +
        encodeAbiParameters(parseAbiParameters("address,bytes32"), [
          variables.wallet,
          hash,
        ]).slice(2),
    },
    {
      to: "0xd8088f0d57db91ac6404fb3a9723a890100a6bb3",
      data: toFunctionSelector("schedules(bytes32)") + hash.slice(2),
    },
  ];
  for (const [index, params] of requests.entries()) {
    const request = route(rpc, "POST", {
      jsonrpc: "2.0",
      id: index,
      method: "eth_call",
      params: [params, "latest"],
    });
    await intercept(request, origin);
    assert.equal(request.outcome.type, "fulfill");
    const result = JSON.parse(request.outcome.response.body).result;
    if (index === 0)
      assert.deepEqual(
        decodeAbiParameters(parseAbiParameters("bool"), result),
        [true],
      );
    else
      assert.deepEqual(
        decodeAbiParameters(
          parseAbiParameters("address,uint96,address,address,bytes32,bytes"),
          result,
        ),
        [
          "0x0000000000000000000000000000000000000000",
          0n,
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000",
          "0x" + "00".repeat(32),
          "0x",
        ],
      );
  }
  assert.deepEqual(audit.blocked, []);
  for (const params of requests) {
    const wrongTarget = route(rpc, "POST", {
      jsonrpc: "2.0",
      id: 3,
      method: "eth_call",
      params: [{ ...params, to: variables.wallet }, "latest"],
    });
    await intercept(wrongTarget, origin);
    assert.equal(wrongTarget.outcome.type, "abort");
  }
});

test("GraphQL permits only complete known read documents and matching operation names", async () => {
  const { intercept, audit } = fixture({ orderState: "open" });
  for (const [operationName, query] of Object.entries(READ_QUERIES)) {
    for (const selected of [undefined, operationName]) {
      const request = route(graphql, "POST", {
        query,
        operationName: selected,
        variables,
      });
      await intercept(request, origin);
      assert.equal(request.outcome.type, "fulfill");
    }
  }
  assert.deepEqual(audit.blocked, []);
  const documents = [
    {
      operationName: "WriteOrders",
      query:
        'query StopLossOrders($chain: Int!) { conditionalOrderGenerators { items { eventId } } } mutation WriteOrders { deleteOrder(id: "demo-stop-loss") }',
    },
    {
      operationName: "WriteOrders",
      query:
        query + ' mutation WriteOrders { deleteOrder(id: "demo-stop-loss") }',
    },
    {
      operationName: "StopLossOrders",
      query:
        query + ' mutation WriteOrders { deleteOrder(id: "demo-stop-loss") }',
    },
    {
      query:
        query +
        " subscription Watch { conditionalOrderGenerators { items { eventId } } }",
    },
    { query: query + READ_QUERIES.CowShedOwners },
    { query, operationName: "WriteOrders" },
    { query, operationName: null },
    { query: query.replace("items {", "items { unknownField ") },
  ];
  for (const document of documents) {
    const request = route(graphql, "POST", { ...document, variables });
    await intercept(request, origin);
    assert.equal(request.outcome.type, "abort");
  }
  assert.equal(audit.blocked.length, documents.length);
});

for (const [name, violate] of [
  [
    "wallet call",
    (audit) =>
      audit.walletCalls.push({ scene: "form", method: "eth_sendTransaction" }),
  ],
  [
    "conclusion wallet call",
    (audit) =>
      audit.walletCalls.push({ scene: "filled", method: "personal_sign" }),
  ],
  ["page error", (audit) => audit.pageErrors.push("Late page failure")],
  ["blocked request", (audit) => audit.blocked.push("Late unexpected service")],
  [
    "console error",
    (audit) => audit.consoleErrors.push("Late console failure"),
  ],
]) {
  test(`final audit rejects a late ${name} during shutdown`, async () => {
    const { audit } = fixture();
    const metadata = { passed: true };
    let stopped = false;
    await assert.rejects(
      finalizeCapture({
        audit,
        metadata,
        completed: true,
        stop: async () => {
          assert.equal(metadata.passed, false);
          await new Promise((resolve) => setImmediate(resolve));
          violate(audit);
          stopped = true;
        },
      }),
    );
    assert(stopped);
    assert.equal(metadata.passed, false);
  });
}

test("wallet audit retains calls from every scene through shutdown", async () => {
  const { audit } = fixture();
  const callbacks = [];
  for (const scene of ["form", "open", "trigger-reached", "filled"]) {
    await auditWallet(
      {
        exposeBinding: async (name, callback) => {
          assert.equal(name, "__captureWalletCall");
          callbacks.push(callback);
        },
      },
      audit,
      scene,
    );
  }
  global.window = { __captureWalletCall: (call) => callbacks[3](null, call) };
  try {
    injectWallet();
    await assert.rejects(
      window.ethereum.request({ method: "personal_sign" }),
      /blocked/,
    );
    assert.equal(audit.walletCalls[0].scene, "filled");
    assert.equal(audit.walletCalls[0].method, "personal_sign");
  } finally {
    delete global.window;
  }
  audit.walletCalls = [];
  const metadata = {};
  await finalizeCapture({
    audit,
    metadata,
    completed: true,
    stop: async () => {
      for (const callback of callbacks)
        await callback(null, { method: "eth_accounts" });
      assert.equal(metadata.passed, false);
    },
  });
  assert.equal(metadata.passed, true);
  assert.deepEqual(
    audit.walletCalls.map(({ scene }) => scene),
    ["form", "open", "trigger-reached", "filled"],
  );
});

test("failed shutdown cannot mark a capture passed", async () => {
  const { audit } = fixture();
  const metadata = { passed: true };
  await assert.rejects(
    finalizeCapture({
      audit,
      metadata,
      completed: true,
      stop: async () => {
        throw new Error("Shutdown failed");
      },
    }),
    /Shutdown failed/,
  );
  assert.equal(metadata.passed, false);
});

test("unknown fixture states fail closed", () => {
  assert.throws(() => fixture({ orderState: "placed" }));
});
