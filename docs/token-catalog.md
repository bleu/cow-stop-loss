# Token catalog

## Current creation status

Ethereum supports WETH, LINK, and UNI sells into native USDC. These three routes have exact feed approvals and live observations. Other production networks remain unavailable for new orders. Network selection, historical order display, approval repair, and cancellation remain available, subject to their normal ownership and state checks. Sepolia retains its WETH-only sell and 18-decimal USDC test buy configuration. Those fixed test feeds are not production token-specific prices.

The dated policy review marked all nine designated USD buy feeds as `stablecoinCapped` in the original Chainlink inventory. Chainlink's [bounded market-price documentation](https://docs.chain.link/data-feeds/selecting-data-feeds#bounded-market-price-feeds) states that a bounded feed does not publish a new price above its upper limit; the proxy returns its last onchain price. The Ethereum native USDC buy feed has a separate `boundedPriceSuitability` decision in the policy. Its current upper limit is 1.05 USD. Above that limit, the retained answer can delay a stop-loss trigger and later fail freshness. This residual risk is accepted for this exact fixed buy leg only. Bounded sells and unreviewed buy feeds remain excluded. A `USD` label, low-risk category, or successful round alone is not approval.

The deployed StopLoss handler also lacks sequencer-uptime and recovery checks. [Chainlink requires these checks for L2 consumers](https://docs.chain.link/data-feeds/using-data-feeds). A check when an order is created cannot protect its later execution. Arbitrum, Base, and Linea creation therefore also require a compatible execution-time guard. No new handler is deployed by this change. See [execution evidence](../scripts/oracle-execution-verification.json).

## Known metadata is not creation eligibility

The metadata inventory retains 303 production token contracts and three historical Sepolia records. All 306 have local images and explicit economic classifications. The production classifications are 207 volatile, 84 USD-pegged, seven USD-linked, and five other stable assets. Classification describes exposure, not current peg health, liquidity, bridge safety, or feed approval.

| Chain     | Chain ID | Known production contracts | Fixed buy metadata | Approved production sells |
| --------- | -------- | -------------------------- | ------------------ | ------------------------- |
| Ethereum  | 1        | 85                         | Native USDC        | 3                         |
| Gnosis    | 100      | 17                         | USDT               | 0                         |
| Arbitrum  | 42161    | 44                         | Native USDC        | 0                         |
| Base      | 8453     | 38                         | Native USDC        | 0                         |
| Polygon   | 137      | 25                         | Native USDC        | 0                         |
| Avalanche | 43114    | 28                         | Native USDC        | 0                         |
| BNB Chain | 56       | 48                         | USDT               | 0                         |
| Linea     | 59144    | 8                          | Native USDC        | 0                         |
| Plasma    | 9745     | 10                         | Native USDC        | 0                         |

Ink and Solana remain excluded. The fixed buy token is not a selectable sell. Dollar-pegged assets, their bridged forms, dollar-linked yield shares, other stable assets, and unclassified assets are excluded from new sells. Classification is pinned by exact chain and token contract, not a ticker rule. A volatile asset with a USD-quoted feed is not a dollar-pegged asset. FXS governance is separate from the old FRAX dollar contract.

`findKnownToken` retains catalog and historical metadata for existing orders, including Ethereum WBTC and the old Gnosis USDC.e buy token. Saved orders keep their original feeds for pair-price reads. Removing creation eligibility does not rewrite an order or make its saved feeds safe. Existing orders can still be cancelled or repaired when their ownership and state allow it. Saved but unsubmitted placements must pass the current policy before publication or transaction construction.

## Approval requirements

`scripts/catalog-policy.json` is the explicit approval source. Each feed approval must identify the exact chain, token contract, quote, path, and proxy. It must record identity, representation, methodology and source evidence, review date, expected live description and decimals, a freshness ceiling, and a fingerprint of its pinned inputs. The chain must also have approved execution evidence. Both sell and buy legs must qualify. Inventory refreshes cannot silently select another proxy or turn matching symbols into approved routes.

Initial review is restricted to active `low`-category reference market-price feeds. [Chainlink describes its categories and feed methods](https://docs.chain.link/data-feeds/selecting-data-feeds). The category is a review input, not a guarantee. Medium, high, new, custom, hidden, deprecating, unknown, calculated, exchange-rate, and unsupported methods are excluded in this pass. A bounded feed needs an additional fixed-buy suitability decision, date, and evidence. The exception must match the exact fixed buy token, USD quote, and exact-asset relationship; it does not bypass other source checks.

An underlying asset feed does not measure the price or redemption risk of a bridge claim, custodian claim, or derivative. Such substitutions are excluded. A native asset wrapper can qualify only with explicit evidence that its wrapping contract preserves the intended unit. A bridged WETH contract does not inherit that exception. Approval must assess both feed suitability and the handler's arithmetic and execution limits.

Approved pairs keep the existing common-ETH-first, otherwise common-USD routing rule. Feed decimals are normalized before division; approved feeds are restricted to 0 through 18 decimals to avoid the handler's truncation risk. Direct USD estimates remain separate: an ETH quote is not a USD price. No assumed dollar peg, synthetic conversion, arbitrary import, or manual oracle override is allowed. Each approved age ceiling must be no larger than `floor(1.5 * heartbeat) + 60` seconds. Browser pair reads enforce each feed's own ceiling. The handler has one shared timeout, so its route ceiling is the larger of the two feed ceilings. For the Ethereum routes, sell feeds have a 3,600-second heartbeat and a 5,460-second ceiling; USDC has an 82,800-second heartbeat and a 124,260-second ceiling. Applying the sell ceiling to USDC would reject normal USDC rounds. A user can choose a shorter shared timeout but cannot exceed the route ceiling through settings, a restored draft, or encoded placement input. At execution, the shared timeout also permits older sell answers than browser reads; this accepted handler limit remains part of the route review.

Browser reads retain block-pinned, positive-answer, complete-round, nonzero/nonfuture timestamp, and freshness checks. These checks do not add missing checks to the deployed handler. The verified handler normalizes prices but does not check round completeness, future timestamps, or sequencer state. These limits must remain part of any later route approval.

## Sources and audit history

The original source inventory was fetched on 2026-10-16 from the [official Chainlink chain registry](https://raw.githubusercontent.com/smartcontractkit/documentation/main/src/features/data/chains.ts). `scripts/catalog-sources.json` retains its source URLs, dates, counts, and hashes, including the original token-metadata references. Those dated sources include CoW, issuer references, Aave, and chain-specific maintained lists; they are identity inputs, not proof of oracle suitability. The full 2,102-row feed inventory is no longer retained. Its mutable source URLs cannot reliably reproduce the removed snapshot. The current display-metadata sources are separate and pinned as described below.

The former build selected 336 proxies and the 2026-10-16 live snapshot reported no check failures. It accepted some underlying-feed substitutions, selected alternates by ordering, required only a nonempty token symbol, and checked feed descriptions only for their quote. The unused `scripts/catalog-verification.json` snapshot has been removed. Its dated scope, digest, and limits remain in `scripts/catalog-sources.json`. This summary does not preserve the detailed observations or provide equivalent evidence. Those old observations were not approval under the current policy.

`scripts/catalog-feeds.json` now contains only exact official feed rows under candidate or approval review. It retains four Ethereum rows fetched on 2026-10-19 from the [official feed directory](https://reference-data-directory.vercel.app/feeds-mainnet.json): `eth-usd`, `link-usd`, `uni-usd`, and `usdc-usd`. Only those exact proxies qualify; SVR alternates are not selected. Builds do not fetch the latest feed directory or select routes. Optional audit reports cover the retained reviewed input only; they do not reconstruct or account for every row of the removed historical inventory. Unresolved identities, unsupported methods, unapproved routes, and missing execution safeguards must still reject a route. Metadata coverage, approved creation routes, and historical order support remain separate counts.

The current `scripts/catalog-policy-verification.json` records actual Ethereum candidate observations on 2026-10-19: token symbols and decimals, feed descriptions and decimals, complete positive rounds, and valid freshness with no reported issues. The policy separately approves the reviewed rows and binds them to those observations. The Ethereum handler runtime also matches the retained compiled SHA-256. Other networks are explicitly skipped. None of these checks proves successful end-to-end execution or future feed quality.

## Display metadata

`scripts/catalog-metadata-sources.json` pins 18 files from [cowprotocol/token-lists at revision `60b9905e7eeb10af657700f749c143ab68953df4`](https://github.com/cowprotocol/token-lists/tree/60b9905e7eeb10af657700f749c143ab68953df4): one CoW Swap list, nine CoinGecko lists, and eight Uniswap lists. Each source has an immutable URL, a content hash, and an explicit priority. Selection uses exact chain and contract matches for reviewed local identities. A new upstream token does not enter the catalog automatically.

`scripts/catalog-identities.json` keeps the compact local identity inventory: chain, address, economic classification, evidence, and local image paths with `logoSource` and full `logoSha256` digests. It does not duplicate display names, symbols, or decimals. `scripts/catalog-metadata-overrides.json` holds full metadata for local gaps and field corrections for matched sources. The pinned sources cover 270 known records; the remaining 33 production records and three Sepolia records use full local entries. Reviewed corrections keep the existing metadata for externally matched records. All 306 known records keep their exact display metadata, fixed buy tokens, and local images. Historical records and saved feeds remain available.

The generated runtime snapshot is `src/lib/tokenCatalogData.json` and remains checked in. Source manifests, identities, overrides, and approval evidence are also checked in; downloaded lists and optional reports are not. Normal generation writes only the runtime snapshot. Use `--reports DIR` to also write `catalog-audit.json` and `catalog-metadata-report.json` inside that directory. The metadata report records source selections, overridden fields, and counts without copying full token metadata. Review these reports when changing inputs, but do not commit them. The browser and ordinary tests read the runtime snapshot without asynchronous list requests. List-server availability and CORS settings cannot change runtime metadata.

External display metadata does not approve oracle routes. `scripts/catalog-policy.json` keeps exact approval fingerprints; a metadata refresh cannot renew them automatically. Only the three explicit Ethereum sell routes are enabled. Historical token support does not make its saved feeds suitable for a new order.

## Build and verification

```sh
corepack pnpm@9 prepare:catalog
corepack pnpm@9 check:assets
corepack pnpm@9 check:catalog
python3 -m unittest discover -s scripts -p 'test_catalog*.py'
corepack pnpm@9 test:jest --runInBand
```

`prepare:catalog` runs `python3 scripts/catalog_metadata.py` and then `python3 scripts/catalog-assets.py`. Metadata preparation downloads and verifies pinned bytes into ignored `.cache/token-catalog`; use `--cache-dir` on the metadata helper to choose another cache directory. A cold cache needs network access. A warm cache works offline only when its bytes match the pinned hashes. Corrupt data or a hash mismatch fails the command; a network failure without verified cached bytes also fails. There is no latest-list or stale-data fallback. Both helpers use Python's standard library.

`prepare:assets` runs the image helper on its own. It groups shared `localLogo` paths, requires matching full `logoSha256` digests, checks existing files, and downloads only missing images from reviewed `logoSource` URLs. Downloads are bounded and written atomically after validation. A changed image is an error; the helper does not replace artwork or rename a local URL. `check:assets` uses `--check` to verify files without fetching. Use the image helper's `--public-dir DIR` option to prepare or check a separate public output directory. Verified existing files allow offline use. Keep baseline assets and any image whose exact bytes cannot be restored committed; remove an image from tracking only after a cold restoration proves its full digest.

`python3 scripts/catalog.py` is offline. It loads verified cached metadata, resolves reviewed inputs, and writes the runtime snapshot. `--check` validates the reviewed inputs and runtime snapshot without rewriting files, downloading sources, or requiring optional reports. Do not combine `--check` with `--reports`. `dev:next` and `build:next` run preparation, the offline image check, the offline catalog check, and Next.js in sequence. The combined `dev` and `build` commands run app and documentation tasks in parallel, but keep those steps in sequence within the app task. They do not silently regenerate changed output. CI runs preparation and both checks, then the Python catalog tests and Jest. Ordinary Jest tests check the reviewed image manifest without requiring prepared images or network access.

## Maintenance

To add a known token, first review its exact chain and contract. Add its identity, classification evidence, `localLogo`, `logoSource`, and full `logoSha256` to `scripts/catalog-identities.json`; keep any required identity and wrapper evidence. Resolve display metadata from a pinned source or add a reviewed full local gap entry in `scripts/catalog-metadata-overrides.json`. Use field corrections only where the selected source differs from reviewed metadata. Do not infer an identity or classification from a symbol. Keep removed upstream tokens locally when historical orders need their metadata.

To refresh lists, select an explicit revision and update source hashes after review. Prepare the bytes, regenerate, and inspect source selection, runtime metadata, provenance, and correction drift. Corrections pin expected upstream field values; resolution fails when those values change or a correction becomes redundant. Check whether old corrections are still needed and whether new gaps need local entries. Do not delete a correction or accept a metadata change only because an upstream list changed. Run the offline check and catalog tests after reviewing the generated diff; do not edit generated JSON directly.

After an intentional input change, run generation and the check. Request optional reports when a detailed input review is needed:

```sh
corepack pnpm@9 prepare:catalog
corepack pnpm@9 generate:catalog
corepack pnpm@9 check:assets
corepack pnpm@9 check:catalog
python3 scripts/catalog.py --reports .cache/token-catalog/reports
```

The last command regenerates the same runtime snapshot and writes the two optional reports under `.cache/token-catalog/reports`. These reports describe current retained inputs, not the removed historical inventory. Review the runtime diff and report contents before accepting the change.

Before changing approvals, review current official documents, exact token contracts, both feed legs, lifecycle, methodology, heartbeat, live state, and deployed execution behavior. Add each exact official source row to `scripts/catalog-feeds.json` before candidate observation. Missing rows, changed rows, or mismatched chain, token, proxy, or quote must fail review. Preserve `excluded_reason` decisions and explicit `approved_feeds`; observe the candidate first, then separately review its complete-row approval fingerprint and execution evidence. Record source changes and repeat approval review without automatically renewing fingerprints.

Live verification normally checks only approved production feeds. Run `python3 scripts/catalog-live.py --output /tmp/catalog-policy-observations.json` for a separate read-only report. Use `--candidates /path/to/proposed-policy.json` to observe exact proposed mappings before approval; its report is marked `candidate-review` and does not enable creation. The policy's `verificationFile` selects the pinned current review observations. Verification compares exact token symbols and decimals and exact expected feed descriptions and decimals, validates rounds, and applies the selected freshness ceiling. `CATALOG_RPC_<chainId>` can override read-only RPC endpoints. When no feeds are selected, the report says `not-performed` and lists skipped chains. A skipped check is not a successful live verification. Candidate observations do not renew approvals or replace execution evidence.

All known token images keep their current URLs under `public/assets/tokens`; the identity manifest refers to 208 distinct image paths. Prepared files are ignored, while baseline and required fallback assets remain tracked. Network images remain committed, including Linea and Plasma in RainbowKit's actual network menu. Neither an image nor a known contract makes a route eligible. No eligibility review guarantees future liquidity, freshness, or correct execution.
