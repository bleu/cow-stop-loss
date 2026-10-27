# Dependency security

## Targeted updates

The pnpm overrides in `package.json` keep the current wallet and documentation integrations while replacing vulnerable dependencies. Run `pnpm test:security-dependencies` after changing them. CI runs these compatibility checks with the application tests and builds.

- `@bleu/ui@0.1.133` has no newer tagged release. Plotly 4.1.2 updates both its MapLibre dependency and its bundled MapLibre code to 6.11.2. A MapLibre-only override breaks the entry point used by Plotly 2. Router and Router DOM use 7.18.4 together. The package-specific peer rule permits the tested Router DOM version; other peer checks remain in effect.
- WalletConnect utils 2.21.9 removes its unused `query-string` dependency. Overriding the decoder directly breaks the CommonJS call in `query-string@7` because the patched decoder is ESM-only.
- The four MetaMask consumers use UUID's `v4` and `validate` APIs. Scoped overrides select UUID 11.1.1, which keeps CommonJS support. The tests cover those APIs and the output-buffer form.
- Vocs and its MDX frontmatter plugin use TOML 5.0.1. The tests cover both parser exports, frontmatter conversion, and prototype-pollution protection.
- Mermaid 12.2.0 includes a patched KaTeX browser bundle. Updating only the external KaTeX package leaves Mermaid's bundled code unchanged. External KaTeX and its CSS use 0.18.2; 0.18.11 is deprecated because it introduced breaking changes. Diagram and math rendering were also checked with `mermaid-isomorphic` in Chromium.

## Open Zod advisory

The dependency audit on 2026-10-27 still reports [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) for Zod 3.22.4 and 3.25.76. No fixed Zod 3 release is available. The patch in Zod 4.6.6 applies to its v4 parser; importing `zod/v3` from that release does not fix the issue.

A global Zod 4 override breaks the current form resolver's error handling and conflicts with v3-only wallet consumers. Resolution needs a tested migration of the app, form resolver, and affected wallet dependencies, or a supported v3 security backport. This advisory is not suppressed. Limit untrusted collection sizes before validation; upgrading Zod alone does not bound schemas without size limits.

## Node.js

`.tool-versions` pins Node.js 24.22.1. `package.json` requires at least that version within Node 24, and CI reads `.tool-versions`. This includes the [October 21, 2026 security fixes](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases). Check the deployed runtime separately; repository pins do not prove which patch version a hosting service runs. A patched Node.js runtime does not prevent compromised npm dependencies.
