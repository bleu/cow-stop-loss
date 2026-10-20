# Supported networks

The standalone app provides wallet selection and historical order access for Ethereum (1), Gnosis (100), Arbitrum One (42161), Base (8453), Polygon (137), Avalanche (43114), BNB Chain (56), Linea (59144), and Plasma (9745). New production orders are supported on every listed mainnet with an explicit sell list. Ethereum supports AAVE, cbBTC, COMP, LINK, UNI, and WETH; Gnosis AAVE, COMP, GNO, LINK, UNI, and WETH; Arbitrum AAVE, ARB, COMP, LINK, UNI, WBTC, and WETH; Base AAVE, COMP, LINK, VIRTUAL, and WETH; Polygon AAVE, LINK, UNI, WETH, and WPOL; Avalanche AAVE.e, COMP.e, GMX, JOE, LINK.e, UNI.e, WAVAX, and WETH.e; BNB Chain AAVE, C98, Cake, ETH, LINK, LISTA, UNI, WBNB, and XVS; Linea LINK, WETH, and wstETH; and Plasma LINK, weETH, WETH, and WXPL. The 2026-10-20 review added four routes, then 38 more under the revised policy. Seven mainnets meet the five-sell target. Linea has three sells and Plasma has four, with shortfalls of two and one. See the [dated review and shortfalls](token-catalog.md#expansion-review-2026-10-20). Sepolia (11155111) remains available for tests. Ink and Solana are excluded. The app connects through Wagmi and RainbowKit and does not require a Safe frame or Safe gateway.

Connection and browsing do not switch the wallet chain. Only an explicit network selection requests a switch. Order creation uses exact-sell amounts, a trigger price, slippage, and one fixed USD buy token per chain. Gnosis and BNB Chain use USDT; the other mainnets use native USDC. Sepolia offers only WETH into the existing 18-decimal USDC test token, with fixed test feeds. See [Token catalog](token-catalog.md) for token eligibility and oracle limits.

## RPC configuration

Set `NEXT_PUBLIC_RPC_URL_MAINNET`, `NEXT_PUBLIC_RPC_URL_GNOSIS`, `NEXT_PUBLIC_RPC_URL_ARBITRUM`, `NEXT_PUBLIC_RPC_URL_BASE`, `NEXT_PUBLIC_RPC_URL_POLYGON`, `NEXT_PUBLIC_RPC_URL_AVALANCHE`, `NEXT_PUBLIC_RPC_URL_BNB`, `NEXT_PUBLIC_RPC_URL_LINEA`, `NEXT_PUBLIC_RPC_URL_PLASMA`, and `NEXT_PUBLIC_RPC_URL_SEPOLIA` to override the public RPCs. These values are included in the browser bundle. Do not use private server credentials.

Without an override, clients use the viem chain defaults except for Ethereum, Polygon, and BNB Chain. Their defaults are `https://ethereum-rpc.publicnode.com`, `https://polygon-bor-rpc.publicnode.com`, and `https://bsc-dataseed1.bnbchain.org`. Plasma has a local chain definition with `https://rpc.plasma.to` because the locked viem version has no Plasma definition. Wagmi and read clients share these RPC settings.

## Placement requirements

Placement first requires an explicitly approved token/feed route and chain execution policy. Each fixed buy feed has its own bounded-feed suitability decision; bounded sells remain excluded. Active low- and medium-category feeds use the normal exact-row review. New, high, custom, and unknown sources remain excluded, as do stable sells. A price method alone does not exclude a feed. Calculated, backing-based, and onchain prices can differ from the traded token's market price. Each approval must cover a direct same-unit USD or ETH quote and its accepted limits. Bridge and custody exposure are accepted only within the exact approval's recorded scope; an underlying-asset price does not measure those risks. The handler has one shared timeout and no execution-time sequencer or recovery check on Arbitrum, Base, or Linea. These limits are accepted for the exact allowlisted routes; they have not been fixed by browser checks or a new handler. See [Token catalog](token-catalog.md) and [handler evidence](../scripts/oracle-execution-verification.json).

For an approved route, placement also requires the configured Poller, CowShed factory, ComposableCoW, StopLoss handler, settlement, and vault relayer. The app checks the account's CowShed state, funding, approvals, and canonical route. Approval repair and cancellation remain available for existing orders when their normal checks pass. Historical token metadata does not make a token eligible for new orders.

Read-only checks on 2026-10-19 verified bytecode and deployment configuration on all nine production chains, including the Poller's factory and ComposableCoW configuration. `scripts/eoa-deployments-verification.json` records the RPC chain IDs, contract bytecode sizes, and configured addresses. These checks did not sign or send transactions and do not prove end-to-end execution.

## Order data and service checks

The app reads `https://programmatic-orders.cow.fi/graphql` for account ownership and conditional order generators across all ten configured chains. It does not require the old ComposableCoW staging indexer, its `/status` endpoint, or a Safe transaction queue. A failed chain is reported separately so orders from other chains remain visible.

On 2026-10-19, the endpoint accepted owner and conditional order generator queries for all ten chains. Sample orders were returned for Ethereum, Gnosis, Arbitrum, Base, and Sepolia. Polygon, Avalanche, BNB Chain, Linea, and Plasma returned no sample orders. Query acceptance alone does not prove that those five chains are indexed. `scripts/eoa-indexer-verification.json` records these results. Confirm actual order indexing before relying on order history on those chains.

Historical checks on 2026-10-16 found working CoW API version endpoints on the six added networks and positive `native_price` responses for the selected production USD buy tokens. Arbitrum uses the `arbitrum_one` API path; the old `arbitrum` path returned HTTP 404. The old staging indexer returned HTTP 404 and Safe gateway requests returned HTTP 403 in that check environment. Those results describe the former Safe app dependencies and are not current standalone app requirements. No dated service check promises future availability or liquidity.

## Chain icons

Local chain icons in `public/assets/chains` come from `https://files.cow.fi/cow-sdk/chains/images/`. Sepolia uses the Ethereum icon. The shared chain image map also supplies RainbowKit's `iconUrl` and `iconBackground` for Linea and Plasma; the menu does not read the header's `NetworkLogo` component.
