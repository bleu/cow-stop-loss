# Token catalog

The catalog contains 303 production ERC20 contracts on the nine approved CoW chains and three historical Sepolia test-token records. Ink and Solana are not supported chains. This is the set with reviewed contract identities and usable price routes, not a claim that every published feed has an eligible ERC20 deployment. The audit keeps all unmatched feed assets visible. The standalone EOA app uses this catalog through `getSupportedTokens`; historical records and catalog entries are not all selectable sell tokens.

## Coverage

| Chain     | Chain ID | Production tokens | USD buy token | Unresolved feed rows |
| --------- | -------- | ----------------- | ------------- | -------------------- |
| Ethereum  | 1        | 85                | Native USDC   | 6                    |
| Gnosis    | 100      | 17                | USDT          | 5                    |
| Arbitrum  | 42161    | 44                | Native USDC   | 74                   |
| Base      | 8453     | 38                | Native USDC   | 20                   |
| Polygon   | 137      | 25                | Native USDC   | 30                   |
| Avalanche | 43114    | 28                | Native USDC   | 14                   |
| BNB Chain | 56       | 48                | USDT          | 6                    |
| Linea     | 59144    | 8                 | Native USDC   | 5                    |
| Plasma    | 9745     | 10                | Native USDC   | 3                    |

