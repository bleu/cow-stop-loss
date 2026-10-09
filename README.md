# CoW Stop Loss

A standalone, read-only app for stop-loss orders on CoW Protocol. Connect a browser wallet or use WalletConnect. A Safe connected through WalletConnect uses the Safe account address. The app does not require a Safe frame and does not create or cancel orders.

Orders for the connected account and its CowShed proxies appear in one list across Ethereum, Gnosis, Arbitrum, and Sepolia. Sepolia is marked as a testnet. Browsing does not switch the wallet chain. Use the chain and status filters to narrow the list.

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

Without a project ID, WalletConnect is hidden and the app shows a configuration notice. Browser wallet connection remains available. Enable testnets in the wallet when needed; Sepolia orders remain visible regardless of the connected wallet chain.

## Order data

The app reads https://programmatic-orders.cow.fi/graphql. It loads all ownership and order pages for the configured StopLoss handler. Each row is a stop-loss parent with at most one resulting CoW order. Details show available execution amounts, prices, oracle settings, and explorer links. Historical tokens without configured metadata are shown in raw base units. The API does not supply the execution fee token, so fees also remain in raw base units.

Data loads on connection and account changes. Use `Refresh orders` or a chain's retry button for later updates. There is no automatic polling, focus refresh, or local expiry timer. A failed chain shows a warning; other chains remain visible. Previously loaded orders for that account stay visible with a stale-data warning if a refresh fails. Account changes and disconnects clear the prior account's orders.

A detail link for a different account asks you to connect that account and does not load its orders. The old `/<chainId>/<safeAddress>` list route now shows the same connected-account, read-only view. The configured tokens and price feeds remain unchanged.

## Checks

```bash
corepack pnpm@9 test:jest --runInBand
corepack pnpm@9 lint
corepack pnpm@9 exec tsc --noEmit
corepack pnpm@9 build:next
corepack pnpm@9 build
```

Tests replace external HTTP, wallet providers, and time. They use the real wallet, data-loading, and rendered-view modules. A real WalletConnect session also needs a configured project and an external wallet.
