# Token catalog

## Supported tokens

All nine mainnets below support new orders, with 85 approved sell token-and-chain pairs. Each chain has one fixed buy token. Only the listed sell tokens are enabled.

| Chain     | Chain ID | Fixed buy   | Approved sells                                                                |
| --------- | -------- | ----------- | ----------------------------------------------------------------------------- |
| Ethereum  | 1        | Native USDC | AAVE, cbBTC, COMP, CRV, ENS, LINK, SKY, UNI, WETH, WLFI                       |
| Gnosis    | 100      | USDT        | AAVE, COMP, CRV, GNO, GRT, LINK, SNX, SUSHI, UNI, WETH                        |
| Arbitrum  | 42161    | Native USDC | AAVE, ARB, COMP, ENA, GMX, GNS, LINK, PENDLE, UNI, WBTC, WETH                 |
| Base      | 8453     | Native USDC | AAVE, AERO, AVNT, cbBTC, cbDOGE, COMP, LINK, VIRTUAL, WETH                    |
| Polygon   | 137      | Native USDC | AAVE, COMP, CRV, GHST, LINK, SUSHI, UNI, WETH, WPOL                           |
| Avalanche | 43114    | Native USDC | AAVE.e, COMP.e, GMX, JOE, LINK.e, QI, UNI.e, WAVAX, WBTC, WETH.e, XAVA        |
| BNB Chain | 56       | USDT        | AAVE, ADA, ASTER, C98, Cake, ETH, LINK, LISTA, SOL, UNI, WBNB, WLFI, XRP, XVS |
| Linea     | 59144    | Native USDC | AAVE, COMP, LINEA, LINK, WETH, wstETH                                         |
| Plasma    | 9745     | Native USDC | ENA, LINK, weETH, WETH, WXPL                                                  |

Sepolia is test-only: WETH sells into 18-decimal USDC (test), using fixed test feeds. Ink and Solana are excluded.

The catalog also keeps metadata for 306 production contracts and three historical Sepolia records. A known token, image, or old order does not make a token eligible for new orders. Approvals use exact chain IDs and contract addresses, not symbols.

## Rules for adding a sell token

A token must pass all of these checks:

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

