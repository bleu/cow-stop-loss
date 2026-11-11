import type { PostHogConfig } from "posthog-js";
import type { PostHog } from "posthog-js/lib/src/posthog-core";
import { type Address, parseUnits } from "viem";

import type { PreparedPlacement } from "./pollerStopLoss";
import type { StopLossOrder } from "./stopLossOrders";
import type {
  PlacementLifecycleEvent,
  PlacementRecord,
  PlacementScope,
} from "./stopLossPlacement";

export type AnalyticsConsent = "accepted" | "rejected" | null;
export const ANALYTICS_CONSENT_KEY = "cow.analytics.consent.v1";
const CONSENT_VERSION = 1;
const MAX_METADATA = 200;
const EVENTS = new Set([
  "$pageview",
  "$identify",
  "stop_loss_creation_started",
  "stop_loss_reviewed",
  "stop_loss_placement_requested",
  "stop_loss_placement_outcome",
  "stop_loss_open_orders_viewed",
  "stop_loss_order_details_viewed",
  "stop_loss_cancellation_requested",
  "stop_loss_cancellation_outcome",
  "stop_loss_orders_refresh_requested",
  "stop_loss_order_confirmed",
  "stop_loss_open_app_orders_viewed",
]);

export function analyticsEnabled() {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true" &&
    Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) &&
    (process.env.NEXT_PUBLIC_POSTHOG_HOST === undefined ||
      process.env.NEXT_PUBLIC_POSTHOG_HOST === "https://us.i.posthog.com")
  );
}

export function readAnalyticsConsent(): AnalyticsConsent {
  try {
    const preference = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (preference === null) return "accepted";
    const stored = JSON.parse(preference);
    return stored?.version === CONSENT_VERSION &&
      (stored.choice === "accepted" || stored.choice === "rejected")
      ? stored.choice
      : null;
  } catch {
    return null;
  }
}

export function orderAnalyticsKey(
  order: Pick<StopLossOrder, "chainId" | "owner" | "hash">,
) {
  return `${order.chainId}:${order.owner.toLowerCase()}:${order.hash.toLowerCase()}`;
}

function preparedKey(prepared: PreparedPlacement) {
  return orderAnalyticsKey({ ...prepared, hash: prepared.paramsHash });
}

function cleanUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

// The pinned, unminified core exposes this queue. Its browser bundle mangles the field.
function disableRetries(instance: PostHog) {
  instance._retryQueue?.unload();
  instance._retryQueue = undefined;
}

function safe(action: () => void) {
  try {
    action();
  } catch {
    /* Analytics must not affect orders. */
  }
}

type Properties = Record<
  string,
  string | number | boolean | null | undefined | readonly string[]
>;
type Flow = { id: string; reviewed?: string; complete?: boolean };

