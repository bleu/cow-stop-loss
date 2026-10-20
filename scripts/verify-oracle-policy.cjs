const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const {
  encodeAbiParameters,
  parseAbiParameters,
  toFunctionSelector,
  encodeFunctionResult,
  decodeFunctionData,
  multicall3Abi,
} = require("viem");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const path = require("node:path");
const catalog = require("../src/lib/tokenCatalogData.json");
const appUrl = process.env.APP_URL || "http://localhost:3001/app";
const chains = require("viem/chains");
const rpcNetworks = [
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
].map(([id, network, fallback]) => [id, network, new URL(fallback)]);

function rpcNetwork(url, fallback) {
  return (
    rpcNetworks.find(
      ([, network, rpcUrl]) =>
        (rpcUrl.origin === url.origin && rpcUrl.pathname === url.pathname) ||
        (url.origin === "https://lb.drpc.live" &&
          url.pathname.split("/")[1] === network),
    )?.[0] ?? fallback
  );
}
const networks = [
  {
    id: 1,
    name: "Ethereum",
    sells: [
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "0x514910771af9ca656af840dff83e8264ecf986ca",
      "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
      "0xc00e94cb662c3520282e6f5717214004a7f26888",
      "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
    ],
    buy: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  {
    id: 100,
    name: "Gnosis",
    sells: [
      "0x9c58bacc331c9aa871afd802db6379a98e80cedb",
      "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
      "0xe2e73a1c69ecf83f464efce6a5be353a37ca09b2",
      "0xdf613af6b44a31299e48131e9347f034347e2f00",
      "0x4537e328bf7e4efa29d05caea260d7fe26af9d74",
      "0xdf6ff92bfdc1e8be45177dc1f4845d391d3ad8fd",
    ],
    buy: "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
  },
  {
    id: 42161,
    name: "Arbitrum",
    sells: [
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      "0x912ce59144191c1204e64559fe8253a0e49e6548",
      "0xf97f4df75117a78c1a5a0dbb814af92458539fb4",
      "0xba5ddd1f9d7f570dc94a51479a000e3bce967196",
      "0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0",
      "0x354a6da3fcde098f8389cad84b0182725c6c91de",
      "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    ],
    buy: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  },
  {
    id: 8453,
    name: "Base",
    sells: [
      "0x4200000000000000000000000000000000000006",
      "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b",
      "0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196",
      "0x63706e401c06ac8513145b7687a14804d17f814b",
      "0x9e1028f5f1d5ede59748ffcee5532509976840e0",
    ],
    buy: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  },
  {
    id: 137,
    name: "Polygon",
    sells: [
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39",
      "0xd6df932a45c0f255f85145f286ea0b292b21c90b",
      "0xb33eaad8d922b1083446dc23f610c2567fb5180f",
      "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    ],
    buy: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  },
  {
    id: 43114,
    name: "Avalanche",
    sells: [
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
      "0x63a72806098bd3d9520cc43356dd78afe5d386d9",
      "0xc3048e19e76cb9a3aa9d77d8c03c29fc906e2437",
      "0x5947bb275c521040051d82396192181b413227a3",
      "0x8ebaf22b6f053dffeaf46f4dd9efa95d89ba8580",
      "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab",
      "0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd",
      "0x62edc0692bd897d2295872a9ffcac5425011c661",
    ],
    buy: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
  },
  {
    id: 56,
    name: "BNB",
    sells: [
      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
      "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
      "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
      "0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd",
      "0xbf5140a22578168fd562dccf235e5d43a02ce9b1",
      "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63",
      "0xfceb31a79f71ac9cbdcf853519c1b12d379edc46",
      "0xfb6115445bff7b52feb98650c87f44907e58f802",
      "0xaec945e04baf28b135fa7c640f624f8d90f1c3a6",
    ],
    buy: "0x55d398326f99059ff775485246999027b3197955",
  },
  {
    id: 59144,
    name: "Linea",
    sells: [
      "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f",
      "0xa18152629128738a5c081eb226335fed4b9c95e9",
      "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
    ],
    buy: "0x176211869ca2b568f2a7d4ee941e073a821ee1ff",
  },
  {
    id: 9745,
    name: "Plasma",
    sells: [
      "0x6100e367285b01f48d07953803a2d8dca5d19873",
      "0x76a443768a5e3b8d1aed0105fc250877841deb40",
      "0x9895d81bb462a195b4922ed7de0e3acd007c32cb",
      "0xa3d68b74bf0528fdd07263c60d6488749044914b",
    ],
    buy: "0x2d661c89d812261039af9764eceaaee884f5f67f",
  },
  {
    id: 11155111,
    name: "Sepolia TEST",
    sells: ["0xfff9976782d46cc05630d1f6ebab18b2324d6b14"],
    buy: "0xbe72e441bf55620febc26715db68d3494213d8cb",
  },
];
const chainFilter = process.env.BROWSER_CHAIN_IDS;
const selectedIds =
  chainFilter === undefined
    ? networks.map(({ id }) => id)
    : chainFilter.split(",").map((value) => {
        const text = value.trim();
        assert(
          /^\d+$/.test(text),
          `Invalid BROWSER_CHAIN_IDS entry: ${JSON.stringify(value)}`,
        );
        const id = Number(text);
        assert(
          networks.some((network) => network.id === id),
          `Unsupported BROWSER_CHAIN_IDS entry: ${text}`,
        );
        return id;
      });
assert.equal(
  new Set(selectedIds).size,
  selectedIds.length,
  "BROWSER_CHAIN_IDS must not contain duplicate IDs",
);
const selectedNetworks = networks.filter(({ id }) => selectedIds.includes(id));
const selectedChainIds = selectedNetworks.map(({ id }) => id);
const testTokens = [
  {
    chainId: 11155111,
    address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
    symbol: "WETH",
    decimals: 18,
    oracles: { USD: "0x57cb700070cb1b0475e2d668fa8e89cf0dda9509" },
    oracleApprovals: { USD: { expectedDecimals: 8, maxAgeSeconds: 86400 } },
  },
  {
    chainId: 11155111,
    address: "0xbe72e441bf55620febc26715db68d3494213d8cb",
    symbol: "USDC (test)",
    decimals: 18,
    oracles: { USD: "0xed2d417d759b1e77fe6a8920c79ae4ce6d6930f7" },
    oracleApprovals: { USD: { expectedDecimals: 8, maxAgeSeconds: 86400 } },
  },
];
const output = process.env.BROWSER_REPORT_DIR || "/tmp";
const checks = [],
  errors = [],
  consoleErrors = [],
  appData = [],
  walletCalls = [],
  feedReads = [],
  limitations = [];
let phase = "startup",
  phaseTimer,
  runningBrowser;
function progress(message, timeout = 45000) {
  phase = message;
  console.log(`[oracle-policy ${new Date().toISOString()}] ${message}`);
  clearTimeout(phaseTimer);
  phaseTimer = setTimeout(async () => {
    const failure = `Phase timed out after ${timeout}ms: ${phase}`;
    console.error(failure);
    fs.writeFileSync(
      path.join(output, "cow-policy-browser-results.json"),
      JSON.stringify(
        {
          passed: false,
          failure,
          phase,
          selectedChainIds,
          checks,
          limitations,
          errors,
          consoleErrors,
          appData,
          walletCalls,
          feedReads,
        },
        null,
        2,
      ),
    );
    const stop = setTimeout(() => process.exit(1), 5000);
    try {
      await runningBrowser?.close();
    } catch {}
    clearTimeout(stop);
    process.exit(1);
  }, timeout);
}

async function screenshot(page, filename) {
  progress(`Screenshot ${filename}`);
  await page.screenshot({
    path: path.join(output, filename),
    fullPage: true,
    animations: "disabled",
    timeout: 10000,
  });
}
const factory = "0x3333333333333333333333333333333333333333";
const owner = "0x4444444444444444444444444444444444444444";
const composable = "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74";
const word = (n) =>
  encodeAbiParameters(parseAbiParameters("uint256"), [BigInt(n)]);
const address = (value) =>
  encodeAbiParameters(parseAbiParameters("address"), [value]);
const string = (value) =>
  encodeAbiParameters(parseAbiParameters("string"), [value]);
const selector = toFunctionSelector;

function tokensFor(id) {
  return id === 11155111
    ? testTokens
    : catalog.tokens.filter((item) => item.chainId === id);
}

function routeFor(sell, buy) {
  const quote = sell.oracles?.ETH && buy.oracles?.ETH ? "ETH" : "USD";
  const sellFeed = sell.oracles?.[quote],
    buyFeed = buy.oracles?.[quote];
  const sellApproval = sell.oracleApprovals?.[quote],
    buyApproval = buy.oracleApprovals?.[quote];
  assert(sellFeed && sellApproval, `Missing ${sell.symbol}/${quote} approval`);
  assert(buyFeed && buyApproval, `Missing ${buy.symbol}/${quote} approval`);
  return {
    quote,
    sellFeed,
    buyFeed,
    maxAgeSeconds: Math.max(
      sellApproval.maxAgeSeconds,
      buyApproval.maxAgeSeconds,
    ),
  };
}

function feedFor(id, to) {
  for (const token of tokensFor(id)) {
    for (const [quote, proxy] of Object.entries(token.oracles || {})) {
      if (proxy.toLowerCase() === to) {
        const approval = token.oracleApprovals?.[quote];
        assert(approval, `Missing approval for ${id} ${token.symbol}/${quote}`);
        return approval;
      }
    }
  }
}

function call(id, to, data) {
  to = to.toLowerCase();
  const sig = data.slice(0, 10);
  if (sig === selector("aggregate3((address,bool,bytes)[])")) {
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
  if (
    sig === selector("COW_SHED_FACTORY()") ||
    sig === selector("trustedExecutor()")
  )
    return address(factory);
  if (sig === selector("proxyOf(address)")) return address(owner);
  if (
    sig === selector("COMPOSABLE_COW()") ||
    sig === selector("domainVerifiers(address)")
  )
    return address(composable);
  if (sig === selector("domainSeparator()")) return "0x" + "11".repeat(32);
  if (sig === selector("allowance(address,address)")) return word(0);
  const token = tokensFor(id).find((item) => item.address.toLowerCase() === to);
  const feed = feedFor(id, to);
  if (sig === selector("balanceOf(address)") && token)
    return word(100n * 10n ** BigInt(token.decimals));
  if (sig === selector("decimals()") && (feed || token))
    return word(feed ? feed.expectedDecimals : token.decimals);
  if (sig === selector("description()") && feed?.expectedDescription)
    return string(feed.expectedDescription);
  if (sig === selector("symbol()") && token) return string(token.symbol);
  if (sig === selector("name()") && token)
    return string(token.name || token.symbol);
  if (sig === selector("latestRoundData()") && feed) {
    const age =
      feed.boundedPriceSuitability?.decision === "accepted-for-fixed-buy"
        ? Math.min(60000, Math.floor(feed.maxAgeSeconds / 2))
        : Math.min(60, Math.floor(feed.maxAgeSeconds / 2));
    assert(age >= 0 && age < feed.maxAgeSeconds);
    const updatedAt = BigInt(Math.floor(Date.now() / 1000) - age);
    feedReads.push({
      chainId: id,
      proxy: to,
      description: feed.expectedDescription,
      decimals: feed.expectedDecimals,
      ageSeconds: age,
      maxAgeSeconds: feed.maxAgeSeconds,
    });
    return encodeAbiParameters(
      parseAbiParameters("uint80,int256,uint256,uint256,uint80"),
      [1n, 10n ** BigInt(feed.expectedDecimals), updatedAt, updatedAt, 1n],
    );
  }
  throw new Error(`Unmocked read on ${id}: ${to} ${sig}`);
}

function rpc(id, request) {
  let result;
  if (request.method === "eth_blockNumber") result = "0x123456";
  else if (request.method === "eth_chainId") result = "0x" + id.toString(16);
  else if (request.method === "eth_getCode") result = "0x60006000";
  else if (request.method === "eth_getBalance") result = "0x56bc75e2d63100000";
  else if (request.method === "eth_getBlockByNumber")
    result = {
      number: "0x123456",
      hash: "0x" + "ab".repeat(32),
      parentHash: "0x" + "cd".repeat(32),
      timestamp: "0x" + Math.floor(Date.now() / 1000).toString(16),
      nonce: "0x0000000000000000",
      difficulty: "0x0",
      totalDifficulty: "0x0",
      extraData: "0x",
      gasLimit: "0x1c9c380",
      gasUsed: "0x0",
      miner: factory,
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
  else if (request.method === "eth_call") {
    try {
      result = call(id, request.params[0].to, request.params[0].data);
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32000, message: error.message },
      };
    }
  } else
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: -32000,
        message: "Unsupported fixture RPC " + request.method,
      },
    };
  return { jsonrpc: "2.0", id: request.id, result };
}

async function isolatedPage(browser, id) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
  });
  await context.addInitScript((chainId) => {
    const listeners = {};
    const provider = {
      chainId: "0x" + chainId.toString(16),
      accounts: [],
      calls: [],
      on(event, fn) {
        (listeners[event] ??= []).push(fn);
        return provider;
      },
      removeListener(event, fn) {
        listeners[event] = (listeners[event] ?? []).filter(
          (item) => item !== fn,
        );
        return provider;
      },
      emit(event, arg) {
        for (const fn of listeners[event] ?? []) fn(arg);
      },
      setAccount(value) {
        provider.accounts = [value];
        provider.emit("accountsChanged", provider.accounts);
      },
      async request({ method, params }) {
        provider.calls.push({ method, params });
        if (/sign|sendTransaction|sendRawTransaction|sendCalls/i.test(method))
          throw new Error("Signing and transactions blocked by fixture");
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
        if (
          method === "wallet_revokePermissions" ||
          method === "wallet_addEthereumChain"
        )
          return null;
        if (method === "wallet_switchEthereumChain") {
          provider.chainId = params[0].chainId;
          provider.emit("chainChanged", provider.chainId);
          return null;
        }
        throw new Error("Unexpected wallet method " + method);
      },
    };
    window.ethereum = provider;
  }, id);
  await context.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    let body;
    try {
      body = JSON.parse(request.postData() || "null");
    } catch {}
    // Intercept RPC and publication before allowing local app resources.
    if (request.method() === "PUT" && url.pathname.includes("/app_data/")) {
      appData.push({ chainId: id, url: request.url() });
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(url.pathname.split("/").pop()),
      });
    }
    if (body?.query) {
      const field = body.query.includes("ownerMappings")
        ? "ownerMappings"
        : "conditionalOrderGenerators";
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            [field]: {
              items: [],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        }),
      });
    }
    if (body?.jsonrpc || Array.isArray(body)) {
      const chainId = rpcNetwork(url, id);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          Array.isArray(body)
            ? body.map((item) => rpc(chainId, item))
            : rpc(chainId, body),
        ),
      });
    }
    if (url.origin === new URL(appUrl).origin) return route.continue();
    return route.abort("blockedbyclient");
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on("pageerror", (error) =>
    errors.push({ chainId: id, message: error.message }),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      consoleErrors.push({ chainId: id, message: message.text() });
  });
  return { context, page };
}