`USD_TOKENS` exposes one buy token per chain. Other stablecoins can remain sell tokens; the designated buy token cannot also be selected for sale. The native USDC addresses come from [Circle's contract directory](https://developers.circle.com/stablecoins/usdc-contract-addresses), which includes Linea and Plasma. Plasma USDC is `0x2d661c89d812261039af9764eceaaee884f5f67f`; Plasma USDT0 is the different contract `0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb`. Gnosis and BNB Chain use USDT because Circle does not list a native USDC deployment there. Sepolia creation keeps only WETH as the sell token and the historical 18-decimal USDC test contract as the buy token. Its existing fixed sell and buy feeds are test data, not production token-specific USD prices.

New orders use exact-sell amounts and slippage. The selector, schema, draft builder, and final placement use the same eligible token set. Token addresses are compared without case sensitivity; symbols and decimals must match the configured metadata exactly. Arbitrary token imports, manual feed overrides, exact-buy mode, and token inversion are not supported.

`findKnownToken` also resolves historical metadata for order display and approval repair, including Ethereum WBTC and the old Gnosis USDC.e buy token. These records do not add creation routes or price-feed eligibility. Existing orders keep their saved oracle pair for market-price reads and can still be cancelled when the normal ownership and order-state checks pass.

There are 336 selected same-chain price-feed proxies. Direct USD feeds give the widest route coverage. ETH feeds are also retained when present. An ETH-only token is included only when the chain's USD buy token has its own ETH feed. `configuredTokenRoute` chooses a shared ETH quote first, then a shared USD quote. The pair-price hook, configured router, draft route, and placement validation use that same choice. Both feed prices are normalized by their decimals before the sell/buy ratio is calculated. Reads use one block and retain positive-answer, complete-round, timestamp, and maximum-age checks. Repeated feed addresses are read once per pair request. No synthetic bridge oracle or assumed USD peg is added.

USD estimates are separate from pair prices. They use only a configured direct USD feed. ETH-only tokens have an unavailable USD estimate even when they have a valid pair route. An ETH feed is never treated as a USD price.

## Sources and identity checks

The feed source is the [official Chainlink chain registry](https://raw.githubusercontent.com/smartcontractkit/documentation/main/src/features/data/chains.ts). The nine mainnet `rddUrl` inventories were fetched on 2026-10-16. `scripts/catalog-feeds.json` retains every one of their 2,102 rows, with the fields used for eligibility and identity review. `scripts/catalog-sources.json` records the source URLs and hashes of the downloaded source documents. A feed's `proxyAddress` is an oracle address, never a token contract address.

Token metadata was checked against the current [CoW token list](https://raw.githubusercontent.com/cowprotocol/token-lists/main/src/public/CowSwap.json), which has 281 entries, the historical application lists, [Aave's underlying-token list](https://raw.githubusercontent.com/bgd-labs/aave-address-book/main/tokenlist.json), [PancakeSwap's extended list](https://raw.githubusercontent.com/pancakeswap/token-list/main/lists/pancakeswap-extended.json), and the chain-specific CoinGecko, Sushi and 1inch lists. All per-chain URLs are in `scripts/catalog-sources.json`. These wider lists cover assets that are absent from the CoW list.

`scripts/catalog-identities.json` pins the exact chain, token contract and reviewed Chainlink base asset. The build does not discover contracts by joining token symbols. Full asset names, known protocol identities and bridge representations were checked before these pins were added. Multiple same-symbol contracts are not interchangeable. For example, a Base token named One Path cannot use the OP Optimism feed, MAGA cannot use the Official Trump feed, and Chevron shares cannot use the Convex Finance CVX feed.

Issuer references were checked where lists disagreed. [Avantis documents its Base AVNT contract](https://docs.avantisfi.com/avnt-token), despite an old metadata list calling it Veranta. [Lido's deployment directory](https://docs.lido.fi/deployed-contracts/) confirms BNB wstETH. [Lido's Avalanche deployment proposal](https://research.lido.fi/t/wsteth-on-avalanche-and-bnb-and-ownership-acceptance-by-lido-dao/5749) supplies the Avalanche wstETH contract, whose live metadata and dedicated WSTETH/USD feed were checked. The proposal is evidence of the deployed token address, not proof that the DAO accepted bridge ownership. [Trust Wallet's Binance-Peg ETH record](https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0x2170Ed0880ac9A755fd29B2688956BD959F933F8/info.json) identifies BNB Chain's `0x2170...` contract as ETH issued by Binance with a 1:1 ETH peg.

Canonical wrapped and reviewed bridged representations can use their underlying asset's price feed. This does not measure bridge, custodian or depeg risk. Staked shares and other derivatives require their own matching price feed. Native BTC feeds are not assigned to WBTC, cbBTC or BTCB by ticker. Dedicated WBTC and cbBTC feeds are used where available.

Two source exceptions are explicit. The old FRAX dollar contract uses `FRAX.OLD`; the FRAX governance feed, still named FXS/USD, uses the separate Frax Share contract. The xSUSHI feed's RDD `docs.quoteAsset` says USD, but its feed name and live contract description say ETH; the build uses ETH for that exact feed path.

## Images

All 306 advertised token entries use files under `public/assets/tokens`. There are 208 distinct image files. `scripts/catalog-identities.json` records each downloaded source URL. A known canonical asset's image can be reused for its reviewed bridge representation, such as USDC.e. The generic token fallback is not catalog coverage. Empty 1inch image responses were replaced with verified 1inch Network artwork.

## Audit and exclusions

`scripts/catalog-audit.json` classifies all 2,102 source rows as included, excluded or unresolved. It keeps the chain, feed path, proxy, base asset and reason. Hidden feeds, deprecating feeds and announced shutdowns are excluded. Reserve, NAV, ratio, exchange-rate, health-check, non-crypto and non-price data are excluded. Streams without a usable same-chain onchain proxy are excluded. Alternate proxies remain in the audit but do not create duplicate token entries.

There are 163 unresolved rows: 154 lack a verified exact same-chain token contract, and nine describe pool shares whose exact token identity and composition have not been approved. Some unresolved assets are native coins on other networks. Their feed deployment does not prove that a usable ERC20 exists on this network. Other unresolved assets might have a valid deployment that these sources do not establish. No arbitrary wrapper is used to fill that gap. Pool-share coverage remains unresolved and is not advertised.

Separate exclusions include 20 native BTC feed rows, 18 ETH-only rows with no common buy-token quote, 13 same-symbol identity conflicts, the Plasma USDT row where the actual listed token has its own USDT0 feed, and the Plasma XAUT row where the known bridged token is XAUT0. These are feed-row counts, not token counts.

The unresolved base assets are listed below. A repeated base asset can have several unresolved proxies. Pool names are preserved because a GLV or GM symbol alone does not identify a pool contract.

| Chain     | Unresolved base assets                                                                                                                                                                                                                                                                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ethereum  | AVAX, BNB, FIL, SOL, TAO, ZEC                                                                                                                                                                                                                                                                                                                                                                |
| Gnosis    | AVAX, BNB, DOGE, DOT, SOL                                                                                                                                                                                                                                                                                                                                                                    |
| Arbitrum  | 0G, AB, ADA, ADI, AERO, APT, AR, ASTER, ASTR, ATOM, AVAX, AXS, BERA, BNB, CORE, CRO, DOGE, DOT, EURC, GAS, GLV, HSK, HYPE, KAIA, LIT, LTC, MELANIA, MIMATIC, MKR, MNT, MON, NEAR, OP, ORDI, PAXG, PLUME, POL, PUMP, RLUSD, SEI, SHIB, SOL, STETH, STX, SUI, SYRUP, TAC, TAO, TIA, TON, TRUMP, USD1, VVV, WEMIX, WIF, WLFI, XDC, XMR, XPL, XRP, XTZ, ZEC, gmARB, gmBTC, gmETH, gmWBTC, gmWETH |
| Base      | ADA, AMP, APT, AVAX, BNB, LTC, MEW, MLN, PAXG, POL, RLUSD, SOL, STETH, SUI, XDC, XRP, ZEC                                                                                                                                                                                                                                                                                                    |
| Polygon   | ADA, ALGO, AVAX, BCH, BNB, CHZ, CVX, DASH, DOGE, DOT, ETC, FIL, HBAR, ICP, ILV, LTC, PAXG, QNT, SHIB, SOL, SUSDE, THETA, TRX, USDE, USDS, XLM, XMR, XRP, XTZ, ZEC                                                                                                                                                                                                                            |
| Avalanche | ADA, ARB, AXS, BNB, CHZ, CRV, DOT, FIL, GLV, MIMATIC, NEAR, POL, SHIB, USTC                                                                                                                                                                                                                                                                                                                  |
| BNB Chain | CRV, ICP, PAXG, POL, SAVAX, XLM                                                                                                                                                                                                                                                                                                                                                              |
| Linea     | AAVE, ARB, COMP, POL, USD1                                                                                                                                                                                                                                                                                                                                                                   |
| Plasma    | AUSD, ENA, USDS                                                                                                                                                                                                                                                                                                                                                                              |

A second issuer check did not establish Arbitrum EURC, RLUSD, USD1 or SYRUP token contracts. SYRUP is different from syrupUSDC. Ethena's key-address page did not establish Polygon USDe/sUSDe or Plasma ENA contracts. Plasma AUSD/USDS and Polygon USDS also remain unverified. These are open catalog gaps, not a claim that the contracts cannot exist.

## Build and verification

Run the offline build and invariant checks with:

```sh
python3 scripts/catalog.py
python3 scripts/catalog.py --check
```

The build reads the pinned identities and feed inventory, writes `src/lib/tokenCatalogData.json` and the audit, and checks unique contracts, local images, the buy-token map and a common quote route for every production entry. `src/lib/tokenCatalog.ts` exports `TOKEN_CATALOG`, `USD_TOKENS`, and `findTokenOracles` with concrete address and chain types. `src/lib/supportedTokens.ts` applies the EOA creation policy and the Sepolia test configuration. It exports explicit `oracles` per token; the optional `priceFeed` field is a direct USD feed only. Catalog lookup and offline checks need no network access. Runtime prices and placement checks still need RPC access.

To fetch the pinned image sources again, run `python3 scripts/catalog-assets.py`. To update token coverage, first review exact same-chain contracts against issuer or maintained list records, update the source evidence and identity pins, then regenerate and review the audit. A source refresh must keep every feed row accounted for. It must not turn unmatched symbols into automatic contract mappings.

Live checks are separate from unit tests:

```sh
python3 scripts/catalog-live.py --output /tmp/catalog-verification.json
```

Use `CATALOG_RPC_<chainId>` to replace a read-only public RPC endpoint. The script checks the RPC chain ID, token decimals and symbols, feed descriptions and decimals, and `latestRoundData`. Answers must be positive, update timestamps must be nonzero, and feed age must not exceed `1.5 * heartbeat + 60` seconds. It rejects timestamps more than five minutes in the future. The checked heartbeat, timestamp and observed age are kept in the output. No transactions are sent.

`scripts/catalog-verification.json` records the 2026-10-16 verification of all 303 production tokens and all 336 selected feeds. All nine chains passed. Sepolia is preserved test data and is outside the production eligibility and live-check policy. The EOA default maximum oracle age is 24 hours. A shorter user setting can reject a feed between heartbeat updates; choose a limit that fits the selected feeds. The snapshot does not promise future feed freshness or liquidity.
