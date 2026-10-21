# Dependency security

## Update on 2026-10-21

This update covers Dependabot PRs #68, #73, #75, #80, #91, and #92 in one dependency refresh. Next.js and React now use patched stable releases. Vocs now uses patched Vite 6. Unused GraphQL code-generation packages, `gql`, and React Query 3 were removed. The app still uses `gql.tada`, SWR, and TanStack Query.

Use Node 24.22.0 and pnpm 9.15.9. Stable Next.js does not permit the old experimental partial prerendering option, so that option was removed. Client route params now use Next.js Promise params. TypeScript targets ES2020 to support bigint literals in viem's dependency source.

The deprecated `@cowprotocol/app-data` package was replaced with `@cowprotocol/sdk-app-data` and its viem adapter. This removes the old IPFS, protobuf, and ethers dependency tree. App-data schema 1.1.0 remains explicit so the same reviewed order retains its app-data hash, params hash, and order digest. Tests retain the original fixed values.

RainbowKit remains at 2.2.0 with its existing connection patch. Connecting or browsing must not switch the wallet chain. Wagmi 2.15.6 and core 2.17.3 retain the connector 5 line; newer connector 6 builds introduced unresolved optional x402 imports through Coinbase CDP. An upgrade to that line needs separate build and wallet checks.

## Overrides

The fetch, WebSocket, minimatch 9, and PostCSS 8 overrides select patched versions within the same major version. They replace old open-ended overrides that could select an incompatible major version. The MetaMask SDK override updates the connector's exact 0.32.0 dependency to 0.33.1. Root `react-router-dom` supplies the private UI package's React Router 6 peer with the latest compatible release.

Remove an override when its parent package selects a patched version without it. Do not force a new major version into a transitive dependency only to make the audit pass.

## Remaining findings

Local `pnpm audit --json` fell from 279 findings to 12: one critical, three high, seven moderate, and one low. `pnpm audit --prod --json` reports the same totals because several build and test tools are declared as production dependencies. These totals describe the installed dependency graph, not confirmed browser exposure. GitHub alert totals can differ. No alerts were dismissed, and no audit exclusions were added.

| Package | Severity | Dependency path | Required follow-up |
| --- | --- | --- | --- |
| `maplibre-gl` 4.7.1 | Critical | `@bleu/ui -> plotly.js -> maplibre-gl` | Fix needs 6.4.1 or later. The latest private UI release, 0.1.133, still uses Plotly 2 and MapLibre 4. Update or replace the UI/plotting dependency with its owner. |
| `toml` 3.0.0 | High, two advisories | `vocs -> toml` and `vocs -> remark-mdx-frontmatter -> toml` | Fix needs 4.2.0 or later, outside both parents' TOML 3 range. |
| `braces` 3.0.3 | High | Jest, Tailwind, and lint dependencies through micromatch or chokidar | The advisory has no patched release. Track an upstream fix. |
| `uuid` 8.3.2 and 9.0.1 | Moderate | `wagmi -> @wagmi/connectors -> @metamask/sdk` and its utilities | Fix needs 11.1.1 or later, outside the current SDK ranges. |
| `react-router` 6.30.6 | Moderate, two advisories | `@bleu/ui -> react-router-dom -> react-router` | Fix needs 7.18.0 or later. The UI requires React Router 6. |
| `decode-uri-component` 0.2.2 | Moderate | WalletConnect utilities through `query-string` 7 | Fix needs 0.5.0 or later, outside the parent's range. |
| `sprintf-js` 1.0.3 | Moderate | `Jest -> Istanbul -> js-yaml -> argparse -> sprintf-js` | The advisory has no patched release. Track an upstream fix. |
| `postcss-selector-parser` 6.1.5 | Moderate | `tailwindcss` 3 and `postcss-nested` 6 | Fix needs 7.1.6 or later, outside the parents' ranges. |
| `katex` 0.16.47 | Low | `vocs -> rehype-mermaid -> mermaid-isomorphic` | Fix needs 0.18.2 or later, outside the parent's range. |

These findings remain open. Passing tests and builds do not prove that the affected paths are safe. Recheck with `corepack pnpm@9.15.9 audit` and `corepack pnpm@9.15.9 audit --prod` after parent-package updates.
