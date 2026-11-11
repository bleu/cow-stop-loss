# Usage analytics

## PostHog setup

Use Product Analytics in the US-hosted PostHog project. In the project's settings, copy the public project token (`phc_...`). Do not use a personal API key. Set `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_ENABLED=true`, and `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` in the production build environment, then rebuild. Keep Session Replay off in the project. The client also disables replay, autocapture, automatic page views, surveys, feature flags, and exception collection.

Keep analytics settings unset for ordinary development, tests, and preview deployments. To test collection, explicitly enable it with a separate US PostHog project. Do not use the production key for local testing. Missing configuration leaves analytics off and hides its preference controls.

## Analytics preferences

When configured, analytics are on by default without a first-visit prompt. Analytics preferences in the footer lets users turn collection off or back on. A saved opt-out is preserved across reloads and shared between tabs. Turning analytics off stops future collection and removes analytics identifiers; it does not delete data already sent to PostHog. Operational order and wallet storage is separate and is not removed. Invalid preferences or unavailable storage leave collection off. If saving an opt-out fails, collection stays off for the current page, but the choice cannot be guaranteed after reload. Clearing the saved preference restores the default-on behavior.

While collection is on, PostHog supplies an anonymous browser/device ID. Connecting a wallet identifies the user by its lowercase raw address and links collected anonymous activity to it. The SDK keeps its device ID on connected events. A real disconnect or wallet change resets the browser identity before further activity, so two wallets are not merged. Reconnection during wallet startup does not by itself reset identity. The same wallet on another device identifies the same user. A wallet connection is not proof of exclusive control of a browser or of a person's real identity.

Financial values are collected at review: chain, token addresses and decimals, sell amount, trigger price, minimum receive, limit price, and expiry. Integer token amounts are strings to preserve precision. The client does not record keystrokes, signatures, transaction calldata, arbitrary wallet errors, or screen replay. URL query strings and fragments are removed from analytics URLs. Wallet addresses in app paths and event identity are permitted.

## Events

All custom events use the `stop_loss_` prefix. The SDK adds browser and session context. `flow_id` links creation steps; `order_key` is the lowercase chain ID, CowShed owner, and conditional-order params hash. API event IDs and local row IDs are not stable order identities.

| Event | Meaning |
| --- | --- |
| `$pageview` | A deliberate application route view while collection is on. Table query changes do not create page views. |
| `stop_loss_creation_started` | First user edit in a creation flow. Default values, quotes, and programmatic resets do not start one. |
| `stop_loss_reviewed` | A prepared order review is shown. Includes the reviewed financial values. Validation or preparation failure does not count. |
| `stop_loss_placement_requested` | A wallet request is about to be sent after preflight checks. `stage` is `approval-reset`, `approval`, or `setup`. |
| `stop_loss_placement_outcome` | A verified placement stage outcome. `outcome` separates success, wallet rejection, and failure. Ambiguous submission or receipt checks must not be treated as a chain failure. |
| `stop_loss_order_confirmed` | The required on-chain order setup is verified. A submitted transaction is insufficient. |
| `stop_loss_open_orders_viewed` | At least one open order is displayed in the portfolio, once per wallet/session. Includes visible order keys, counts, and chain context. |
| `stop_loss_open_app_orders_viewed` | An open order's validated app data identifies this app, once per wallet/session. Origin resolution can finish after the general view event. |
| `stop_loss_order_details_viewed` | An account-authorized order detail resolves and is displayed, once per order/session. Missing orders and wallet-required screens do not count. |
| `stop_loss_cancellation_requested` | A cancellation wallet request is about to be sent. Switching chains or retrying receipt observation does not count. |
| `stop_loss_cancellation_outcome` | Cancellation success, rejection, failure, or an uncertain pending submission. Linked by `cancellation_attempt_id`. |
| `stop_loss_orders_refresh_requested` | Explicit Refresh orders or a detail retry. `source` distinguishes `portfolio` and `details`. Automatic polling does not count. |

