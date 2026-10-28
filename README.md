# CoW Stop Loss

A standalone app to create, review, and cancel exact-sell stop-loss orders on CoW Protocol. Use `Connect wallet` to open RainbowKit and select a browser wallet or WalletConnect. The app does not require a Safe frame or Safe gateway.

The app is in public testing. Bugs can cause orders to fail or result in loss of funds. New orders are limited to $10,000 USD each, based on the current value of the sell amount. This is an app-side check when creating an order, not a cap on total orders or execution value. Please report problems through [GitHub issues](https://github.com/bleu/cow-stop-loss/issues/new).

Orders for the connected account and its CowShed proxies appear in one list across Ethereum, Gnosis, Arbitrum, Base, Polygon, Avalanche, BNB Chain, Linea, Plasma, and Sepolia. Sepolia is marked as a testnet. Connection and browsing do not switch the wallet chain. The header's network control requests a wallet chain switch only when you select a network. Use the list's chain and status filters to narrow the list; both default to `All`. Open the header account button to disconnect.

All nine mainnets support new stop-loss orders with small sell allowlists: Ethereum WETH, LINK, and UNI; Gnosis GNO; Arbitrum WETH; Base VIRTUAL; Polygon WPOL; Avalanche WAVAX; BNB Chain WBNB; Linea WETH; and Plasma WXPL. Gnosis and BNB Chain buy USDT; the other mainnets buy native USDC. Sepolia offers WETH into the existing USDC test token with fixed test feeds. Existing orders support approval repair and cancellation when their ownership and state permit it. See [Supported networks](docs/supported-networks.md) and [Token catalog](docs/token-catalog.md) for the exact allowlist, feed checks, and accepted oracle limits.

Approved routes use an exact sell amount, trigger price, limit price, and one fixed USD buy token per chain. Dollar-pegged and dollar-linked tokens are excluded from sells. Arbitrary token imports, manual feed overrides, and exact-buy mode are not supported.

The Limit price field starts in Price view with Default slippage fixed at 10%. Edit the price or switch to Slippage and edit the percentage to select Custom. Switching views does not change the order. `Reset to default` restores 10% and keeps the selected view. Receive at least shows the minimum buy amount. Expiry remains in Advanced settings.

The former quote-based slippage recommendation algorithm and pair-recommendation helper are disabled for order creation, but their code and tests are retained. Execution quotes still load for execution checks and warnings; they do not change Default slippage.

## Local setup

Use Node.js 24.22.1 or later in the Node 24 LTS line, pnpm 9, and Python 3. The private `@bleu/ui` package requires a package-read `NPM_TOKEN` in the install environment.

```bash
corepack pnpm@9 install
corepack pnpm@9 dev:next
```

Open http://localhost:3000. Run `corepack pnpm@9 dev` to start the app and documentation together.

`dev:next` and `build:next` first prepare pinned token-list bytes and local token images, then check image hashes and the generated catalog offline. A clean checkout needs network access for missing files. Verified metadata in `.cache/token-catalog` and verified images in `public/assets/tokens` can be reused offline. Images keep their current local URLs and exact bytes; baseline assets and any image that cannot be restored remain committed. Changed bytes or corrupt data stop the command, as does a network failure without verified local files. There is no latest-list or replacement-artwork fallback. These commands do not regenerate the runtime catalog. After an intentional catalog change, run `corepack pnpm@9 generate:catalog`, review the diff, and repeat the checks. See [Token catalog](docs/token-catalog.md) for sources and maintenance.

## RPC setup

Set this optional value in `.env.local` before starting or building Next.js:

```dotenv
NEXT_PUBLIC_DRPC_KEY=your-public-drpc-key
```

All ten chains use this key with their own dRPC network endpoint. Without a key, or with an empty value, the app uses its existing public RPC defaults. The old per-chain RPC URL settings are no longer read. The key is visible in the browser; use a key intended for public browser use. Restart the development server or rebuild the deployed app after changing it. See [RPC configuration](docs/supported-networks.md#rpc-configuration) for details.

## WalletConnect setup

Set these values in `.env.local` before starting or building Next.js:

```dotenv
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use a WalletConnect project ID and allow the app's origin in that project's settings. Set `NEXT_PUBLIC_APP_URL` to the deployed app URL in production. It is used for wallet connection metadata. Without this value, the browser's current origin is used. These two values are public client configuration. Do not place private keys or package tokens in `NEXT_PUBLIC_` variables.

Without a project ID, WalletConnect is hidden. Browser wallet connection remains available in the connect modal. Enable testnets in the wallet when needed; Sepolia orders remain visible regardless of the connected wallet chain.

RainbowKit 2.2.0 is pinned with a pnpm patch in `patches/`. The patch removes its automatic chain switch during connection. Keep this behavior when upgrading RainbowKit: only an explicit selection in the header can request a chain switch.

## Order data

The app reads https://programmatic-orders.cow.fi/graphql. It loads all ownership and order pages for the configured StopLoss handler. Each row is a stop-loss parent with at most one resulting CoW order. Details show available execution amounts, prices, oracle settings, and explorer links. Known historical tokens retain their metadata without becoming eligible for new orders. Tokens without known metadata are shown in raw base units. The API does not supply the execution fee token, so fees also remain in raw base units.

Read-only checks on 2026-10-19 verified the required EOA contract deployments on all nine production chains. The order endpoint accepted queries for all ten configured chains, but returned no sample orders for Polygon, Avalanche, BNB Chain, Linea, or Plasma. Indexing on those five chains is not proven. The dated evidence is in `scripts/eoa-deployments-verification.json` and `scripts/eoa-indexer-verification.json`; it does not prove end-to-end order execution.

Data loads on connection and account changes. Use the reload icon beside `Status` or a chain's retry button for later updates. There is no automatic polling, focus refresh, or local expiry timer. A failed chain shows a warning; other chains remain visible. Previously loaded orders for that account stay visible with a stale-data warning if a refresh fails. Account changes and disconnects clear the prior account's orders.

A detail link for a different account asks you to connect that account and does not load its orders. The old `/<chainId>/<safeAddress>` list route now shows the same connected-account view. Current creation uses the reviewed catalog and canonical oracle routes; historical orders keep their saved feeds. USD estimates require a direct USD feed and remain unavailable for ETH-only tokens.

## Checks

```bash
corepack pnpm@9 prepare:catalog
corepack pnpm@9 check:assets
corepack pnpm@9 check:catalog
python3 -m unittest discover -s scripts -p 'test_catalog*.py'
corepack pnpm@9 test:jest --runInBand
corepack pnpm@9 lint
corepack pnpm@9 exec tsc --noEmit
corepack pnpm@9 build:next
corepack pnpm@9 build
```

The app uses the checked-in runtime catalog and local images. Ordinary Jest tests do not fetch token lists or images; they check the reviewed image manifest. CI prepares metadata and images, checks image hashes and the runtime snapshot, runs the Python catalog tests, checks TypeScript, runs Jest and lint, then builds the app and documentation. TypeScript checks the whole project, including tests. Jest transforms and runs tests without a second type-check pass, which avoids a React Native global type collision in ts-jest. The browser loads local images and does not depend on list-server CORS settings. Detailed reports are optional ignored outputs: `python3 scripts/catalog.py --reports .cache/token-catalog/reports` regenerates the runtime snapshot and writes `catalog-audit.json` and `catalog-metadata-report.json` there. Normal generation and checks do not require these reports.

Tests replace external HTTP, wallet providers, and time. Policy tests use the real small allowlists and require usable routes on all nine mainnets. Rejection tests cover tokens outside those lists and unavailable-policy fixtures. Some order-math and EOA-flow suites opt into synthetic approved routes; those fixtures are not production approval evidence. A real WalletConnect session also needs a configured project and an external wallet.

The read-only browser check in `scripts/verify-oracle-policy.cjs` uses a separate wallet context for each network, checks loaded images, the small sell allowlist and fixed buy token on each mainnet, and order review with mocked reads. Start the app first, provide an installed Playwright module with `PLAYWRIGHT_PATH`, and set `CHROME_PATH` if Chrome is not at the default macOS path. The fixture mocks external reads, intercepts app-data publication, and blocks signing and transactions. It does not prove live execution.
