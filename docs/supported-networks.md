# Supported networks

The standalone app supports new orders and order history on Ethereum (1), Gnosis (100), Arbitrum One (42161), Base (8453), Polygon (137), Avalanche (43114), BNB Chain (56), Linea (59144), Plasma (9745), and Robinhood (4663). Each mainnet has an explicit sell list. See the [supported-token table](token-catalog.md#supported-tokens).

Sepolia (11155111) remains available for tests. Ink and Solana are excluded. The app connects through Wagmi and RainbowKit and does not require a Safe frame or Safe gateway.

Connecting a wallet or browsing order history does not switch the wallet chain. Use the wallet network menu to switch chains. Order creation uses exact-sell amounts, a trigger price, slippage, and one fixed USD buy token per order-capable chain. Gnosis and BNB Chain use USDT, Robinhood uses USDG, and the other seven mainnets use native USDC. Sepolia offers only WETH into the existing 18-decimal USDC test token, with fixed test feeds. See [Token catalog](token-catalog.md) for token eligibility and oracle limits.

## Robinhood Chain

The wallet network menu lists Robinhood Chain mainnet (4663) as "Robinhood". It uses ETH for gas and the [Blockscout explorer](https://robinhoodchain.blockscout.com). Robinhood Chain testnet is not in the menu.

Robinhood Chain supports placement, order history, and cancellation through the [production CoW API](https://api.cow.fi/robinhood). The [37 approved sell contracts](token-catalog.md#robinhood-chain) include 4 crypto tokens and 33 Stock Tokens and funds with 24/5 feeds.

Stock Token feeds do not update outside their 24/5 session. An order can still execute after close while the last price is within the selected freshness timeout. No funded Air Rescue stop-loss or cancellation test has run on Robinhood Chain. See the [signed tester checklist](robinhood-chain-readiness.md#signed-tester-checklist).

## Limit price and slippage

On every order-capable network, Default slippage is fixed at 10%. The Limit price field starts in Price view. Edit the price or percentage to select Custom; switching between Price and Slippage does not change the order. `Reset to default` restores 10% without changing the selected view. With a trigger price of 95 and a sell amount of 10, Default gives a limit price of 85.5 and a minimum buy amount of 855, subject to buy-token rounding.

The former quote-based slippage recommendation algorithm and pair-recommendation helper are disabled for order creation. Their code and tests remain for later use. Execution quotes still load for execution checks and warnings, but do not set slippage. Default 10% is not a cap on Custom slippage.

## RPC configuration

Set `NEXT_PUBLIC_DRPC_KEY` in `.env.local` or the build environment to use one dRPC key for the ten order-capable chains other than Robinhood, including Sepolia. Each chain uses its own network endpoint at `https://lb.drpc.live/<network>/<key>`. Wagmi and order read clients share these RPC settings. Robinhood Chain uses its [official RPC](https://rpc.mainnet.chain.robinhood.com) by default. To use a different Robinhood mainnet RPC for both clients, set `NEXT_PUBLIC_ROBINHOOD_RPC_URL` at build time. The other old per-chain RPC URL settings are no longer read.

```dotenv
NEXT_PUBLIC_DRPC_KEY=your-public-drpc-key
```

The public RPC URL and dRPC key can appear in the browser bundle. Use credentials intended for public browser use. Restart the development server or rebuild the deployed app after changing the RPC settings.

Without a key, or with an empty key, clients use the viem chain defaults except for Ethereum, Polygon, and BNB Chain. Their defaults are `https://ethereum-rpc.publicnode.com`, `https://polygon-bor-rpc.publicnode.com`, and `https://bsc-dataseed1.bnbchain.org`. Plasma has a local chain definition with `https://rpc.plasma.to` because the locked viem version has no Plasma definition. A failed dRPC request does not switch to a public endpoint.

## Placement requirements

Placement first requires an explicitly approved token/feed route and chain execution policy. Each bounded fixed buy feed has its own suitability decision; bounded sells remain excluded. Active Low, Medium, High, Very High (`veryhigh`), and New feeds can qualify through exact-token review. These categories do not guarantee reliable prices. Custom feeds remain excluded except for exact Stock Token feeds with a [Robinhood approval](token-catalog.md#robinhood-chain). Unknown categories, hidden, deprecating or inactive sources, and stable sells remain excluded.

A price method alone does not exclude a feed. Calculated, backing-based, and onchain prices can differ from the traded token's market price. Each approval must cover a direct same-unit USD or ETH quote and its accepted limits. Bridged tokens can use their underlying asset's feed at an assumed 1:1 token-unit relationship with exact identity and representation evidence; a separate per-token bridge-risk decision is optional. Underlying prices do not measure bridge or custody failures. New staking-share routes are deferred; existing approvals remain enabled in their own share units.

The handler has one shared timeout and no execution-time sequencer or recovery check on Arbitrum, Base, or Linea. These limits are accepted for the exact allowlisted routes; they have not been fixed by browser checks or a new handler. See [Token catalog](token-catalog.md) and [handler evidence](../scripts/oracle-execution-verification.json).

For an approved route, placement also requires the configured Poller, CowShed factory, ComposableCoW, StopLoss handler, settlement, and vault relayer. The app checks the account's CowShed state, funding, approvals, and canonical route. Approval repair and cancellation remain available for existing orders when their normal checks pass. Historical token metadata does not make a token eligible for new orders.

Read-only checks on 2026-10-19 verified bytecode and deployment configuration on the nine mainnets supported at that time, including the Poller's factory and ComposableCoW configuration. `scripts/eoa-deployments-verification.json` records the RPC chain IDs, contract bytecode sizes, and configured addresses. These checks did not sign or send transactions and do not prove end-to-end execution.

## Order data and service checks

The app reads `https://programmatic-orders.cow.fi/graphql` for account ownership and conditional order generators across all eleven order-capable chains, including Robinhood and Sepolia. It does not require the old ComposableCoW staging indexer, its `/status` endpoint, or a Safe transaction queue. A failed chain is reported separately so orders from other chains remain visible.

On 2026-10-19, the endpoint accepted owner and conditional order generator queries for the ten chains tested. Sample orders were returned for Ethereum, Gnosis, Arbitrum, Base, and Sepolia. Polygon, Avalanche, BNB Chain, Linea, and Plasma returned no sample orders. Query acceptance alone does not prove that those five chains are indexed. `scripts/eoa-indexer-verification.json` records these results. Confirm actual order indexing before relying on order history on those chains.

Historical checks on 2026-10-16 found working CoW API version endpoints on the six added networks and positive `native_price` responses for the selected production USD buy tokens. Arbitrum uses the `arbitrum_one` API path; the old `arbitrum` path returned HTTP 404. The old staging indexer returned HTTP 404 and Safe gateway requests returned HTTP 403 in that check environment. Those results describe the former Safe app dependencies and are not current standalone app requirements. No dated service check promises future availability or liquidity.

## Chain icons

Most local chain icons in `public/assets/chains` come from `https://files.cow.fi/cow-sdk/chains/images/`. Sepolia uses the Ethereum icon. Robinhood uses the [Robinhood feather](https://cdn.robinhood.com/assets/generated_assets/hoodchain_docsite/feather-dark.svg). The shared chain image map also supplies RainbowKit's `iconUrl` and `iconBackground` for Linea, Plasma, and Robinhood. The menu does not read the header's `NetworkLogo` component.
