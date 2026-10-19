# CoW Stop Loss

A standalone app to create, review, and cancel exact-sell stop-loss orders on CoW Protocol. Use `Connect wallet` to open RainbowKit and select a browser wallet or WalletConnect. The app does not require a Safe frame or Safe gateway.

Orders for the connected account and its CowShed proxies appear in one list across Ethereum, Gnosis, Arbitrum, Base, Polygon, Avalanche, BNB Chain, Linea, Plasma, and Sepolia. Sepolia is marked as a testnet. Connection and browsing do not switch the wallet chain. The header's network control requests a wallet chain switch only when you select a network. Use the list's chain and status filters to narrow the list; both default to `All`. Open the header account button to disconnect.

Select a catalog sell token, enter an exact sell amount and trigger price, and set slippage. Each chain has one fixed USD buy token; Gnosis uses USDT. Review one order, complete any required CowShed setup and token approval, then place it. Existing orders support approval repair and cancellation when their ownership and state permit it. Sepolia creation offers WETH only, with the existing USDC test token and fixed test feeds. Arbitrary token imports, manual feed overrides, and exact-buy mode are not supported. See [Supported networks](docs/supported-networks.md) and [Token catalog](docs/token-catalog.md) for coverage and limits.

## Local setup

Use Node.js 20.9 or later and pnpm 9. The private `@bleu/ui` package requires a package-read `NPM_TOKEN` in the install environment.

```bash
corepack pnpm@9 install
corepack pnpm@9 dev:next
```

Open http://localhost:3000. Run `corepack pnpm@9 dev` to start the app and documentation together.

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
corepack pnpm@9 test:jest --runInBand
corepack pnpm@9 lint
corepack pnpm@9 exec tsc --noEmit
corepack pnpm@9 build:next
corepack pnpm@9 build
```

Tests replace external HTTP, wallet providers, and time. They use the real wallet, data-loading, and rendered-view modules. A real WalletConnect session also needs a configured project and an external wallet.