Open means `OPEN` or `PARTIALLY_FILLED` with an expiry in the future. Pending setup, cancellation, and terminal rows do not qualify. Only rows in the current table page and filters count as displayed. Stale data is marked and must not be read as a fresh chain check.

CoW app-data documents are validated against their saved hash. `bleu-stop-loss` identifies this app; a different explicit app code identifies another app. Missing, unmarked, invalid, or unavailable data has unknown origin. This marker is attribution, not proof that an official deployment created the order. Origin checks do not block the table. Canonical order keys also support joins to recorded creation events across devices.

Browser interruption, opted-out collection, blocked requests, or incomplete recovery correlation can omit events. Do not interpret a missing event as proof that an on-chain action did not occur. Historical confirmations are not reconstructed when the app starts. Collection turned on halfway through a flow starts observation at that point; earlier actions are not replayed.

## Creation funnel

In PostHog Funnels, use `stop_loss_creation_started`, `stop_loss_reviewed`, `stop_loss_placement_requested` filtered to `stage = setup`, and `stop_loss_order_confirmed`. Hold `flow_id` constant to avoid combining unrelated attempts. Break down by chain or token pair. Users who turn collection on at review can appear without a start event.

Approval is optional when allowance is already sufficient. Use a separate approval funnel, filtered to `stage = approval`, to inspect approval requests and outcomes. Group placement outcomes by `stage` and `outcome` to separate wallet rejection from verified failure. Use canonical order keys to investigate individual order lifecycles rather than sum every retry as a new order.

## Return measurement

A return is a prior visit followed by a different SDK session that displays an open order. Sessions expire after 30 minutes of inactivity. A same-session view immediately after creation is not a return. PostHog calendar-day retention alone does not enforce this rule; compare `$session_id` as well as timestamps.

For general return usage, join earlier `$pageview` events to later `stop_loss_open_orders_viewed` events by person. For creator retention, use `stop_loss_order_confirmed` as the earlier event. Substitute `stop_loss_open_app_orders_viewed` for app-created-order retention. An app-origin view need not be the same order as the earlier creation; require the earlier `order_key` in the later `order_keys` array when measuring returns to that exact order.

This HogQL example counts creators who later display an open order in another session:

```sql
SELECT count(DISTINCT later.person_id) AS returning_creators
FROM events AS earlier
JOIN events AS later ON earlier.person_id = later.person_id
WHERE earlier.event = 'stop_loss_order_confirmed'
  AND later.event = 'stop_loss_open_orders_viewed'
  AND later.timestamp > earlier.timestamp
  AND earlier.properties.$session_id IS NOT NULL
  AND later.properties.$session_id IS NOT NULL
  AND earlier.properties.$session_id != later.properties.$session_id
```

Add date bounds for both sides before running this query on a large project. Use person identity for cross-device reporting, not browser storage or device ID. Build the creator cohort from confirmations in the chosen date range, then divide returning creators by that cohort size for a return rate. Use a fixed follow-up window, such as seven days, and exclude cohorts that have not yet had that full window. Keep general returns, app-origin returns, and detail views separate.

## Check before production

Use a separate test project and inspect browser network requests plus PostHog Live events. Check that a fresh visit collects without a prompt, turning analytics off in the footer stops collection and clears identifiers, and the opt-out persists after reload and across tabs. Check that an existing opt-out remains off and turning collection back on resumes it without replaying earlier activity. Verify anonymous-to-wallet linking, disconnect, A-to-B wallet switching, and a second browser with the same wallet. Inspect exact amounts and confirm that replay is disabled. Exercise success, wallet rejection, pending receipts, cancellation, manual refresh, and a later-session open-order view. Check that the same-session creation/view is excluded from return queries. Do not send a real transaction just to test analytics; use existing mocked wallet flows or an explicitly authorized testnet test.
