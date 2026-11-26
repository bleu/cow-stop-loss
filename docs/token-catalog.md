# Token catalog

## Supported tokens

The nine mainnets in this table support 231 approved sell token-and-chain pairs. The [Robinhood sell list](#robinhood-chain) is below. Each chain has one fixed buy token. Only the listed sell tokens are enabled.

| Chain     | Chain ID | Fixed buy   | Approved sells                                                                                                                                                                                                                                                                                    |
| --------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ethereum  | 1        | Native USDC | 1INCH, AAVE, APE, ARB, BAL, cbBTC, COMP, CRV, CVX, ENS, FXS, GRT, IMX, KNC, LINK, MKR, PAXG, RDNT, RPL, RSR, SAND, SKY, SNX, SOL, SPELL, SUSHI, SXT, tBTC, UNI, WAVAX, WBNB, WBTC, WETH, WLFI, XCN, YFI, ZRX                                                                                            |
| Gnosis    | 100      | USDT        | AAVE, COMP, CRV, GNO, GRT, LINK, SNX, SUSHI, UNI, WBTC, WETH, YFI                                                                                                                                                                                                                                 |
| Arbitrum  | 42161    | Native USDC | 1INCH, AAVE, APE, APT, ARB, ATH, AXL, axlATOM, axlTIA, Cake, COMP, CRO, CRV, CVX, ENA, GMX, GNS, GRT, LDO, LINK, MAGIC, MNT, MORPHO, PENDLE, PEPE, RDNT, RSR, SHIB, SNX, SOL, SPELL, SUI, SUSHI, tBTC, UNI, WAVAX, WBNB, WBTC, WETH, WLFI, WOO, YFI, ZRO                                          |
| Base      | 8453     | Native USDC | AAVE, AERO, AMP, AVNT, AXL, axlOP, axlWBTC, cbADA, cbBTC, cbDOGE, cbLTC, cbXRP, cbZEC, COMP, DEGEN, HOME, LINK, MLN, Mog, MORPHO, PEPE, RSR, SNX, SOL, tBTC, VIRTUAL, VVV, WELL, WETH, YFI, ZRO                                                                                                   |
| Polygon   | 137      | Native USDC | 1INCH, AAVE, APE, axlETH, AXS, BAL, BAT, CHZ, COMP, CRV, CVX, GHST, GRT, LINK, MANA, QNT, SAND, SHIB, SNX, SOL, SUSHI, UNI, WAVAX, WBNB, WBTC (2 contracts), WETH (2 contracts), WPOL                                                                                                             |
| Avalanche | 43114    | Native USDC | AAVE.e, BAT.e, BTC.b, COMP.e, GLV [WAVAX-USDC], GMX, JOE, LINK.e, QI, SNX.e, SUSHI.e, UNI.e, WAVAX, WBNB, WBTC, WBTC.e, WETH, WETH.e, WMATIC, XAVA, YFI.e                                                                                                                                         |
| BNB Chain | 56       | USDT        | 1INCH, AAVE, ADA, ASTER, ATOM, AVAX, AXS (2 contracts), BCH, BTCB, C98, Cake, COMP, CRV, DOGE, DOT, ETH, FET, FIL, INJ, LINK, LISTA, LTC, MASK, NEAR, ONT, RDNT, SHIB (2 contracts), SOL (2 contracts), SUSHI (2 contracts), TREE, TRX, UNI, WAVAX, WBNB, WBTC, WETH, WLFI, WMATIC, XRP, XTZ, XVS |
| Linea     | 59144    | Native USDC | AAVE, COMP, LINEA, LINK, WBTC, WETH, wstETH                                                                                                                                                                                                                                                       |
| Plasma    | 9745     | Native USDC | ENA, LINK, weETH, WETH, WXPL, XAUt0                                                                                                                                                                                                                                                                      |

Sepolia is test-only: WETH sells into 18-decimal USDC (test), using fixed test feeds. Ink and Solana are excluded.

The catalog keeps metadata for 360 contracts on the nine mainnets above, 38 Robinhood Chain contracts, and three Sepolia records. A known token, image, or old order does not make a token eligible for new orders. Approvals use exact chain IDs and contract addresses, not symbols.

## Robinhood Chain

The app allows 37 exact sell contracts on [Robinhood Chain](supported-networks.md#robinhood-chain) (4663). All sell into USDG, using direct USD feeds for both legs. USDG has six decimals and is buy-only. Staging requires its exact uncapped Chainlink `RefPrice` feed with an 86,400-second heartbeat.

| Group | Approved sells |
| --- | --- |
| Crypto (4) | ENA, LINK, WBTC, WETH |
| Stock Tokens and funds (33) | AAPL, AMD, AMZN, ASML, BABA, CLSK, COIN, CRCL, CRWV, DELL, EWY, GME, GOOGL, INTC, IONQ, META, MSFT, MSTR, MU, NBIS, NVDA, ORCL, PLTR, QQQ, RGTI, RKLB, SLV, SNDK, SPCX, SPY, TSLA, TSM, USO |

Stock Token approvals are specific to Robinhood Chain. Each uses the exact issuer token and UID and a Chainlink onchain `Equity` / `Price` feed with method `primaryTokenizedPrice` and session `us_equities_24/5`. The feed already includes the issuer multiplier. A `custom` category requires its own dated approval for that exact feed. This exception does not apply to other chains or allow 24/7 smoothed references or raw share prices.

The [CoW Swap RWA list](https://files.cow.fi/token-lists/CoinGeckoRwa.4663.json) matches these Stock Tokens and funds by contract address, but uses the same Robinhood feather for each image. The app pins images for the underlying stocks and funds from the [Ondo token list](https://raw.githubusercontent.com/ondoprotocol/ondo-global-markets-token-list/c2741088e2a3b323ee8c42bcbf6f010cd7476f86/tokenlist.json), with CleanSpark from the [Backed xStocks list](https://raw.githubusercontent.com/backed-fi/cowswap-xstocks-tokenlist/91f6da6946dc6a932b76292cc784ec202a37a2f6/tokenlist.json). Only the images come from those lists. The token contracts and price feeds remain Robinhood-specific.

## Rules for adding a sell token

A token must pass all of these checks. For an exact Robinhood Stock Token approval, the Robinhood feed type and category rules above apply in step 2.

1. It is classified as `volatile` on that chain. USD-pegged tokens, USD-linked yield shares, other stable assets, unclassified tokens, and the fixed buy token cannot be sold. A USD-quoted price does not make a token USD-pegged; FXS governance is separate from the old FRAX dollar contract.
2. Its Chainlink source is active, visible, has an onchain proxy, and is a `Crypto` / `Price` feed in the `low`, `medium`, `high`, `veryhigh`, or `new` category. Custom, hidden, deprecating, and unknown categories are excluded.
3. The feed quotes USD or ETH directly, in the held token's unit. Both sell and buy must have an approved feed in the same quote. Routing prefers common ETH, then common USD. There is no assumed dollar peg, multi-feed conversion, arbitrary token import, or manual oracle override. ETH quotes are not used as direct USD estimates.
4. The exact token, source path, and primary proxy have a reviewed approval in [`catalog-policy.json`](../scripts/catalog-policy.json). The approval records identity, representation, price method, source evidence, review date, expected description and decimals, and a freshness ceiling. The chain also needs execution and arithmetic review evidence. A matching symbol or risk category is insufficient; alternate proxies are not selected automatically.
5. Read-only verification confirms the token's symbol and decimals, the feed's description and decimals, and a complete round with a positive answer and a nonzero timestamp that is not in the future. The answer must be within the approved age ceiling. Feed decimals must be 0 through 18 because the handler can truncate higher-decimal prices to zero.
6. The approval fingerprint matches the reviewed identity, complete source row, and pinned observations. Changing these inputs requires another review; a metadata refresh cannot renew an approval.

All five allowed categories use the same exact-token review. High, Very High, and New feeds can have less reliable pricing; the category does not guarantee quality or approve a route. Chainlink uses `veryhigh` for Very High, separately from `custom`. The price method alone is not a reason to exclude a feed. Review must establish what the feed measures and record its limits. Calculated, backing-based, and onchain prices can differ from the traded token's market price. See [Chainlink's feed selection guide](https://docs.chain.link/data-feeds/selecting-data-feeds) and [category definitions](https://github.com/smartcontractkit/documentation/blob/main/src/db/feedCategories.ts).

### Wrappers and bridged tokens

A native wrapper needs evidence that its contract preserves the intended unit. A bridged WETH token does not qualify as a local native wrapper.

A bridged token can use its underlying asset's feed at an assumed 1:1 token-unit relationship. Its exact approval must use `bridged-underlying` and keep identity, representation, and unit evidence. A separate per-token `representationSuitability` decision is no longer required; existing decisions remain valid and are checked when present. Original issuance on the chain is not required. A matching ticker alone does not establish the relationship.

The underlying price does not measure bridge depegs, custody loss, or failed redemption. These events can make the trigger wrong for the token held. The 1:1 pricing assumption accepts that risk; it does not guarantee backing or redemption.

New staking-share routes are deferred for case-specific review. Existing approved Linea wstETH and Plasma weETH routes stay enabled. A share is not necessarily one unit of its backing asset: a bridge assumption for wstETH does not make one wstETH equal one ETH.

### Bounded feeds

Bounded sell feeds are excluded. A bounded USD feed is allowed only for an exact fixed buy token with a separate, dated `boundedPriceSuitability` approval and evidence. The token relationship must be `exact-asset` or reviewed `bridged-underlying`; all other source checks still apply.

In the 2026-11-17 directory screening, bounded sources covered USDC, USDT, and an Arbitrum DAI feed; none of the screened volatile sell candidates was blocked by this flag. Stablecoins are already excluded as sells by the economic-class rule. The bounded-feed rule also protects against any future bounded sell source.

The nine mainnet buy feeds outside Robinhood were marked `stablecoinCapped` in the pinned review, with an upper limit of 1.05 USD. Above the bound, the feed retains its last onchain price. This can delay a trigger and later fail freshness checks. Each of those fixed buy approvals accepts this risk separately. Robinhood uses an uncapped USDG feed. See [Chainlink's bounded feed behavior](https://docs.chain.link/data-feeds/selecting-data-feeds#bounded-market-price-feeds).

## Freshness and execution limits

Each feed's approved age ceiling is at most `floor(1.5 * heartbeat) + 60` seconds. Browser pair reads use one pinned block and enforce each feed's own ceiling, positive answers, complete rounds, and valid timestamps.

The deployed handler has one shared timeout for both feeds. The route ceiling is the larger of their approved age ceilings, except for Robinhood Stock Tokens, which use the smaller ceiling. The default, including reset to defaults, is the smaller of 24 hours and the route ceiling. Users can set a shorter timeout, but settings, restored drafts, and encoded placements cannot exceed the route ceiling.

All approved Robinhood feeds have a 24-hour (86,400-second) freshness ceiling. Order review warns that Stock Token feeds do not update outside their 24/5 session. The handler has no market-session check. A stop-loss can still execute after close while both prices are within the order's freshness timeout. Once a feed becomes stale, the order cannot trigger until both feeds are fresh again.

For example, the original Ethereum sell feeds have a 5,460-second ceiling; USDC has a 124,260-second ceiling. Applying the sell ceiling to USDC would reject normal USDC rounds. The shared handler timeout can therefore allow older sell answers at execution than the browser allows.

The handler normalizes feed decimals but does not check round completeness, future timestamps, or L2 sequencer uptime and recovery. Arbitrum, Base, and Linea approvals accept the missing execution-time sequencer protection. Creation-time checks cannot protect later execution during an outage or recovery. See [execution evidence](../scripts/oracle-execution-verification.json) and [Chainlink's consumer requirements](https://docs.chain.link/data-feeds/using-data-feeds). Read-only verification does not prove end-to-end execution or future feed quality.

## Add or review a token

Use the same staging process for one token or a batch. Review the exact chain, token contract, economic class, representation, feed unit, and execution limits above. Use a new output directory for each scan or stage.

1. Capture the nine production Chainlink directories outside Robinhood. The scan checks source rows and reports possible contract matches from pinned token lists. These matches are search hints and do not prove what a feed prices.

   ```sh
   corepack pnpm@9 catalog scan --output .cache/token-catalog/directories
   ```

   For a Robinhood change, capture chain 4663 alone and pass that output directory to `stage` instead.

   ```sh
   corepack pnpm@9 catalog scan --chain 4663 --output .cache/token-catalog/robinhood-directories
   ```

2. Create an evidence file with an `approvals` list. Staging takes USD route mappings. Use the exact fields from [`catalog-policy.json`](../scripts/catalog-policy.json), including the source path and primary proxy, without `snapshotFingerprint` or `verificationBatch`. Include issuer, wrapper, or bridge evidence as applicable. For contracts missing from [`catalog-identities.json`](../scripts/catalog-identities.json), supply `newIdentities` with a logo source and evidence for the economic class. Use `metadataOverrides` only for gaps or corrections in the pinned display lists. Keep historical metadata when old orders need it.
3. Stage the reviewed mappings. The command checks the exact source rows and verifies both the sell and fixed buy price legs. A failed buy check blocks all proposed routes that use it. A skipped check does not pass. Set `CATALOG_RPC_<chainId>` to override a read-only RPC endpoint. Reads can come from different blocks. They do not prove identity or bridge claims, measure liquidity, or predict whether an order will fill.

   ```sh
   corepack pnpm@9 catalog stage --inventory .cache/token-catalog/directories --evidence /path/to/mappings.json --output .cache/token-catalog/staged
   ```

4. Review `results.json` and the proposed changes. Staging writes proposed catalog inputs for passing mappings only and does not change the runtime snapshot. The staged inputs retain exact source rows and their provenance, and record named observations for both price legs. New observations stay separate from older batches, so a new token can share a feed without renewing an existing approval.
5. Apply the reviewed files from the staged `scripts` and `public` directories, when present. Run `corepack pnpm@9 catalog prepare` if local pinned inputs are missing. Run `corepack pnpm@9 catalog generate` to rewrite the runtime snapshot, review the diff, then run `corepack pnpm@9 catalog check`. Do not edit the snapshot directly.

To diagnose feeds that the policy already approves, run `corepack pnpm@9 catalog observe --output .cache/token-catalog/approved-observations.json`. The report covers approved feeds only. It does not change the policy or renew an approval.

### Discover issuer-priced assets

`catalog instruments` is an optional research command. It uses pinned issuer records and exact Chainlink paths and proxies to prepare gold-token mappings. It checks at least seven days of consecutive feed rounds, including updates on both weekend days. To verify both live price legs, review the proposed mappings in `evidence.json` and pass that file to the [staging process above](#add-or-review-a-token). The `instruments.json` report records source URLs, digests, and any checks that failed.

```sh
corepack pnpm@9 catalog instruments --inventory .cache/token-catalog/directories --output .cache/token-catalog/instruments
```

The 2026-11-23 batch added Ethereum PAXG and Plasma XAUt0, both into native USDC. Both sell feeds passed the publication and live checks. Chainlink classifies these token-unit feeds as `Crypto` / `Price`, so the production feed rule did not change. XAUT/USD prices the XAUT that backs XAUt0 at 1:1. It does not price bridge or custody risk. The Plasma token list spells the symbol `XAUT0`; the catalog uses `XAUt0`, as returned by the contract.

The discovery run found 20 Ondo feed rows on Ethereum and 37 Robinhood feed rows on Robinhood Chain. Of these, 14 Ondo and 33 Robinhood rows had the 24/5 onchain token price method. The rest used other methods or sessions. Counts are feed rows and can include more than one proxy for a token. A symbol match in an issuer registry is a hint. It does not approve a contract or select a proxy. The Robinhood directory is separate from the nine default mainnet snapshots. Use `--robinhood-registry` to supply a captured issuer API response if direct access fails. The report records that the snapshot was supplied and gives its digest.

Only the exact [Robinhood routes](#robinhood-chain) are approved in this group. Candidates on other chains, including the Ondo Stock Token feeds, remain research only. The Robinhood approvals accept the current handler's lack of a market-session guard and separate execution-time checks for each feed. See [Chainlink feed research](chainlink-feed-research.md).

## Files and checks

| File                                                                                      | Purpose                                                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`scripts/catalog-policy.json`](../scripts/catalog-policy.json)                           | Exact feed approvals and chain execution decisions                                   |
| [`scripts/catalog-policy-verification.json`](../scripts/catalog-policy-verification.json) | Pinned read-only observations, including separate review batches and failed attempts |
| [`scripts/catalog-feeds.json`](../scripts/catalog-feeds.json)                             | 267 approved official source rows, including 38 Robinhood rows; not a full Chainlink inventory |
| [`scripts/catalog-sources.json`](../scripts/catalog-sources.json)                         | Source URLs, dates, hashes, and historical review scope                              |
| [`scripts/catalog-identities.json`](../scripts/catalog-identities.json)                   | Exact identities, economic classes, and image evidence                               |
| [`scripts/catalog-metadata-sources.json`](../scripts/catalog-metadata-sources.json)       | Pinned display-metadata sources and priority                                         |
| [`scripts/catalog-metadata-overrides.json`](../scripts/catalog-metadata-overrides.json)   | Reviewed local metadata gaps and field corrections                                   |
| [`src/lib/tokenCatalogData.json`](../src/lib/tokenCatalogData.json)                       | Checked-in runtime snapshot                                                          |

`corepack pnpm@9 catalog prepare` restores missing pinned metadata and images and verifies the local files. A cold cache needs network access. A warm cache works offline when all required files are present and match their digests. There is no latest-list or stale-data fallback. Images keep their local URLs and full digests. Changed bytes are an error. Keep baseline assets and required fallbacks tracked. Untrack an image only after a cold restoration proves its digest.

`corepack pnpm@9 catalog prepare --check` also compares the checked-in runtime snapshot. It is the single catalog gate for app development and builds. CI runs it through `pnpm build`. The gate can restore missing inputs, but it does not rewrite the snapshot.

`corepack pnpm@9 catalog generate` verifies local pinned metadata and images offline and rewrites the runtime snapshot. `corepack pnpm@9 catalog check` verifies the same local inputs and compares the snapshot offline without writing files. The [snapshot builder](../scripts/token_catalog/snapshot.py) uses the retained inputs in the table above.

For an input review, `corepack pnpm@9 catalog generate --reports .cache/token-catalog/reports` also writes `catalog-audit.json` and `catalog-metadata-report.json`. These optional reports cover retained inputs. Do not commit them. Ordinary Jest tests use the runtime snapshot and image manifest without network access or prepared images.

To refresh display lists, select an explicit revision, review hashes and corrections, prepare, regenerate, and inspect the diff. Corrections fail if expected upstream values change or a correction becomes redundant. New upstream tokens do not enter the catalog automatically; display metadata never approves a feed.

## Existing orders

Existing orders keep their saved feeds. Removing creation eligibility does not rewrite an order or make its feeds safe. `findKnownToken` retains metadata for historical orders, including the old Gnosis USDC.e buy token.

Order display, approval repair, and cancellation remain available subject to ownership and state checks. Saved but unsubmitted placements must pass the current policy before publication or transaction construction.
