# Robinhood Chain readiness for CoW Air Rescue

[Robinhood Chain](supported-networks.md#robinhood-chain) supports [37 exact sells into USDG](token-catalog.md#robinhood-chain): 4 crypto tokens and 33 Stock Tokens and funds with 24/5 feeds.

Read-only checks on 2026-11-23 confirmed CoW settlement, the conditional-order contract wiring, and indexed TWAP orders. No funded Air Rescue test has run on Robinhood Chain. An indexed Air Rescue stop-loss, trigger, CowShed funding, solver fill, and cancellation still need signed verification.

## Network and rollout

Robinhood launched Classic Stock Tokens for eligible EU customers on Arbitrum One on **2025-06-30** and announced plans for its own chain that day. It launched the Robinhood Chain public testnet on **2026-02-10**. Arbitrum's **2026-02-11** testnet post describes its faucet Stock Tokens as simulation assets. On **2026-07-01**, Robinhood and Arbitrum announced the public Robinhood Chain mainnet was live. Robinhood Chain is an Ethereum Layer 2 built with Arbitrum technology. It is a separate network from Arbitrum One (`42161`). [Robinhood 2025 announcement](https://robinhood.com/newsroom/robinhood-launches-stock-tokens-reveals-layer-2-blockchain-and-expands-crypto-suite-in-eu-and-us-with-perpetual-futures-and-staking/) · [Robinhood public testnet launch](https://robinhood.com/newsroom/robinhood-chain-launches-public-testnet/) · [Arbitrum testnet post](https://blog.arbitrum.io/robinhood-chain-testnet/) · [Robinhood mainnet launch](https://robinhood.com/newsroom/robinhood-accelerates-global-expansion-robinhood-chain-mainnet-stock-tokens-agentic-trading/) · [Arbitrum mainnet launch](https://blog.arbitrum.io/robinhood-chain-mainnet/)

| Robinhood network | Chain ID | Gas | Public RPC | Explorer |
| --- | --- | --- | --- | --- |
| Mainnet | `4663` | ETH | `https://rpc.mainnet.chain.robinhood.com` | [Blockscout](https://robinhoodchain.blockscout.com/) |
| Public testnet | `46630` | Test ETH | `https://rpc.testnet.chain.robinhood.com` | [Testnet explorer](https://explorer.testnet.chain.robinhood.com/) |

These are Robinhood's published values. The public RPCs are rate-limited. Set `NEXT_PUBLIC_ROBINHOOD_RPC_URL` at build time if you need a different browser-safe mainnet endpoint. The app uses the official mainnet RPC when the setting is absent. [Robinhood connection guide](https://docs.robinhood.com/chain/connecting/) · [Robinhood deployment guide](https://docs.robinhood.com/chain/deploy-smart-contracts/)

## Which Stock Tokens can move and trade

| Product | What the issuer and trading venue confirm |
| --- | --- |
| Classic Stock Tokens, Robinhood Europe, Arbitrum One | Robinhood Europe lets customers buy, sell or hold them in its app. Its [Classic Stock Tokens FAQ](https://robinhood.com/eu/en/support/articles/stock-tokens-faq/) says customers cannot send them to other wallets or platforms. The presence of an Arbitrum contract does not make a Classic balance available to Air Rescue. |
| Stock Tokens, Robinhood Chain mainnet | The **2026-07-01** [launch announcement](https://robinhood.com/newsroom/robinhood-accelerates-global-expansion-robinhood-chain-mainnet-stock-tokens-agentic-trading/) made this separate product available through Robinhood Wallet to eligible users in more than 120 countries. Robinhood Assets (Jersey) Limited issues the tokens as securities that give economic exposure to underlying shares or funds. Holding a token gives no direct ownership of those shares. Robinhood's [developer guide](https://docs.robinhood.com/chain/building-with-stock-tokens/) describes standard ERC-20 transfers to compatible external wallets on the same chain. Its [product page](https://robinhood.com/rhj/stocktokens/) and [issuer FAQ](https://docs.robinhood.com/rhj/faq/) describe geographic limits, including exclusion of the U.S. and U.S. persons. |

Secondary-market transferability has limits. The issuer's **2026-11-09** [prospectus supplement](https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf) describes freely transferable tokens and issuer controls that can block transfers to or from a wallet, freeze tokens or pause transfers. Issuer purchase and redemption have separate eligibility and identity checks. Verify the exact security and contract in the [issuer disclosure library](https://robinhood.com/eu/en/legal/rhj/) and [Robinhood token registry](https://docs.robinhood.com/chain/contracts/) or its [asset API](https://api.robinhood.com/rhj/assets). Do not use a ticker or a Classic balance to identify a sell token.

There is evidence of use in some third-party protocols. On **2026-07-02**, Uniswap Labs said its mainnet deployment supported Robinhood Stock Token swaps through its AMM and UniswapX. On **2026-11-10**, it reported that more than 40 tokenized stocks and funds had SPY pools and that those markets had more than $900 million in combined trading volume. That supports transfer into and out of working trading venues. It does not establish that every token can enter and leave a specific Air Rescue CowShed or that a solver can sell it at the required minimum price. [Uniswap launch](https://blog.uniswap.org/robinhood-chain-is-live) · [Uniswap trading report](https://blog.uniswap.org/building-a-tokenized-securities-venue-on-uniswap) · [Air Rescue placement requirements](supported-networks.md#placement-requirements)

## CoW production execution and the conditional order gap

The **2026-10-28** [CoW DAO CIP-91 post](https://forum.cow.fi/t/cip-91-continued-funding-for-development-services-service-agreement-2027/3668) put Robinhood Chain in its expected Q4 launches. The [CoW SDK README](https://github.com/cowprotocol/cow-sdk/blob/main/README.md) still labels the chain "coming soon". These describe the plan and SDK status. The backend gives stronger evidence of what runs now:

- CoW's [order book specification](https://github.com/cowprotocol/services/blob/main/crates/orderbook/openapi.yml) lists `https://api.cow.fi/robinhood` for production and `https://barn.api.cow.fi/robinhood` for staging. The [production version endpoint](https://api.cow.fi/robinhood/api/v1/version) returned `v2.388.4@0bdcf5d05d78fa83a601ac10c88cf028ee57b670`.
- The [production order record](https://api.cow.fi/robinhood/api/v1/orders/0xd625b534874c87caaa17579f5a088cbc1a5b9d9a9b22fa91c9efe8dec9808e09f4792f0c8307634c9f9f9547502f97bb6fc793786b0444a6) shows a fulfilled order created on **2026-11-23 at 13:48:31 UTC**. The [trade by order UID](https://api.cow.fi/robinhood/api/v2/trades?orderUid=0xd625b534874c87caaa17579f5a088cbc1a5b9d9a9b22fa91c9efe8dec9808e09f4792f0c8307634c9f9f9547502f97bb6fc793786b0444a6) reports a fill at block `121453782`. The [solver competition](https://api.cow.fi/robinhood/api/v2/solver_competition/by_tx_hash/0x22026285b625861b5facdbec882a4f65c4b45deed891a51c4987e9a351428480) records a winner in auction `8416343`. The official RPC returned a successful [transaction receipt](https://robinhoodchain.blockscout.com/tx/0x22026285b625861b5facdbec882a4f65c4b45deed891a51c4987e9a351428480). The trade sells USDG to buy `0x5e81213613b6b86eab4c6c50d718d34359459786`, which the [issuer API](https://api.robinhood.com/rhj/assets) lists as TTWO on `4663` with 18 decimals. This does not establish an Air Rescue Stock Token sell.
- The [official RPC](https://rpc.mainnet.chain.robinhood.com) returned chain ID `4663`, head block `121580672`, and bytecode for all contracts in the table below. Poller reads returned the CowShed factory and ComposableCoW from the [CoW indexer configuration](https://github.com/cowprotocol/cow-programmatic-orders-api/blob/0ee8d2d32bda5c0f2d06718b3a0eb333528f279b/src/chains/robinhood.ts). Settlement returned the expected vault relayer and the same domain separator as ComposableCoW. The older [ComposableCoW](https://github.com/cowprotocol/composable-cow/blob/c0435953ac8312a606d66c91554f2bb4d22ec686/networks.json) and [CowShed](https://github.com/cowdao-grants/cow-shed/blob/b701368a11ff515b1abe07ea74c98f1e1bb72a58/networks.json) deployment lists omit `4663`. The live reads confirm the contracts exist.
- The [CoW programmatic indexer](https://programmatic-orders.cow.fi/graphql) returned two CowShed owner mappings and five TWAP conditional generators for `4663`. Some had fulfilled child orders. The TWAP sell side was USDG or WETH. The sample had no StopLoss generator and no Stock Token sell. Ophis reports [its own service](https://ophis.fi/blog/swap-on-robinhood-chain/), which uses a separate order book and settlement.

| Contract | Address on `4663` |
| --- | --- |
| Poller | `0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3` |
| CowShed factory | `0x221c28Ec177CF7da6f837DfD0052Ba8F265Fb4CA` |
| ComposableCoW | `0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74` |
| StopLoss | `0x412c36e5011cd2517016d243a2dfb37f73a242e7` |
| Settlement | `0x9008D19f58AAbD9eD0D60971565AA8510560ab41` |
| Vault relayer | `0xC92E8bdf79f0507f65a392b0ab4667716BFE0110` |

Air Rescue uses these production contracts and services. The signed test still needs to show that the CoW service accepts the app data with the `pollFunds` pre-hook, the indexer returns the stop-loss generator, and the Watchtower and a solver carry the order through trigger, funding, and settlement at or above the minimum buy amount. A direct read of the handler does not exercise this path. [Order preparation](../src/lib/pollerStopLoss.ts) · [Order data checks](supported-networks.md#order-data-and-service-checks)

## Onchain prices for exact Stock Tokens

Chainlink's [changelog](https://docs.chain.link/changelog) records Data Feeds going live on Robinhood Chain mainnet on **2026-07-01** and lists AAPL/USD on **2026-07-02**. The [network registry](https://github.com/smartcontractkit/documentation/blob/main/src/features/data/chains.ts) links to a [mainnet directory](https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json) with `DF` entries and proxy addresses. Examples from that directory:

| Price | Feed path | Proxy on Robinhood Chain mainnet |
| --- | --- | --- |
| Robinhood AAPL / USD | [`robinhood-aapl-usd-shared-svr`](https://data.chain.link/feeds/robinhood/mainnet/robinhood-aapl-usd-shared-svr) | `0x6B22A786bAa607d76728168703a39Ea9C99f2cD0` |
| Robinhood SPY / USD | `robinhood-spy-usd-shared-svr` | `0x319724394D3A0e3669269846abE664Cd621f9f6A` |
| USDG / USD | `usdg-usd-shared-svr` | `0x61B7e5650328764B076A108EFF5fa7282a1B9aD2` |

On 2026-11-23 the official RPC returned descriptions, 8 decimals, and positive, complete rounds for all three proxies. Their update times were 16:40:45 UTC for AAPL, 16:39:08 UTC for SPY, and 15:55:23 UTC for USDG. USDG is the fixed buy token on Robinhood Chain. These sample reads do not check publication across a session close. The exact Robinhood approvals and their pinned observations are in [the catalog policy](../scripts/catalog-policy.json).

The Robinhood equity rows above are calculated prices per **token**, rather than raw share quotes. Chainlink multiplies the underlying price by the token contract's normalized `uiMultiplier()` to account for dividends and corporate actions. Do not apply the multiplier again to the feed answer. It is a reference price, which can differ from the trade price. The documented updates cover 24/5 sessions, with no off-hours heartbeats and possible pauses for corporate actions. Robinhood documents the `latestRoundData()` and `decimals()` interface the current handler needs. [Chainlink Robinhood methodology](https://github.com/smartcontractkit/documentation/blob/main/src/content/data-feeds/tokenized-equity-feeds/robinhood.mdx) · [Robinhood oracle guide](https://docs.robinhood.com/chain/oracles-and-price-feeds/) · [Air Rescue oracle ABI](../src/lib/abis/oracleMinimalAbi.ts#L12-L51)

[Data Streams](https://docs.robinhood.com/chain/data-streams/) deliver signed reports fetched offchain and verified onchain. A Streams verifier does not supply a price through `latestRoundData()`. The [Robinhood REST prices API](https://docs.robinhood.com/chain/stock-token-apis/) quotes the underlying share before the multiplier and is not an onchain input. A testnet partner or mock token proves no mainnet price. [Pyth](https://docs.pyth.network/price-feeds/core/contract-addresses/evm) lists an oracle deployment, but this check found no other provider with a verified, compatible per-token proxy for a Robinhood Stock Token on `4663`.

## Freshness and market close

The app caps both price legs at 24 hours (86,400 seconds). The deployed handler applies one timeout to both feeds and does not check the market session. Air Rescue warns in the sell form and review that a Stock Token feed stops updating outside its 24/5 session. The last price can still trigger a fill after close while it is within the timeout. Once either price is stale, the handler cannot generate an order until both prices are fresh again. A feed can also stop during a corporate action.

A read-only AAPL/USDG handler call returned an order when the sample price met the test trigger. Other calls rejected an unmet trigger and a price outside a shorter test timeout. These calls did not use a CowShed or the `pollFunds` hook. The public RPC could not provide historical state for the sampled closed-session blocks.

## Held tokens and quote limits

- SGOV and USAR are not approved. Both have incomplete Chainlink directory records. Onchain and issuer evidence support the SGOV token-price match, but the row lacks the required primary token price metadata. For USAR, the exact pricing method is also unconfirmed. Positive rounds and fast quotes do not resolve these gaps.
- GLD uses a DEX-state feed with a crypto session, not the reviewed 24/5 Stock Token method. Robinhood Stock Token approvals exclude smoothed 24/7 references and raw share quotes. The alternate bridged LINK contract is also out of scope. Only the exact Chainlink-listed Robinhood LINK contract is approved.

On 2026-11-23, WETH and MU returned indicative CoW fast quotes. The [public MU sell record](https://api.cow.fi/robinhood/api/v1/orders/0xf287fbd7f1fafd85728c9f9ef159a6c6de9d4a85c77c6c357fd4e78ffb322cb4f4792f0c8307634c9f9f9547502f97bb6fc793786b048e6c) shows a normal MU/USDG fill that did not use an Air Rescue stop-loss.

CLSK, IONQ, and RKLB returned `NoLiquidity` for fast quotes at 0.01, 1, 10, and 100 tokens. WBTC, LINK, and ENA also returned `NoLiquidity` at their sampled sizes. These routes remain eligible. `NoLiquidity` means the API found no quote for that request at that time. A successful fast quote does not prove that a stop-loss will fill. In the app, an unavailable execution quote warns the user but does not by itself block placement. Do not use a route without a current quote for the first signed test.

## Signed tester checklist

1. Use an authorized wallet on Robinhood mainnet (`4663`). Use a small amount of test funds and keep enough ETH for placement and cancellation. Check the exact sell token and USDG contracts, funding and approvals, and a current CoW quote at the intended sell size. For MU, confirm issuer eligibility, the Final Terms, and transfer controls. [Issuer disclosures](https://robinhood.com/eu/en/legal/rhj/) · [Token contracts](https://docs.robinhood.com/chain/contracts/)
2. Test WETH into USDG first. Sign a small exact-sell stop-loss and record the placement transaction, app data hash, and generator hash. Check that the indexer shows the order under the tester's account and that it stays unfilled before the trigger. After the trigger, verify that the Watchtower made it available to solvers and that the settlement used the `pollFunds` pre-hook to fund the CowShed. Record the child order UID, settlement receipt, and USDG received. Check that the amount meets the signed minimum buy amount.
3. After WETH passes, repeat with MU into USDG during the Stock Token feed's 24/5 session. Check both price timestamps and the market-hours warning before signing. Confirm that the held MU can pass from the tester's wallet through the CowShed to settlement, and record the same evidence as for WETH.
4. Test cancellation separately with an open order before the trigger. Sign the cancellation on Robinhood Chain. Verify the receipt and that ComposableCoW no longer lists the generator as active. Refresh the app to check the order state, and check any remaining token balance and allowances. Cancel any other open test orders when the test is complete.

The checks recorded here are read-only. No funded Air Rescue stop-loss, settlement, or cancellation has been tested on Robinhood Chain.
