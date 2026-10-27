const assert = require("node:assert/strict");
const {
  encodeAbiParameters,
  parseAbiParameters,
  toFunctionSelector,
  encodeFunctionResult,
  decodeFunctionData,
  multicall3Abi,
} = require("viem");
const chains = require("viem/chains");
const catalog = require("../../../src/lib/tokenCatalogData.json");

const NOW = Date.parse("2026-10-26T12:00:00Z");
const ACCOUNT = "0x1111111111111111111111111111111111111111";
const FACTORY = "0x3333333333333333333333333333333333333333";
const OWNER = "0x4444444444444444444444444444444444444444";
const COMPOSABLE = "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74";
const endpoints = [
  [1, "ethereum", "https://ethereum-rpc.publicnode.com"],
  [100, "gnosis", chains.gnosis.rpcUrls.default.http[0]],
  [42161, "arbitrum", chains.arbitrum.rpcUrls.default.http[0]],
  [8453, "base", chains.base.rpcUrls.default.http[0]],
  [137, "polygon", "https://polygon-bor-rpc.publicnode.com"],
  [43114, "avalanche", chains.avalanche.rpcUrls.default.http[0]],
  [56, "bsc", "https://bsc-dataseed1.bnbchain.org"],
  [59144, "linea", chains.linea.rpcUrls.default.http[0]],
  [9745, "plasma", "https://rpc.plasma.to"],
  [11155111, "sepolia", chains.sepolia.rpcUrls.default.http[0]],
].map(([id, network, url]) => ({ id, network, url: new URL(url) }));
const encoded = (type, value) =>
  encodeAbiParameters(parseAbiParameters(type), [value]);
const word = (value) => encoded("uint256", BigInt(value));