All nine fixed buy feeds were marked `stablecoinCapped` in the pinned review, with an upper limit of 1.05 USD. Above the bound, the feed retains its last onchain price. This can delay a trigger and later fail freshness checks. Each fixed buy approval accepts this risk separately. See [Chainlink's bounded feed behavior](https://docs.chain.link/data-feeds/selecting-data-feeds#bounded-market-price-feeds).

## Freshness and execution limits

Each feed's approved age ceiling is at most `floor(1.5 * heartbeat) + 60` seconds. Browser pair reads use one pinned block and enforce each feed's own ceiling, positive answers, complete rounds, and valid timestamps.

The deployed handler has one shared timeout for both feeds. The route ceiling is the larger of their approved age ceilings. The default, including reset to defaults, is the smaller of 24 hours and that route ceiling. Users can set a shorter timeout, but settings, restored drafts, and encoded placements cannot exceed the route ceiling.

For example, the original Ethereum sell feeds have a 5,460-second ceiling; USDC has a 124,260-second ceiling. Applying the sell ceiling to USDC would reject normal USDC rounds. The shared handler timeout can therefore allow older sell answers at execution than the browser allows.

The handler normalizes feed decimals but does not check round completeness, future timestamps, or L2 sequencer uptime and recovery. Arbitrum, Base, and Linea approvals accept the missing execution-time sequencer protection. Creation-time checks cannot protect later execution during an outage or recovery. See [execution evidence](../scripts/oracle-execution-verification.json) and [Chainlink's consumer requirements](https://docs.chain.link/data-feeds/using-data-feeds). Read-only verification does not prove end-to-end execution or future feed quality.

## Add or review a token

1. Review the exact chain, token contract, economic class, representation, feed unit, and execution limits above. Add missing identity and image evidence to [`catalog-identities.json`](../scripts/catalog-identities.json). Resolve display metadata from a pinned source or a reviewed entry in [`catalog-metadata-overrides.json`](../scripts/catalog-metadata-overrides.json). Keep historical metadata when old orders need it.
2. Add the exact official source row to [`catalog-feeds.json`](../scripts/catalog-feeds.json). Record its directory URL, date, and digest in [`catalog-sources.json`](../scripts/catalog-sources.json). Review the lifecycle, price method, heartbeat, and both feed legs. Missing or changed mappings must fail review.
3. Observe the proposed mappings before approval:

   ```sh
   python3 scripts/catalog-live.py --candidates /path/to/proposed-policy.json --output /tmp/catalog-candidates.json
   ```

   This read-only report is marked `candidate-review` and does not enable creation. `CATALOG_RPC_<chainId>` overrides the read-only RPC endpoint. A skipped or `not-performed` check is not a pass.

4. Review the observations and execution evidence. Pin accepted observations in the policy's `verificationFile`, then record the exact approval and fingerprint. Candidate observations alone cannot renew approvals. Live verification without `--candidates` checks approved production feeds only.
5. Generate the catalog, inspect the diff, and run the checks below. Do not edit the generated JSON directly.

## Files and checks

| File                                                                                      | Purpose                                                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`scripts/catalog-policy.json`](../scripts/catalog-policy.json)                           | Exact feed approvals and chain execution decisions                                   |
| [`scripts/catalog-policy-verification.json`](../scripts/catalog-policy-verification.json) | Pinned read-only observations, including separate review batches and failed attempts |
| [`scripts/catalog-feeds.json`](../scripts/catalog-feeds.json)                             | 94 approved official source rows; not a full Chainlink inventory                     |
| [`scripts/catalog-sources.json`](../scripts/catalog-sources.json)                         | Source URLs, dates, hashes, and historical review scope                              |
| [`scripts/catalog-identities.json`](../scripts/catalog-identities.json)                   | Exact identities, economic classes, and image evidence                               |
| [`scripts/catalog-metadata-sources.json`](../scripts/catalog-metadata-sources.json)       | Pinned display-metadata sources and priority                                         |
| [`scripts/catalog-metadata-overrides.json`](../scripts/catalog-metadata-overrides.json)   | Reviewed local metadata gaps and field corrections                                   |
| [`src/lib/tokenCatalogData.json`](../src/lib/tokenCatalogData.json)                       | Checked-in runtime snapshot                                                          |

```sh
corepack pnpm@9 prepare:catalog
corepack pnpm@9 generate:catalog
corepack pnpm@9 check:assets
corepack pnpm@9 check:catalog
python3 -m unittest discover -s scripts -p 'test_catalog*.py'
corepack pnpm@9 test:jest --runInBand
```

`prepare:catalog` downloads and verifies pinned metadata and missing images. A cold cache needs network access; a warm cache works offline only when hashes match. There is no latest-list or stale-data fallback. Images keep their local URLs and full digests; changed bytes are an error. Keep baseline assets and required fallbacks tracked. Untrack an image only after a cold restoration proves its digest.

`generate:catalog` is offline and writes the runtime snapshot. `check:assets` and `check:catalog` verify without fetching or rewriting. App development, app builds, and CI run preparation and checks; they do not silently regenerate changed output. Ordinary Jest tests use the runtime snapshot and image manifest without network access or prepared images.

For an input review, `python3 scripts/catalog.py --reports .cache/token-catalog/reports` also writes audit and metadata reports. Do not commit the reports or combine `--reports` with `--check`. Reports cover retained inputs, not the removed historical inventory.

To refresh display lists, select an explicit revision, review hashes and corrections, prepare, regenerate, and inspect the diff. Corrections fail if expected upstream values change or a correction becomes redundant. New upstream tokens do not enter the catalog automatically; display metadata never approves a feed.

## Existing orders

Existing orders keep their saved feeds. Removing creation eligibility does not rewrite an order or make its feeds safe. `findKnownToken` retains metadata for historical orders, including the old Gnosis USDC.e buy token. Ethereum WBTC is not in the retained identity inventory.

Order display, approval repair, and cancellation remain available subject to ownership and state checks. Saved but unsubmitted placements must pass the current policy before publication or transaction construction.
