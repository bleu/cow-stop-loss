# Token catalog

## Current creation status

Production order creation is disabled on all nine configured mainnets. No production token/feed route is approved under the stricter policy. This is intentional: missing evidence must not become a usable route. Network selection, historical order display, approval repair, and cancellation remain available, subject to their normal ownership and state checks. Sepolia retains its WETH-only sell and 18-decimal USDC test buy configuration. Those fixed test feeds are not production token-specific prices.

All nine designated USD buy feeds are marked `stablecoinCapped` in the pinned Chainlink inventory. Chainlink's [bounded market-price documentation](https://docs.chain.link/data-feeds/selecting-data-feeds#bounded-market-price-feeds) states that a bounded feed does not publish a new price above its upper limit; the proxy returns its last onchain price. That behavior needs a separate suitability decision for a stop-loss price ratio. A `USD` label, low-risk category, or successful round is not sufficient approval. This change does not assert that the feeds are defective.

The deployed StopLoss handler also lacks sequencer-uptime and recovery checks. [Chainlink requires these checks for L2 consumers](https://docs.chain.link/data-feeds/using-data-feeds). A check when an order is created cannot protect its later execution. Arbitrum, Base, and Linea creation therefore also require a compatible execution-time guard. No new handler is deployed by this change. See [execution evidence](../scripts/oracle-execution-verification.json).

## Known metadata is not creation eligibility

The metadata inventory retains 303 production token contracts and three historical Sepolia records. All 306 have local images and explicit economic classifications. The production classifications are 207 volatile, 84 USD-pegged, seven USD-linked, and five other stable assets. Classification describes exposure, not current peg health, liquidity, bridge safety, or feed approval.

| Chain | Chain ID | Known production contracts | Fixed buy metadata | Approved production sells |
| --- | --- | --- | --- | --- |
| Ethereum | 1 | 85 | Native USDC | 0 |
| Gnosis | 100 | 17 | USDT | 0 |
| Arbitrum | 42161 | 44 | Native USDC | 0 |
| Base | 8453 | 38 | Native USDC | 0 |
| Polygon | 137 | 25 | Native USDC | 0 |
| Avalanche | 43114 | 28 | Native USDC | 0 |
| BNB Chain | 56 | 48 | USDT | 0 |
| Linea | 59144 | 8 | Native USDC | 0 |
| Plasma | 9745 | 10 | Native USDC | 0 |

Ink and Solana remain excluded. The fixed buy token is not a selectable sell. Dollar-pegged assets, their bridged forms, dollar-linked yield shares, other stable assets, and unclassified assets are excluded from new sells. Classification is pinned by exact chain and token contract, not a ticker rule. A volatile asset with a USD-quoted feed is not a dollar-pegged asset. FXS governance is separate from the old FRAX dollar contract.

`findKnownToken` retains catalog and historical metadata for existing orders, including Ethereum WBTC and the old Gnosis USDC.e buy token. Saved orders keep their original feeds for pair-price reads. Removing creation eligibility does not rewrite an order or make its saved feeds safe. Existing orders can still be cancelled or repaired when their ownership and state allow it. Saved but unsubmitted placements must pass the current policy before publication or transaction construction.

## Approval requirements

`scripts/catalog-policy.json` is the explicit approval source. Each feed approval must identify the exact chain, token contract, quote, path, and proxy. It must record identity, representation, methodology and source evidence, review date, expected live description and decimals, a freshness ceiling, and a fingerprint of its pinned inputs. The chain must also have approved execution evidence. Both sell and buy legs must qualify. Inventory refreshes cannot silently select another proxy or turn matching symbols into approved routes.

Initial review is restricted to active `low`-category reference market-price feeds. [Chainlink describes its categories and feed methods](https://docs.chain.link/data-feeds/selecting-data-feeds). The category is a review input, not a guarantee. Medium, high, new, custom, hidden, deprecating, unknown, calculated, exchange-rate, and unsupported methods are excluded in this pass. Bounded stablecoin behavior is not approved by this standard market-price policy.

An underlying asset feed does not measure the price or redemption risk of a bridge claim, custodian claim, or derivative. Such substitutions are excluded. A native asset wrapper can qualify only with explicit evidence that its wrapping contract preserves the intended unit. A bridged WETH contract does not inherit that exception. Approval must assess both feed suitability and the handler's arithmetic and execution limits.

Future approved pairs keep the existing common-ETH-first, otherwise common-USD routing rule. Feed decimals are normalized before division; approved feeds are restricted to 0 through 18 decimals to avoid the handler's truncation risk. Direct USD estimates remain separate: an ETH quote is not a USD price. No assumed dollar peg, synthetic conversion, arbitrary import, or manual oracle override is allowed. Each approved age ceiling must be no larger than `floor(1.5 * heartbeat) + 60` seconds. A pair uses the tighter ceiling of its two feeds. A user may choose a shorter limit but cannot extend it through settings, a restored draft, or encoded placement input.

Browser reads retain block-pinned, positive-answer, complete-round, nonzero/nonfuture timestamp, and freshness checks. These checks do not add missing checks to the deployed handler. The verified handler normalizes prices but does not check round completeness, future timestamps, or sequencer state. These limits must remain part of any later route approval.

## Sources and audit history

The original source inventory was fetched on 2026-10-16 from the [official Chainlink chain registry](https://raw.githubusercontent.com/smartcontractkit/documentation/main/src/features/data/chains.ts). `scripts/catalog-sources.json` records inventory and token-metadata source URLs and hashes. `scripts/catalog-feeds.json` retains all 2,102 source feed rows. `scripts/catalog-identities.json` pins exact token identities and classifications. Token sources include CoW, issuer references, Aave, and chain-specific maintained lists; they are identity inputs, not proof of oracle suitability.

The former build selected 336 proxies and the 2026-10-16 live snapshot reported no check failures. It accepted some underlying-feed substitutions, selected alternates by ordering, required only a nonempty token symbol, and checked feed descriptions only for their quote. That snapshot remains in `scripts/catalog-verification.json` as historical evidence. It is not approval under the current policy and is not a current safety audit.

`scripts/catalog-audit.json` now accounts for all source rows under the stricter decisions. Excluded and unresolved rows remain visible. An unresolved same-chain identity, pool-share identity, unsupported method, unapproved route, or missing execution safeguard must not be filled by symbol inference. Metadata coverage, approved creation routes, and historic order support are separate counts.

## Build and verification

```sh
python3 scripts/catalog.py
python3 scripts/catalog.py --check
python3 -m unittest discover -s scripts -p 'test_catalog*.py'
python3 scripts/catalog-live.py --output /tmp/catalog-verification.json
```

The generator is offline. It writes typed catalog inputs and audit decisions from pinned evidence. Before changing approvals, review current official documents, exact token contracts, both feed legs, lifecycle, methodology, heartbeat, live state, and deployed execution behavior. Record source changes and repeat review; do not edit generated JSON directly.

Live verification normally checks only approved production feeds. Use `--candidates /path/to/proposed-policy.json` to observe exact proposed mappings before approval; its report is marked `candidate-review` and does not enable creation. The policy's `verificationFile` selects the pinned review observations, separate from the historical snapshot. Verification compares exact token symbols and decimals and exact expected feed descriptions and decimals, validates rounds, and applies the selected freshness ceiling. `CATALOG_RPC_<chainId>` can override read-only RPC endpoints. When no feeds are selected, the report says `not-performed` and lists skipped chains. A skipped check is not a successful live verification. The historical snapshot is not overwritten.

All known token images remain under `public/assets/tokens`; there are 208 distinct files. Network images are local, including Linea and Plasma in RainbowKit's actual network menu. Neither an image nor a known contract makes a route eligible. No eligibility review guarantees future liquidity, freshness, or correct execution.