const READ_QUERIES = {
  CowShedOwners: `
    query CowShedOwners($chain: Int!, $wallet: String!, $after: String) {
      ownerMappings(
        where: { chainId: $chain, owner: $wallet, addressType: cowshed_proxy }
        limit: 50, after: $after
      ) {
        items { chainId address owner addressType }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
  StopLossOrders: `
    query StopLossOrders($chain: Int!, $wallet: String!, $handler: String!, $owners: [String!]!, $after: String) {
      conditionalOrderGenerators(
        where: {
          chainId: $chain, handler: $handler, orderType: StopLoss
          OR: [{ owner_in: $owners }, { resolvedOwner: $wallet }]
        }
        limit: 50, after: $after
      ) {
        items {
          eventId chainId owner resolvedOwner handler orderType status hash salt staticInput decodedParams
          transaction { hash blockTimestamp }
          discreteOrders(limit: 1) {
            items { orderUid status validTo executedSellAmount executedBuyAmount executedFee }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
  StopLossFunding: `
    query StopLossFunding($chain: Int!, $wallet: String!, $handler: String!, $owners: [String!]!, $after: String) {
      conditionalOrderGenerators(
        where: {
          chainId: $chain, handler: $handler, orderType: StopLoss
          OR: [{ owner_in: $owners }, { resolvedOwner: $wallet }]
        }
        limit: 50, after: $after
      ) {
        items { chainId owner resolvedOwner handler orderType salt hash staticInput }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
};
const normalizedQuery = (query) => query.replace(/\s+/g, " ").trim();

const ORDER_EVENT_ID = "demo-stop-loss";
const ORDER_VALID_TO = Date.parse("2026-11-25T12:00:00Z") / 1000;

function conclusionOrder(state) {
  return {
    eventId: ORDER_EVENT_ID,
    chainId: 1,
    owner: ACCOUNT,
    resolvedOwner: ACCOUNT,
    handler: "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
    orderType: "StopLoss",
    status: "Active",
    hash: "0x" + "ab".repeat(32),
    salt: "0x" + "cd".repeat(32),
    staticInput: "0x1234",
    transaction: null,
    decodedParams: {
      receiver: ACCOUNT,
      sellToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      buyToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      sellAmount: "100000000000000000",
      buyAmount: "297000000",
      strike: "3000000000000000000000",
      validTo: ORDER_VALID_TO,
      isSellOrder: true,
      isPartiallyFillable: false,
      sellTokenPriceOracle: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",
      buyTokenPriceOracle: "0x8fffffd4afb6115b954bd326cbe7b4ba576818f6",
      maxTimeSinceLastOracleUpdate: 3600,
    },
    discreteOrders: {
      items:
        state === "filled"
          ? [
              {
                orderUid:
                  "0x" +
                  "ab".repeat(32) +
                  ACCOUNT.slice(2) +
                  ORDER_VALID_TO.toString(16),
                status: "fulfilled",
                validTo: ORDER_VALID_TO,
                executedSellAmount: "100000000000000000",
                executedBuyAmount: "300000000",
                executedFee: "0",
              },
            ]
          : [],
    },
  };
}

function createServices(audit, { orderState = "empty" } = {}) {
  assert(["empty", "open", "trigger-reached", "filled"].includes(orderState));
  const wethUsd = ["trigger-reached", "filled"].includes(orderState)
    ? 3000n
    : 3500n;
  function call(id, target, data) {
    const to = target.toLowerCase();
    const sig = data.slice(0, 10);
    const is = (signature) => sig === toFunctionSelector(signature);
    if (is("aggregate3((address,bool,bytes)[])")) {
      const decoded = decodeFunctionData({ abi: multicall3Abi, data });
      return encodeFunctionResult({
        abi: multicall3Abi,
        functionName: "aggregate3",
        result: decoded.args[0].map((item) => ({
          success: true,
          returnData: call(id, item.target, item.callData),
        })),
      });
    }
    if (is("COW_SHED_FACTORY()") || is("trustedExecutor()"))
      return encoded("address", FACTORY);
    if (is("proxyOf(address)")) return encoded("address", OWNER);
    if (is("COMPOSABLE_COW()") || is("domainVerifiers(address)"))
      return encoded("address", COMPOSABLE);
    if (
      to === "0xeeeeeeee14d718c2b47d9923deab1335e144eeee" &&
      is("reverseWithGateways(bytes,uint256,string[])")
    )
      return encodeAbiParameters(parseAbiParameters("string,address,address"), [
        "",
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
      ]);
    if (is("domainSeparator()")) return "0x" + "11".repeat(32);
    if (
      to === "0xca11bde05977b3631167028862be2a173976ca11" &&
      is("getEthBalance(address)")
    )
      return word(0);
    if (
      to === "0xca11bde05977b3631167028862be2a173976ca11" &&
      is("getCurrentBlockTimestamp()")
    )
      return word(NOW / 1000);
    if (
      orderState !== "empty" &&
      id === 1 &&
      to === COMPOSABLE.toLowerCase() &&
      is("singleOrders(address,bytes32)")
    )
      return encoded("bool", true);
    if (
      orderState !== "empty" &&
      id === 1 &&
      to === "0xd8088f0d57db91ac6404fb3a9723a890100a6bb3" &&
      is("schedules(bytes32)")
    )
      return encodeAbiParameters(
        parseAbiParameters("address,uint96,address,address,bytes32,bytes"),
        [
          "0x0000000000000000000000000000000000000000",
          0n,
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000",
          "0x" + "00".repeat(32),
          "0x",
        ],
      );
    if (is("allowance(address,address)")) return word(0);
    const tokens = catalog.tokens.filter((token) => token.chainId === id);
    const token = tokens.find((token) => token.address.toLowerCase() === to);
    let feed;
    let feedToken;
    let quote;
    for (const item of tokens)
      for (const [currency, proxy] of Object.entries(item.oracles || {})) {
        if (proxy.toLowerCase() === to) {
          feed = item.oracleApprovals[currency];
          feedToken = item;
          quote = currency;
        }
      }
    if (is("balanceOf(address)") && token)
      return word(
        (token.symbol === "WETH" ? 2n : 100n) * 10n ** BigInt(token.decimals),
      );
    if (is("decimals()") && (feed || token))
      return word(feed ? feed.expectedDecimals : token.decimals);
    if (is("description()") && feed?.expectedDescription)
      return encoded("string", feed.expectedDescription);
    if (is("symbol()") && token) return encoded("string", token.symbol);
    if (is("name()") && token)
      return encoded("string", token.name || token.symbol);
    if (is("latestRoundData()") && feed) {
      const prices = { WETH: wethUsd, LINK: 15n, UNI: 8n };
      let price = prices[feedToken.symbol] || 1n;
      if (quote === "ETH")
        price =
          feedToken.symbol === "WETH"
            ? 10n ** BigInt(feed.expectedDecimals)
            : 10n ** BigInt(feed.expectedDecimals) / 3500n;
      else price *= 10n ** BigInt(feed.expectedDecimals);
      const updatedAt = BigInt(NOW / 1000 - 30);
      audit.feedReads.push({
        chainId: id,
        proxy: to,
        symbol: feedToken.symbol,
        quote,
        answer: price.toString(),
      });
      return encodeAbiParameters(
        parseAbiParameters("uint80,int256,uint256,uint256,uint80"),
        [1n, price, updatedAt, updatedAt, 1n],
      );
    }
    throw new Error(`Unmocked contract read ${id} ${to} ${sig}`);
  }

  function rpc(id, request) {
    let result;
    switch (request.method) {
      case "eth_chainId":
        result = "0x" + id.toString(16);
        break;
      case "eth_blockNumber":
        result = "0x2000000";
        break;
      case "eth_getBlockByNumber":
        result = {
          number: "0x2000000",
          hash: "0x" + "ab".repeat(32),
          parentHash: "0x" + "cd".repeat(32),
          timestamp: "0x" + (NOW / 1000).toString(16),
          nonce: "0x0000000000000000",
          difficulty: "0x0",
          totalDifficulty: "0x0",
          extraData: "0x",
          gasLimit: "0x1c9c380",
          gasUsed: "0x0",
          miner: FACTORY,
          mixHash: "0x" + "00".repeat(32),
          receiptsRoot: "0x" + "00".repeat(32),
          sha3Uncles: "0x" + "00".repeat(32),
          stateRoot: "0x" + "00".repeat(32),
          transactionsRoot: "0x" + "00".repeat(32),
          transactions: [],
          uncles: [],
          logsBloom: "0x" + "00".repeat(256),
          size: "0x1",
          baseFeePerGas: "0x1",
        };
        break;
      case "eth_getCode":
        result = "0x60006000";
        break;
      case "eth_getBalance":
        result = "0x1bc16d674ec80000";
        break;
      case "eth_call":
        result = call(id, request.params[0].to, request.params[0].data);
        break;
      default:
        throw new Error(`Blocked RPC method ${request.method}`);
    }
    return { jsonrpc: "2.0", id: request.id, result };
  }

  return async function intercept(route, appOrigin) {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    let body;
    try {
      body = JSON.parse(request.postData() || "null");
    } catch {}
    const reply = (value) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(value),
      });
    const endpoint = endpoints.find(
      (item) =>
        item.url.origin === url.origin && item.url.pathname === url.pathname,
    );
    try {
      if (
        endpoint &&
        method === "POST" &&
        (body?.jsonrpc || Array.isArray(body))
      ) {
        audit.rpcRequests += Array.isArray(body) ? body.length : 1;
        return reply(
          Array.isArray(body)
            ? body.map((item) => rpc(endpoint.id, item))
            : rpc(endpoint.id, body),
        );
      }
      if (
        url.href === "https://programmatic-orders.cow.fi/graphql" &&
        method === "POST" &&
        body?.query
      ) {
        assert.equal(typeof body.query, "string", "Unknown GraphQL document");
        const operation = Object.entries(READ_QUERIES).find(
          ([, query]) => normalizedQuery(query) === normalizedQuery(body.query),
        )?.[0];
        assert(operation, "Blocked unknown GraphQL document");
        assert(
          body.operationName === undefined || body.operationName === operation,
          "Blocked unexpected GraphQL operationName",
        );
        const field =
          operation === "CowShedOwners"
            ? "ownerMappings"
            : "conditionalOrderGenerators";
        audit.graphqlRequests++;
        return reply({
          data: {
            [field]: {
              items:
                field === "conditionalOrderGenerators" &&
                orderState !== "empty" &&
                body.variables?.chain === 1 &&
                body.variables?.wallet?.toLowerCase() === ACCOUNT &&
                body.variables?.handler?.toLowerCase() ===
                  "0x412c36e5011cd2517016d243a2dfb37f73a242e7"
                  ? [conclusionOrder(orderState)]
                  : [],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        });
      }
      if (
        url.origin === "https://bff.cow.fi" &&
        /^\/1\/markets\/0x[\da-f]+-0x[\da-f]+\/slippageTolerance$/i.test(
          url.pathname,
        ) &&
        method === "GET"
      ) {
        audit.slippageRequests++;
        return reply({ slippageBps: 100 });
      }
      if (
        url.origin === "https://api.cow.fi" &&
        url.pathname === "/mainnet/api/v1/quote" &&
        method === "POST"
      ) {
        assert.equal(
          body.sellToken.toLowerCase(),
          "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        );
        assert.equal(
          body.buyToken.toLowerCase(),
          "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        );
        audit.quoteRequests++;
        return reply({
          quote: {
            buyAmount: (
              (BigInt(body.sellAmountBeforeFee) * wethUsd) /
              10n ** 12n
            ).toString(),
          },
        });
      }
      if (
        url.origin === "https://api.cow.fi" &&
        /^\/mainnet\/api\/v1\/app_data\/0x[\da-f]{64}$/i.test(url.pathname) &&
        method === "PUT"
      ) {
        audit.appData.push({ url: url.href, body });
        return reply(url.pathname.split("/").pop());
      }
      if (
        url.origin === appOrigin &&
        url.pathname === "/__nextjs_original-stack-frames" &&
        method === "POST"
      )
        return route.continue();
      if (url.origin === appOrigin && method === "GET") return route.continue();
      throw new Error(
        `Blocked unexpected service ${method} ${url.origin}${url.pathname}`,
      );
    } catch (error) {
      audit.blocked.push(error.message);
      await route.abort("blockedbyclient");
    }
  };
}

function injectWallet() {
  const listeners = {};
  const provider = {
    chainId: "0x1",
    accounts: [],
    calls: [],
    on(event, fn) {
      (listeners[event] ??= []).push(fn);
      return provider;
    },
    removeListener(event, fn) {
      listeners[event] = (listeners[event] ?? []).filter((item) => item !== fn);
      return provider;
    },
    async request({ method, params }) {
      const call = { method, params };
      provider.calls.push(call);
      if (window.__captureWalletCall) await window.__captureWalletCall(call);
      if (/sign|send|transaction/i.test(method))
        throw new Error("Signing and transactions blocked by capture fixture");
      if (method === "eth_requestAccounts") {
        provider.accounts = ["0x1111111111111111111111111111111111111111"];
        return provider.accounts;
      }
      if (method === "eth_accounts") return provider.accounts;
      if (method === "eth_chainId") return provider.chainId;
      if (
        method === "wallet_requestPermissions" ||
        method === "wallet_getPermissions"
      )
        return [{ parentCapability: "eth_accounts" }];
      if (method === "wallet_revokePermissions") return null;
      throw new Error(`Blocked wallet method ${method}`);
    },
  };
  Object.defineProperty(window, "ethereum", {
    value: provider,
    writable: false,
  });
}

module.exports = {
  NOW,
  ACCOUNT,
  ORDER_EVENT_ID,
  READ_QUERIES,
  createServices,
  injectWallet,
};
