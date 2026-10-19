# Supported networks

The standalone app supports Ethereum (1), Gnosis (100), Arbitrum One (42161), Base (8453), Polygon (137), Avalanche (43114), BNB Chain (56), Linea (59144), and Plasma (9745). Sepolia (11155111) remains available for tests. Ink and Solana are excluded. The app connects through Wagmi and RainbowKit and does not require a Safe frame or Safe gateway.

Connection and browsing do not switch the wallet chain. Only an explicit network selection requests a switch. Order creation uses exact-sell amounts, a trigger price, slippage, and one fixed USD buy token per chain. Gnosis uses USDT. Sepolia offers only WETH into the existing 18-decimal USDC test token, with fixed test feeds. See [Token catalog](token-catalog.md) for token eligibility and oracle limits.

## RPC configuration

Set `NEXT_PUBLIC_RPC_URL_MAINNET`, `NEXT_PUBLIC_RPC_URL_GNOSIS`, `NEXT_PUBLIC_RPC_URL_ARBITRUM`, `NEXT_PUBLIC_RPC_URL_BASE`, `NEXT_PUBLIC_RPC_URL_POLYGON`, `NEXT_PUBLIC_RPC_URL_AVALANCHE`, `NEXT_PUBLIC_RPC_URL_BNB`, `NEXT_PUBLIC_RPC_URL_LINEA`, `NEXT_PUBLIC_RPC_URL_PLASMA`, and `NEXT_PUBLIC_RPC_URL_SEPOLIA` to override the public RPCs. These values are included in the browser bundle. Do not use private server credentials.

Without an override, clients use the viem chain defaults except for Ethereum, Polygon, and BNB Chain. Their defaults are `https://ethereum-rpc.publicnode.com`, `https://polygon-bor-rpc.publicnode.com`, and `https://bsc-dataseed1.bnbchain.org`. Plasma has a local chain definition with `https://rpc.plasma.to` because the locked viem version has no Plasma definition. Wagmi and read clients share these RPC settings.

## Placement requirements

Placement requires the configured Poller, CowShed factory, ComposableCoW, StopLoss handler, settlement, and vault relayer on the selected chain. The app checks the account's CowShed state, funding, approvals, and canonical oracle route before placement. Review one order, complete any required setup and approval transactions, then place it. Approval repair and cancellation remain available for eligible existing orders. Historical token metadata does not make a token eligible for new orders.

Read-only checks on 2026-10-19 verified bytecode and deployment configuration on all nine production chains, including the Poller's factory and ComposableCoW configuration. `scripts/eoa-deployments-verification.json` records the RPC chain IDs, contract bytecode sizes, and configured addresses. These checks did not sign or send transactions and do not prove end-to-end execution.

## Order data and service checks

The app reads `https://programmatic-orders.cow.fi/graphql` for account ownership and conditional order generators across all ten configured chains. It does not require the old ComposableCoW staging indexer, its `/status` endpoint, or a Safe transaction queue. A failed chain is reported separately so orders from other chains remain visible.

On 2026-10-19, the endpoint accepted owner and conditional order generator queries for all ten chains. Sample orders were returned for Ethereum, Gnosis, Arbitrum, Base, and Sepolia. Polygon, Avalanche, BNB Chain, Linea, and Plasma returned no sample orders. Query acceptance alone does not prove that those five chains are indexed. `scripts/eoa-indexer-verification.json` records these results. Confirm actual order indexing before relying on order history on those chains.

Historical checks on 2026-10-16 found working CoW API version endpoints on the six added networks and positive `native_price` responses for the selected production USD buy tokens. Arbitrum uses the `arbitrum_one` API path; the old `arbitrum` path returned HTTP 404. The old staging indexer returned HTTP 404 and Safe gateway requests returned HTTP 403 in that check environment. Those results describe the former Safe app dependencies and are not current standalone app requirements. No dated service check promises future availability or liquidity.

## Chain icons

Local chain icons in `public/assets/chains` come from `https://files.cow.fi/cow-sdk/chains/images/`. Sepolia uses the Ethereum icon.