export function createAnalytics(
  loadSdk: () => Promise<PostHog> = async () =>
    (await import("posthog-js/lib/src/posthog-core")).init_as_module(),
) {
  let sdk: PostHog | undefined;
  let consent: AnalyticsConsent = null;
  let failedRejection = false;
  let generation = 0;
  let loading = false;
  let account: string | undefined;
  let walletKnown = false;
  let session: string | undefined;
  let pathname: string | undefined;
  const listeners = new Set<() => void>();
  const seen = new Set<string>();
  const flows = new Map<string, Flow>();
  const correlations = new Map<string, string>();
  const cancellations = new Map<string, string>();

  function notify() {
    for (const listener of listeners) safe(listener);
  }
  function boundedSet(key: string) {
    seen.add(key);
    if (seen.size > MAX_METADATA) seen.delete(seen.values().next().value!);
  }
  function boundedMap<T>(map: Map<string, T>, key: string, value: T) {
    map.set(key, value);
    if (map.size > MAX_METADATA) map.delete(map.keys().next().value!);
  }
  function allowed() {
    return (
      consent === "accepted" &&
      analyticsEnabled() &&
      readAnalyticsConsent() === "accepted"
    );
  }
  function refreshSession(activity = false) {
    if (!sdk || !allowed()) return;
    const next =
      sdk.sessionManager?.checkAndGetSessionAndWindowId(!activity).sessionId ||
      sdk.get_session_id();
    if (next !== session) {
      session = next;
      seen.clear();
      notify();
    }
  }
  function capture(name: string, properties: Properties, key?: string) {
    safe(() => {
      if (!sdk || !allowed() || !walletKnown) return;
      identify();
      if (
        (name === "$pageview" || name.endsWith("_viewed")) &&
        document.visibilityState !== "visible"
      )
        return;
      refreshSession();
      if (key && seen.has(key)) return;
      sdk.capture(name, {
        ...properties,
        schema_version: 1,
        $geoip_disable: true,
      });
      if (key) boundedSet(key);
    });
  }
  function inScope(scope: { account: Address }) {
    if (
      !account ||
      scope.account.toLowerCase() !== account ||
      !sdk ||
      !allowed()
    )
      return false;
    identify();
    return true;
  }
  function scopeProperties(scope: PlacementScope): Properties {
    return {
      chain_id: scope.chainId,
      wallet_address: scope.account.toLowerCase(),
    };
  }
  function flow(scope: PlacementScope) {
    refreshSession();
    const key = `${scope.account.toLowerCase()}:${scope.chainId}`;
    let current = flows.get(key);
    if (!current || current.complete) {
      current = { id: crypto.randomUUID() };
      boundedMap(flows, key, current);
    }
    return current;
  }
  function orderProperties(order: StopLossOrder): Properties {
    return {
      order_key: orderAnalyticsKey(order),
      chain_id: order.chainId,
      owner: order.owner.toLowerCase(),
      params_hash: order.hash.toLowerCase(),
      order_status: order.status,
    };
  }
  function pageview() {
    if (!pathname) return;
    capture(
      "$pageview",
      {
        $current_url: cleanUrl(pathname),
        $pathname: new URL(pathname, window.location.origin).pathname,
        $referrer: cleanUrl(document.referrer),
      },
      `page:${pathname}`,
    );
  }
  function clearMetadata() {
    seen.clear();
    flows.clear();
    correlations.clear();
    cancellations.clear();
    session = undefined;
  }
  function identify() {
    if (!sdk || !allowed() || !walletKnown) return;
    sdk.persistence?.load();
    const previous = sdk.get_distinct_id();
    if (
      /^0x[0-9a-f]{40}$/i.test(previous) &&
      previous.toLowerCase() !== account
    ) {
      sdk.__request_queue = [];
      sdk.reset(true);
      clearMetadata();
    }
    if (account) sdk.identify(account);
  }
  function beforeSend(token: number): PostHogConfig["before_send"] {
    return (event) => {
      if (
        !event ||
        token !== generation ||
        !allowed() ||
        !EVENTS.has(event.event)
      )
        return null;
      const wallet = event.properties.wallet_address;
      if (wallet && wallet !== account) return null;
      if (account && event.properties.distinct_id !== account) return null;
      for (const field of Object.keys(event.properties)) {
        if (/(?:url|referrer)$/i.test(field))
          event.properties[field] = cleanUrl(event.properties[field]);
      }
      delete event.properties.$set;
      delete event.properties.$set_once;
      delete event.$set;
      delete event.$set_once;
      return event;
    };
  }
  async function start() {
    if (loading || !allowed()) return;
    if (sdk) {
      safe(() => {
        sdk!.set_config({ before_send: beforeSend(generation) });
        sdk!.reset(true);
        sdk!.opt_in_capturing({ captureEventName: false });
        identify();
        refreshSession();
        pageview();
        notify();
      });
      return;
    }
    const token = generation;
    loading = true;
    try {
      const loaded = await loadSdk();
      if (token !== generation || !allowed()) return;
      loaded.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: "https://us.i.posthog.com",
        // The shipped CommonJS core calls native fetch with an invalid receiver.
        api_transport: "XHR",
        persistence: "localStorage",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_exceptions: false,
        disable_session_recording: true,
        disable_capture_url_hashes: true,
        disable_surveys: true,
        disable_external_dependency_loading: true,
        advanced_disable_feature_flags: true,
        advanced_disable_decide: true,
        capture_performance: false,
        capture_dead_clicks: false,
        opt_out_persistence_by_default: true,
        enable_heatmaps: false,
        person_profiles: "identified_only",
        ip: false,
        request_batching: false,
        save_referrer: false,
        save_campaign_params: false,
        before_send: beforeSend(token),
      });
      disableRetries(loaded);
      sdk = loaded;
      loaded.opt_in_capturing({ captureEventName: false });
      identify();
      refreshSession();
      pageview();
      notify();
    } catch {
      /* A blocked SDK leaves analytics off. */
    } finally {
      loading = false;
      if (token !== generation && allowed()) void start();
    }
  }

  const api = {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    refreshSession(activity = false) {
      safe(() => refreshSession(activity));
    },
    getConsent() {
      return consent;
    },
    syncConsent(choice = readAnalyticsConsent()) {
      safe(() => {
        if (failedRejection) choice = "rejected";
        if (consent === choice) {
          if (choice === "accepted" && !sdk) void start();
          return;
        }
        consent = choice;
        generation++;
        clearMetadata();
        if (choice !== "accepted") {
          sdk?.opt_out_capturing();
          if (sdk) sdk.__request_queue = [];
          sdk?.sessionManager?.resetSessionId();
          sdk?.persistence?.clear();
          sdk?.sessionPersistence?.clear();
          for (const suffix of ["window_id", "primary_window_exists"]) {
            sessionStorage.removeItem(
              `ph_${process.env.NEXT_PUBLIC_POSTHOG_KEY}_${suffix}`,
            );
          }
        } else void start();
        notify();
      });
    },
    setConsent(choice: Exclude<AnalyticsConsent, null>) {
      try {
        localStorage.setItem(
          ANALYTICS_CONSENT_KEY,
          JSON.stringify({ version: CONSENT_VERSION, choice }),
        );
        failedRejection = false;
      } catch {
        if (choice === "rejected") failedRejection = true;
      }
      api.syncConsent();
    },
    setWallet(address: Address | undefined, status: string) {
      safe(() => {
        if (status === "reconnecting" || status === "connecting") return;
        const next =
          status === "connected" ? address?.toLowerCase() : undefined;
        if (walletKnown && next === account) return;
        if (walletKnown && account && account !== next) {
          if (sdk) sdk.__request_queue = [];
          if (allowed()) sdk?.reset(true);
          clearMetadata();
        }
        account = next;
        walletKnown = true;
        identify();
        pageview();
      });
    },
    pageview(path: string) {
      safe(() => {
        const next = new URL(path, window.location.origin).pathname;
        if (pathname !== next) {
          seen.delete(`page:${next}`);
          pathname = next;
          pageview();
        }
      });
    },
    creationStarted(scope: PlacementScope) {
      safe(() => {
        if (!inScope(scope)) return;
        const current = flow(scope);
        capture(
          "stop_loss_creation_started",
          { ...scopeProperties(scope), flow_id: current.id },
          `start:${current.id}`,
        );
      });
    },
    reviewed(prepared: PreparedPlacement) {
      safe(() => {
        if (!inScope(prepared)) return;
        const current = flow(prepared);
        current.reviewed = preparedKey(prepared);
        boundedMap(correlations, preparedKey(prepared), current.id);
        const draft = prepared.draft;
        capture(
          "stop_loss_reviewed",
          {
            ...scopeProperties(prepared),
            flow_id: current.id,
            order_key: preparedKey(prepared),
            prepared_id: draft.id,
            sell_token: draft.tokenSell.address.toLowerCase(),
            sell_token_symbol: draft.tokenSell.symbol,
            sell_token_decimals: draft.tokenSell.decimals,
            buy_token: draft.tokenBuy.address.toLowerCase(),
            buy_token_symbol: draft.tokenBuy.symbol,
            buy_token_decimals: draft.tokenBuy.decimals,
            sell_amount: draft.amountSell,
            sell_amount_raw: parseUnits(
              draft.amountSell,
              draft.tokenSell.decimals,
            ).toString(),
            trigger_price: draft.strikePrice,
            minimum_receive: draft.amountBuy,
            minimum_receive_raw: parseUnits(
              draft.amountBuy,
              draft.tokenBuy.decimals,
            ).toString(),
            limit_price: draft.limitPrice,
            valid_to: draft.validTo,
          },
          `review:${current.id}:${preparedKey(prepared)}`,
        );
      });
    },
    placementRequested(record: PlacementRecord) {
      safe(() => {
        const prepared = record.prepared;
        if (!inScope(prepared)) return;
        const key = preparedKey(prepared);
        const id = correlations.get(key) || flow(prepared).id;
        boundedMap(correlations, key, id);
        capture(
          "stop_loss_placement_requested",
          {
            ...scopeProperties(prepared),
            flow_id: id,
            order_key: key,
            prepared_id: prepared.draft.id,
            placement_id: record.id,
            stage: record.stage,
          },
          `request:${record.id}:${record.revision}:${record.attempt}:${record.stage}`,
        );
      });
    },
    placementOutcome(event: PlacementLifecycleEvent) {
      safe(() => {
        const { record, stage, outcome } = event;
        const scope = "prepared" in record ? record.prepared : record;
        if (!inScope(scope)) return;
        const key =
          "prepared" in record
            ? preparedKey(record.prepared)
            : record.setup
              ? orderAnalyticsKey({
                  chainId: record.chainId,
                  owner: record.setup.owner,
                  hash: record.setup.paramsHash,
                })
              : undefined;
        capture(
          "stop_loss_placement_outcome",
          {
            ...scopeProperties(scope),
            placement_id: record.id,
            stage,
            outcome,
            order_key: key,
            flow_id: key ? correlations.get(key) : undefined,
          },
          `outcome:${record.id}:${record.revision}:${stage}:${outcome}`,
        );
        if (
          stage === "setup" &&
          outcome === "success" &&
          "prepared" in record &&
          record.status === "confirmed"
        ) {
          capture(
            "stop_loss_order_confirmed",
            {
              ...scopeProperties(scope),
              order_key: key,
              flow_id: key ? correlations.get(key) : undefined,
              placement_id: record.id,
            },
            `confirmed:${key}`,
          );
          const current = flows.get(
            `${scope.account.toLowerCase()}:${scope.chainId}`,
          );
          if (current) current.complete = true;
        }
      });
    },
    openOrdersViewed(
      wallet: Address,
      orders: readonly StopLossOrder[],
      options?: {
        stale?: boolean;
        origins?: Readonly<Record<string, "app" | "other" | "unknown">>;
      },
    ) {
      safe(() => {
        if (!inScope({ account: wallet })) return;
        const visible = [
          ...new Map(
            orders
              .filter(
                (order) =>
                  (order.status === "open" ||
                    order.status === "partially filled and open") &&
                  order.validTo > Date.now() / 1000,
              )
              .map((order) => [orderAnalyticsKey(order), order]),
          ).values(),
        ];
        const keys = visible.map(orderAnalyticsKey).sort();
        if (!keys.length) return;
        const origins = keys.map((key) => options?.origins?.[key] || "unknown");
        const properties = {
          wallet_address: wallet.toLowerCase(),
          open_order_count: keys.length,
          order_keys: keys,
          order_origins: origins,
          stale: Boolean(options?.stale),
          chain_ids: [
            ...new Set(visible.map((order) => String(order.chainId))),
          ].sort(),
        };
        capture(
          "stop_loss_open_orders_viewed",
          properties,
          `open:${wallet.toLowerCase()}`,
        );
        const appKeys = keys.filter((key) => options?.origins?.[key] === "app");
        if (appKeys.length)
          capture(
            "stop_loss_open_app_orders_viewed",
            {
              ...properties,
              app_order_keys: appKeys,
              app_order_count: appKeys.length,
            },
            `open-app:${wallet.toLowerCase()}`,
          );
      });
    },
    orderDetailsViewed(wallet: Address, order: StopLossOrder) {
      safe(() => {
        if (!inScope({ account: wallet })) return;
        capture(
          "stop_loss_order_details_viewed",
          { ...orderProperties(order), wallet_address: wallet.toLowerCase() },
          `details:${wallet}:${orderAnalyticsKey(order)}`,
        );
      });
    },
    cancellationRequested(scope: PlacementScope, order: StopLossOrder) {
      safe(() => {
        if (!inScope(scope)) return;
        const attempt = crypto.randomUUID();
        boundedMap(cancellations, orderAnalyticsKey(order), attempt);
        capture("stop_loss_cancellation_requested", {
          ...scopeProperties(scope),
          ...orderProperties(order),
          cancellation_attempt_id: attempt,
        });
      });
    },
    cancellationOutcome(
      scope: PlacementScope,
      order: StopLossOrder,
      outcome: "success" | "rejected" | "failed" | "pending",
    ) {
      safe(() => {
        if (!inScope(scope)) return;
        const attempt = cancellations.get(orderAnalyticsKey(order));
        if (!attempt) return;
        capture(
          "stop_loss_cancellation_outcome",
          {
            ...scopeProperties(scope),
            ...orderProperties(order),
            outcome,
            cancellation_attempt_id: attempt,
          },
          `cancel:${attempt}:${outcome}`,
        );
      });
    },
    ordersRefreshRequested(wallet: Address, source: "portfolio" | "details") {
      safe(() => {
        if (inScope({ account: wallet }))
          capture("stop_loss_orders_refresh_requested", {
            wallet_address: wallet.toLowerCase(),
            source,
          });
      });
    },
  };
  return api;
}

export const analytics = createAnalytics();