async function connect(page, id) {
  progress(`${id}: load app`, 150000);
  await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
  progress(`${id}: open wallet dialog`);
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click({ timeout: 30000 });
  progress(`${id}: select Browser wallet`);
  await page
    .getByRole("button", { name: "Browser wallet", exact: true })
    .click();
  progress(`${id}: wait for connected account`);
  await page
    .getByTitle("0x1111111111111111111111111111111111111111", { exact: true })
    .waitFor();
  progress(`${id}: check connected chain`);
  assert.equal(await page.evaluate(() => Number(window.ethereum.chainId)), id);
  assert.equal(
    await page.evaluate(
      () =>
        window.ethereum.calls.filter(
          (item) => item.method === "wallet_switchEthereumChain",
        ).length,
    ),
    0,
  );
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  progress(`Launch browser for chains ${selectedChainIds.join(",")}`);
  const browser = (runningBrowser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    timeout: 30000,
  }));
  let passed = false,
    failure,
    active;
  try {
    for (const network of selectedNetworks) {
      const { id, name, sells } = network;
      const tokens = tokensFor(id);
      const buy = tokens.find(
        (token) => token.address.toLowerCase() === network.buy,
      );
      assert(buy, `${name}: fixed buy missing`);
      if (id !== 11155111) {
        assert.equal(
          catalog.usdTokens[id].toLowerCase(),
          network.buy,
          `${name}: fixed buy changed`,
        );
        assert.equal(
          catalog.chains[id].status,
          "approved",
          `${name}: catalog not ready`,
        );
      }
      const sellTokens = sells.map((contract) => {
        const token = tokens.find(
          (item) => item.address.toLowerCase() === contract,
        );
        assert(token, `${name}: missing sell contract ${contract}`);
        routeFor(token, buy);
        return token;
      });
      assert(
        buy.oracles.USD && buy.oracleApprovals.USD,
        `${name}: missing fixed buy approval`,
      );
      progress(`${name}: create isolated context`);
      active = await isolatedPage(browser, id);
      const { page, context } = active;
      await connect(page, id);
      checks.push(
        `${name}: wallet connection preserves network without switching`,
      );
      progress(`${name}: check fixed buy`);
      const fixedBuy = page.locator('[data-side="buy"]');
      assert.equal(
        await fixedBuy.locator('[aria-disabled="true"]').innerText(),
        buy.symbol,
      );
      assert.equal(await fixedBuy.getByRole("button").count(), 0);
      assert(
        await fixedBuy
          .getByRole("textbox", { name: "Receive at least", exact: true })
          .isDisabled(),
      );
      for (const sell of sellTokens) {
        const route = routeFor(sell, buy);
        progress(`${name} ${sell.symbol}: select sell token`);
        await page.locator('[data-side="sell"] button').first().click();
        await page.getByPlaceholder("Search supported tokens").waitFor();
        assert.deepEqual(
          (await page.getByRole("option").allInnerTexts())
            .map((text) => text.trim())
            .sort(),
          sellTokens.map((token) => token.symbol).sort(),
        );
        await page
          .getByPlaceholder("Search supported tokens")
          .fill(sell.address);
        assert.equal(await page.getByRole("option").count(), 1);
        await page
          .getByRole("option", {
            name: `Token Logo ${sell.symbol}`,
            exact: true,
          })
          .click();
        await page
          .getByPlaceholder("Search supported tokens")
          .waitFor({ state: "hidden" });
        await page
          .getByRole("textbox", { name: "Sell amount", exact: true })
          .fill("1");
        await page
          .getByRole("textbox", { name: "Trigger price", exact: true })
          .fill("0.95");
        const before = appData.length;
        progress(
          `${name} ${sell.symbol}: prepare review with default settings`,
        );
        await page
          .getByRole("button", { name: "Review Stop Loss order", exact: true })
          .click();
        const panel = page.getByRole("region", {
          name: "Review stop-loss order",
          exact: true,
        });
        await panel.waitFor();
        const links = await panel
          .locator("a")
          .evaluateAll((items) => items.map((item) => item.href.toLowerCase()));
        for (const expected of [
          sell.address,
          buy.address,
          route.sellFeed,
          route.buyFeed,
        ]) {
          assert(
            links.some((value) => value.includes(expected.toLowerCase())),
            `${name} ${sell.symbol}: review missing ${expected}`,
          );
        }
        assert.equal(appData.length, before + 1);
        for (const proxy of [route.sellFeed, route.buyFeed])
          assert(
            feedReads.some(
              (read) =>
                read.chainId === id && read.proxy === proxy.toLowerCase(),
            ),
            `${name}: no round read for ${proxy}`,
          );
        checks.push(
          `${name} ${sell.symbol}/${buy.symbol}: exact picker, fixed buy, and default review feeds; publication intercepted`,
        );
        if (id === 1 && sell.symbol === "WETH")
          await screenshot(page, "cow-policy-ethereum-review.png");
        if (sell !== sellTokens.at(-1)) {
          await panel
            .getByRole("button", { name: "Edit order", exact: true })
            .click();
          if (sell.symbol === "WETH") {
            progress(
              `${name} ${sell.symbol}: inspect settings after default review`,
            );
            await page
              .getByRole("button", { name: "Order settings", exact: true })
              .click();
            const settings = page.getByRole("region", {
              name: "Order settings",
              exact: true,
            });
            assert.equal(
              await settings
                .getByRole("combobox", { name: "Expires", exact: true })
                .innerText(),
              "6 months (max)",
            );
            const maxAge = settings.getByRole("spinbutton", {
              name: "Maximum oracle age (hours)",
              exact: true,
            });
            assert.equal(Number(await maxAge.getAttribute("min")), 1 / 3600);
            const ceiling = route.maxAgeSeconds / 3600;
            assert.equal(Number(await maxAge.getAttribute("max")), ceiling);
            const defaultAge = Number(await maxAge.inputValue());
            assert(
              defaultAge >= 1 / 3600 && defaultAge <= ceiling,
              `${name}: invalid default oracle age ${defaultAge}h`,
            );
            await settings
              .getByRole("button", { name: "Return to order", exact: true })
              .click();
            assert.equal(
              await page
                .getByRole("textbox", { name: "Sell amount", exact: true })
                .inputValue(),
              "1",
            );
            assert.equal(
              await page
                .getByRole("textbox", { name: "Trigger price", exact: true })
                .inputValue(),
              "0.95",
            );
            checks.push(
              `${name}: settings preserve default age and draft after review`,
            );
          }
        }
      }
      progress(`${name}: reset account and close context`);
      await page.evaluate(() =>
        window.ethereum.setAccount(
          "0x2222222222222222222222222222222222222222",
        ),
      );
      await page
        .getByRole("button", { name: "Select token", exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByRole("textbox", { name: "Sell amount", exact: true })
          .inputValue(),
        "",
      );
      assert.equal(
        await page
          .getByRole("region", { name: "Review stop-loss order", exact: true })
          .count(),
        0,
      );
      checks.push(`${name}: account change clears draft`);
      walletCalls.push(
        ...(await page.evaluate(() => window.ethereum.calls)).map((item) => ({
          chainId: id,
          ...item,
        })),
      );
      await context.close();
      active = undefined;
    }
    // Keep menu failures separate from per-network form checks.
    if (chainFilter === undefined) {
      progress("Network menu: create isolated context");
      active = await isolatedPage(browser, 137);
      await connect(active.page, 137);
      try {
        progress("Network menu: open and check options");
        await active.page
          .getByRole("button", { name: "Switch wallet network", exact: true })
          .click({ timeout: 5000 });
        for (const { id } of networks)
          assert(
            await active.page.getByTestId("rk-chain-option-" + id).isVisible(),
          );
        for (const [id, name] of [
          [59144, "linea"],
          [9745, "plasma"],
        ]) {
          const image = active.page
            .getByTestId("rk-chain-option-" + id + "-icon")
            .locator("img");
          await image.evaluate((img) => img.decode(), undefined, {
            timeout: 5000,
          });
          assert(
            await image.evaluate((img) => img.complete && img.naturalWidth > 0),
          );
          assert.equal(
            await image.getAttribute("src"),
            "/assets/chains/" + name + ".svg",
          );
        }
        await screenshot(active.page, "cow-policy-network-menu.png");
        progress("Network menu: switch to Ethereum");
        await active.page
          .getByTestId("rk-chain-option-1")
          .click({ timeout: 5000 });
        await active.page.waitForFunction(
          () => Number(window.ethereum.chainId) === 1,
          undefined,
          { timeout: 5000 },
        );
        checks.push(
          "RainbowKit menu lists all networks, loads Linea/Plasma icons, and switches Polygon to Ethereum",
        );
      } catch (error) {
        limitations.push(
          `Wallet menu check failed in its isolated context: ${error.message}`,
        );
        await screenshot(
          active.page,
          "cow-policy-network-menu-failure.png",
        ).catch((error) =>
          limitations.push(`Menu screenshot failed: ${error.message}`),
        );
      }
      walletCalls.push(
        ...(await active.page.evaluate(() => window.ethereum.calls)).map(
          (item) => ({ chainId: 137, ...item }),
        ),
      );
    } else {
      limitations.push(
        "Network menu smoke check skipped because BROWSER_CHAIN_IDS is set.",
      );
    }
    assert.equal(
      walletCalls.filter((item) =>
        /sign|sendTransaction|sendRawTransaction|sendCalls/i.test(item.method),
      ).length,
      0,
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(consoleErrors, []);
    checks.push("No signing, transactions, page errors, or console errors");
    passed = true;
  } catch (error) {
    failure = error.stack;
    console.error(`Failed during ${phase}: ${failure}`);
    if (active) {
      await screenshot(active.page, "cow-policy-failure.png").catch(() => {});
      progress("Collect failure details");
      walletCalls.push(
        ...(
          await active.page
            .evaluate(() => window.ethereum.calls)
            .catch(() => [])
        ).map((item) => ({ ...item })),
      );
      console.error(
        await active.page
          .locator("body")
          .innerText()
          .catch(() => "Page unavailable"),
      );
    }
    process.exitCode = 1;
  } finally {
    const report = {
      passed,
      failure,
      phase,
      selectedChainIds,
      checks,
      limitations,
      errors,
      consoleErrors,
      appData,
      walletCalls,
      feedReads,
    };
    fs.writeFileSync(
      path.join(output, "cow-policy-browser-results.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
    progress("Close browser");
    try {
      await browser.close();
    } finally {
      clearTimeout(phaseTimer);
    }
  }
})();
