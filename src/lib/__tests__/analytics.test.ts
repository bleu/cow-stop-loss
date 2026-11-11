/** @jest-environment jsdom */
import type { PostHogConfig } from "posthog-js";
import type { PostHog } from "posthog-js/lib/src/posthog-core";
import type { Address } from "viem";

import {
  ANALYTICS_CONSENT_KEY,
  createAnalytics,
  orderAnalyticsKey,
  readAnalyticsConsent,
} from "../analytics";
import type { PreparedPlacement } from "../pollerStopLoss";
import type { StopLossOrder } from "../stopLossOrders";
import type { PlacementRecord } from "../stopLossPlacement";

const account = "0x1111111111111111111111111111111111111111" as Address;
const other = "0x2222222222222222222222222222222222222222" as Address;
const scope = { account, chainId: 100 as const };
const prepared = {
  ...scope,
  owner: other,
  paramsHash: "0xABC",
  draft: {
    id: "draft",
    amountSell: "1.25",
    amountBuy: "2.5",
    strikePrice: "2.1",
    limitPrice: "2",
    validTo: 2_000_000_000,
    tokenSell: { address: account, symbol: "ONE", decimals: 18 },
    tokenBuy: { address: other, symbol: "TWO", decimals: 6 },
  },
} as unknown as PreparedPlacement;
const record = {
  id: "placement",
  revision: 1,
  stage: "setup",
  status: "pending",
  prepared,
  transactions: {},
} as PlacementRecord;
const order = {
  chainId: 100,
  owner: other,
  hash: "0xABC",
  status: "open",
  validTo: 2_000_000_000,
} as StopLossOrder;

function harness() {
  let session = "session-1";
  let distinct = "anonymous";
  let config: PostHogConfig;
  const sdk = {
    init: jest.fn((_key, options) => {
      config = options;
    }),
    set_config: jest.fn((options) => {
      config = { ...config, ...options };
    }),
    capture: jest.fn(),
    identify: jest.fn((id) => {
      distinct = id;
    }),
    reset: jest.fn(() => {
      distinct = "new-anonymous";
    }),
    get_distinct_id: jest.fn(() => distinct),
    sessionManager: {
      resetSessionId: jest.fn(),
      checkAndGetSessionAndWindowId: jest.fn(() => ({ sessionId: session })),
    },
    opt_in_capturing: jest.fn(),
    opt_out_capturing: jest.fn(),
    persistence: { load: jest.fn(), clear: jest.fn() },
    sessionPersistence: { clear: jest.fn() },
    __request_queue: ["queued"],
    _retryQueue: { unload: jest.fn() },
  };
  const loader = jest.fn(async () => sdk as unknown as PostHog);
  const analytics = createAnalytics(loader);
  async function accept() {
    analytics.setWallet(account, "connected");
    analytics.setConsent("accepted");
    await Promise.resolve();
    await Promise.resolve();
  }
  return {
    sdk,
    loader,
    analytics,
    accept,
    config: () => config,
    rollover: () => {
      session = "session-2";
    },
    persisted: (id: string) => {
      distinct = id;
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  process.env.NEXT_PUBLIC_POSTHOG_ENABLED = "true";
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "test-key";
  delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("absent preference starts analytics without writing consent", async () => {
  const h = harness();
  h.analytics.setWallet(account, "connected");
  h.analytics.pageview("/orders?secret=1#private");
  expect(readAnalyticsConsent()).toBe("accepted");
  h.analytics.syncConsent();
  await Promise.resolve();
  await Promise.resolve();
  h.analytics.creationStarted(scope);
  expect(h.analytics.getConsent()).toBe("accepted");
  expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBeNull();
  expect(h.sdk.identify).toHaveBeenCalledWith(account);
  expect(h.sdk.capture).toHaveBeenCalledWith("$pageview", expect.anything());
  expect(h.sdk.capture).toHaveBeenCalledWith(
    "stop_loss_creation_started",
    expect.anything(),
  );
});

test("saved rejection stays off after reload and sync", async () => {
  harness().analytics.setConsent("rejected");
  const h = harness();
  h.analytics.syncConsent();
  h.analytics.setWallet(account, "connected");
  h.analytics.creationStarted(scope);
  h.analytics.reviewed(prepared);
  h.analytics.pageview("/orders?secret=1#private");
  h.analytics.syncConsent();
  await Promise.resolve();
  expect(h.analytics.getConsent()).toBe("rejected");
  expect(h.loader).not.toHaveBeenCalled();
  expect(h.sdk.identify).not.toHaveBeenCalled();
  expect(h.sdk.capture).not.toHaveBeenCalled();
});

test.each([
  "",
  "broken",
  "null",
  "{}",
  '{"version":2,"choice":"accepted"}',
  '{"version":1,"choice":"invalid"}',
])("invalid preference %p leaves analytics off", async (preference) => {
  localStorage.setItem(ANALYTICS_CONSENT_KEY, preference);
  const h = harness();
  h.analytics.setWallet(account, "connected");
  h.analytics.syncConsent();
  h.analytics.creationStarted(scope);
  await Promise.resolve();
  expect(readAnalyticsConsent()).toBeNull();
  expect(h.analytics.getConsent()).toBeNull();
  expect(h.loader).not.toHaveBeenCalled();
  expect(h.sdk.capture).not.toHaveBeenCalled();
});

test("storage read failure leaves analytics off", async () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw Error("blocked");
  });
  const h = harness();
  h.analytics.setWallet(account, "connected");
  h.analytics.syncConsent();
  h.analytics.creationStarted(scope);
  await Promise.resolve();
  expect(readAnalyticsConsent()).toBeNull();
  expect(h.analytics.getConsent()).toBeNull();
  expect(h.loader).not.toHaveBeenCalled();
  expect(h.sdk.capture).not.toHaveBeenCalled();
});

test.each(["remove", "clear"])(
  "storage %s restores default acceptance",
  async (action) => {
    const h = harness();
    h.analytics.setWallet(account, "connected");
    h.analytics.setConsent("rejected");
    if (action === "remove") localStorage.removeItem(ANALYTICS_CONSENT_KEY);
    else localStorage.clear();
    h.analytics.syncConsent();
    await Promise.resolve();
    await Promise.resolve();
    h.analytics.creationStarted(scope);
    expect(h.analytics.getConsent()).toBe("accepted");
    expect(h.sdk.capture).toHaveBeenCalledWith(
      "stop_loss_creation_started",
      expect.anything(),
    );
  },
);

test("disabled configuration and non-US hosts block default acceptance", async () => {
  for (const disabled of [undefined, "false"]) {
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED = disabled;
    const h = harness();
    h.analytics.syncConsent();
    await Promise.resolve();
    expect(h.loader).not.toHaveBeenCalled();
  }
  process.env.NEXT_PUBLIC_POSTHOG_ENABLED = "true";
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const missingKey = harness();
  missingKey.analytics.syncConsent();
  await Promise.resolve();
  expect(missingKey.loader).not.toHaveBeenCalled();
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "test-key";
  process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
  const h = harness();
  h.analytics.syncConsent();
  await Promise.resolve();
  expect(h.loader).not.toHaveBeenCalled();
});

test("lazy init disables automatic collection and uses SDK browser identity", async () => {
  const h = harness();
  await h.accept();
  expect(h.sdk.init).toHaveBeenCalledWith(
    "test-key",
    expect.objectContaining({
      api_host: "https://us.i.posthog.com",
      api_transport: "XHR",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_exceptions: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_external_dependency_loading: true,
      advanced_disable_feature_flags: true,
      advanced_disable_decide: true,
      ip: false,
      request_batching: false,
    }),
  );
  expect(h.sdk.identify).toHaveBeenCalledWith(account);
  expect(h.sdk.reset).not.toHaveBeenCalled();
  expect(h.sdk._retryQueue).toBeUndefined();
});

test("accept then revoke discards loading SDK and preserves application storage", async () => {
  let resolve!: (sdk: PostHog) => void;
  const h = harness();
  const analytics = createAnalytics(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  localStorage.setItem("orders", "keep");
  analytics.setConsent("accepted");
  analytics.setConsent("rejected");
  resolve(h.sdk as unknown as PostHog);
  await Promise.resolve();
  await Promise.resolve();
  expect(h.sdk.init).not.toHaveBeenCalled();
  expect(localStorage.getItem("orders")).toBe("keep");
});

test("revocation stops capture, invalidates old guards, and can accept again", async () => {
  const h = harness();
  await h.accept();
  const before = h.config().before_send as (event: unknown) => unknown;
  h.analytics.setConsent("rejected");
  h.analytics.creationStarted(scope);
  expect(h.sdk.opt_out_capturing).toHaveBeenCalledTimes(1);
  expect(h.sdk.capture).not.toHaveBeenCalled();
  h.analytics.setWallet(other, "connected");
  expect(h.sdk.reset).not.toHaveBeenCalled();
  h.analytics.setConsent("accepted");
  expect(h.sdk.init).toHaveBeenCalledTimes(1);
  expect(before({ event: "$pageview", properties: {} })).toBeNull();
  h.analytics.creationStarted({ ...scope, account: other });
  expect(h.sdk.capture).toHaveBeenCalledWith(
    "stop_loss_creation_started",
    expect.anything(),
  );
});

test.each(["absent", "accepted"])(
  "failed rejection overrides %s storage through sync and failed re-enable",
  async (preference) => {
    const h = harness();
    h.analytics.setWallet(account, "connected");
    if (preference === "accepted") h.analytics.setConsent("accepted");
    else h.analytics.syncConsent();
    await Promise.resolve();
    await Promise.resolve();
    const guard = h.config().before_send as (event: unknown) => unknown;
    const listener = jest.fn();
    h.analytics.subscribe(listener);
    for (const suffix of ["window_id", "primary_window_exists"]) {
      sessionStorage.setItem(`ph_test-key_${suffix}`, "saved");
    }
    const write = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw Error("full");
      });
    expect(() => h.analytics.setConsent("rejected")).not.toThrow();
    expect(readAnalyticsConsent()).toBe("accepted");
    expect(h.analytics.getConsent()).toBe("rejected");
    expect(listener).toHaveBeenCalled();
    expect(h.sdk.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(h.sdk.__request_queue).toEqual([]);
    expect(h.sdk.sessionManager.resetSessionId).toHaveBeenCalledTimes(1);
    expect(h.sdk.persistence.clear).toHaveBeenCalledTimes(1);
    expect(h.sdk.sessionPersistence.clear).toHaveBeenCalledTimes(1);
    for (const suffix of ["window_id", "primary_window_exists"]) {
      expect(sessionStorage.getItem(`ph_test-key_${suffix}`)).toBeNull();
    }
    h.analytics.syncConsent();
    h.analytics.syncConsent("accepted");
    h.analytics.setConsent("accepted");
    h.analytics.syncConsent();
    h.analytics.refreshSession(true);
    h.analytics.pageview("/orders");
    h.analytics.creationStarted(scope);
    h.analytics.reviewed(prepared);
    h.analytics.setWallet(other, "connected");
    expect(h.analytics.getConsent()).toBe("rejected");
    expect(h.sdk.capture).not.toHaveBeenCalled();
    expect(h.sdk.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(guard({ event: "$pageview", properties: {} })).toBeNull();
    write.mockRestore();
    h.analytics.setConsent("accepted");
    expect(h.analytics.getConsent()).toBe("accepted");
    expect(h.sdk.opt_in_capturing).toHaveBeenCalledTimes(2);
    h.analytics.creationStarted({ ...scope, account: other });
    expect(h.sdk.capture).toHaveBeenCalledWith(
      "stop_loss_creation_started",
      expect.anything(),
    );
    expect(guard({ event: "$pageview", properties: {} })).toBeNull();
  },
);

test.each([false, true])(
  "default lazy init discards SDK after opt-out (write fails: %p)",
  async (fails) => {
    let resolve!: (sdk: PostHog) => void;
    const h = harness();
    const analytics = createAnalytics(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    analytics.setWallet(account, "connected");
    analytics.pageview("/orders");
    analytics.syncConsent();
    if (fails) {
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw Error("full");
      });
    }
    analytics.setConsent("rejected");
    analytics.syncConsent();
    resolve(h.sdk as unknown as PostHog);
    await Promise.resolve();
    await Promise.resolve();
    expect(analytics.getConsent()).toBe("rejected");
    expect(h.sdk.init).not.toHaveBeenCalled();
    expect(h.sdk.identify).not.toHaveBeenCalled();
    expect(h.sdk.capture).not.toHaveBeenCalled();
  },
);

test("tab consent sync blocks capture before storage listener runs", async () => {
  const h = harness();
  await h.accept();
  localStorage.setItem(
    ANALYTICS_CONSENT_KEY,
    JSON.stringify({ version: 1, choice: "rejected" }),
  );
  h.analytics.creationStarted(scope);
  expect(h.sdk.capture).not.toHaveBeenCalled();
  h.analytics.syncConsent();
  expect(h.sdk.opt_out_capturing).toHaveBeenCalled();
});

test("wallet reconnect is safe; switch and disconnect reset device; late old outcomes are dropped", async () => {
  const h = harness();
  await h.accept();
  h.analytics.setWallet(undefined, "reconnecting");
  h.analytics.setWallet(account, "connected");
  expect(h.sdk.reset).not.toHaveBeenCalled();
  h.analytics.setWallet(other, "connected");
  expect(h.sdk.reset).toHaveBeenCalledWith(true);
  h.analytics.placementOutcome({ record, stage: "setup", outcome: "success" });
  expect(h.sdk.capture).not.toHaveBeenCalled();
  h.analytics.setWallet(undefined, "disconnected");
  expect(h.sdk.reset).toHaveBeenCalledTimes(2);
});

test("persisted A identity resets before identifying B on page reload", async () => {
  const h = harness();
  h.persisted(other);
  await h.accept();
  expect(h.sdk.reset).toHaveBeenCalledWith(true);
  expect(h.sdk.reset.mock.invocationCallOrder[0]).toBeLessThan(
    h.sdk.identify.mock.invocationCallOrder[0],
  );
});

test("startup reconnect delays pageview until known account and startup disconnected clears old wallet", async () => {
  const reconnecting = harness();
  reconnecting.persisted(other);
  reconnecting.analytics.setWallet(undefined, "reconnecting");
  reconnecting.analytics.pageview("/orders");
  reconnecting.analytics.setConsent("accepted");
  await Promise.resolve();
  await Promise.resolve();
  expect(reconnecting.sdk.capture).not.toHaveBeenCalled();
  expect(reconnecting.sdk.reset).not.toHaveBeenCalled();
  reconnecting.analytics.setWallet(account, "connected");
  expect(reconnecting.sdk.reset).toHaveBeenCalledWith(true);
  expect(reconnecting.sdk.capture).toHaveBeenCalledWith(
    "$pageview",
    expect.anything(),
  );

  localStorage.clear();
  const disconnected = harness();
  disconnected.persisted(other);
  disconnected.analytics.setWallet(undefined, "disconnected");
  disconnected.analytics.setConsent("accepted");
  await Promise.resolve();
  await Promise.resolve();
  expect(disconnected.sdk.reset).toHaveBeenCalledWith(true);
  expect(disconnected.sdk.identify).not.toHaveBeenCalled();
});

test("foreign cross-tab identity is reset before a scoped capture", async () => {
  const h = harness();
  await h.accept();
  h.persisted(other);
  h.analytics.creationStarted(scope);
  expect(h.sdk.reset).toHaveBeenCalledWith(true);
  expect(h.sdk.identify).toHaveBeenLastCalledWith(account);
  expect(h.sdk.capture).toHaveBeenCalledWith(
    "stop_loss_creation_started",
    expect.objectContaining({ wallet_address: account }),
  );
});

test("pageviews and capture guard strip URL secrets and reject unsolicited events", async () => {
  const h = harness();
  await h.accept();
  h.analytics.pageview("/orders?secret=1#private");
  h.analytics.pageview("/orders?secret=2");
  expect(h.sdk.capture).toHaveBeenCalledTimes(1);
  expect(h.sdk.capture).toHaveBeenCalledWith(
    "$pageview",
    expect.objectContaining({
      $current_url: "http://localhost/orders",
      $pathname: "/orders",
    }),
  );
  const guard = h.config().before_send as (event: {
    event: string;
    properties: Record<string, unknown>;
  }) => { properties: Record<string, unknown> } | null;
  expect(guard({ event: "$autocapture", properties: {} })).toBeNull();
  expect(
    guard({
      event: "$pageview",
      properties: {
        distinct_id: account,
        $current_url: "https://user:pass@test.com/orders?q=1#x",
        $referrer: "https://test.com/?q=2",
        $set: { secret: true },
      },
    })?.properties,
  ).toEqual({
    distinct_id: account,
    $current_url: "https://test.com/orders",
    $referrer: "https://test.com/",
  });
});

test("review serializes raw units only at capture and keeps flow across edits, retries, session rollover", async () => {
  const h = harness();
  await h.accept();
  h.analytics.creationStarted(scope);
  h.analytics.reviewed(prepared);
  h.analytics.creationStarted(scope);
  h.rollover();
  h.analytics.refreshSession();
  h.analytics.placementRequested(record);
  const start = h.sdk.capture.mock.calls.find(
    ([name]) => name === "stop_loss_creation_started",
  )![1];
  const review = h.sdk.capture.mock.calls.find(
    ([name]) => name === "stop_loss_reviewed",
  )![1];
  const requested = h.sdk.capture.mock.calls.find(
    ([name]) => name === "stop_loss_placement_requested",
  )![1];
  expect(review).toMatchObject({
    flow_id: start.flow_id,
    sell_amount_raw: "1250000000000000000",
    minimum_receive_raw: "2500000",
  });
  expect(requested.flow_id).toBe(start.flow_id);
  expect(JSON.stringify(review)).not.toContain("staticInput");
});

test("only verified setup confirmation emits order confirmed with canonical key", async () => {
  const h = harness();
  await h.accept();
  h.analytics.reviewed(prepared);
  h.analytics.placementOutcome({ record, stage: "setup", outcome: "success" });
  expect(
    h.sdk.capture.mock.calls.filter(
      ([name]) => name === "stop_loss_order_confirmed",
    ),
  ).toHaveLength(0);
  h.analytics.placementOutcome({
    record: { ...record, revision: 2, status: "confirmed" },
    stage: "setup",
    outcome: "success",
  });
  expect(h.sdk.capture).toHaveBeenCalledWith(
    "stop_loss_order_confirmed",
    expect.objectContaining({
      order_key: "100:0x2222222222222222222222222222222222222222:0xabc",
    }),
  );
});

test("open views filter expired/closed rows, dedupe account/session, and qualify app origin later", async () => {
  const h = harness();
  await h.accept();
  expect(orderAnalyticsKey(order)).toBe(
    "100:0x2222222222222222222222222222222222222222:0xabc",
  );
  h.analytics.openOrdersViewed(account, []);
  h.analytics.openOrdersViewed(
    account,
    [
      order,
      order,
      { ...order, hash: "expired", validTo: 1 },
      {
        ...order,
        hash: "closed",
        status: "cancelled" as StopLossOrder["status"],
      },
    ],
    { stale: true },
  );
  h.analytics.openOrdersViewed(account, [order], {
    origins: { [orderAnalyticsKey(order)]: "app" },
  });
  expect(
    h.sdk.capture.mock.calls.filter(
      ([name]) => name === "stop_loss_open_orders_viewed",
    ),
  ).toHaveLength(1);
  expect(h.sdk.capture).toHaveBeenCalledWith(
    "stop_loss_open_orders_viewed",
    expect.objectContaining({
      open_order_count: 1,
      stale: true,
      order_keys: [orderAnalyticsKey(order)],
    }),
  );
  expect(
    h.sdk.capture.mock.calls.filter(
      ([name]) => name === "stop_loss_open_app_orders_viewed",
    ),
  ).toHaveLength(1);
  h.rollover();
  h.analytics.refreshSession();
  expect(
    h.sdk.sessionManager.checkAndGetSessionAndWindowId,
  ).toHaveBeenLastCalledWith(true);
  h.analytics.openOrdersViewed(account, [order]);
  expect(
    h.sdk.capture.mock.calls.filter(
      ([name]) => name === "stop_loss_open_orders_viewed",
    ),
  ).toHaveLength(2);
});

test("cancellation dedupes observer outcome per attempt while permitting retry", async () => {
  const h = harness();
  await h.accept();
  h.analytics.cancellationRequested(scope, order);
  h.analytics.cancellationOutcome(scope, order, "failed");
  h.analytics.cancellationOutcome(scope, order, "failed");
  h.analytics.cancellationRequested(scope, order);
  h.analytics.cancellationOutcome(scope, order, "success");
  expect(
    h.sdk.capture.mock.calls.filter(
      ([name]) => name === "stop_loss_cancellation_outcome",
    ),
  ).toHaveLength(2);
});

test("real pinned SDK clears analytics persistence on revoke without clearing app storage", async () => {
  jest.useFakeTimers();
  const { init_as_module } = await import("posthog-js/lib/src/posthog-core");
  const sdk = init_as_module();
  const capture = jest.spyOn(sdk, "capture");
  sdk._send_request = jest.fn();
  localStorage.setItem("orders", "keep");
  const analytics = createAnalytics(async () => sdk);
  analytics.setWallet(account, "connected");
  analytics.setConsent("accepted");
  await Promise.resolve();
  await Promise.resolve();
  expect(sdk.get_distinct_id()).toBe(account);
  expect(
    Object.keys(localStorage).some(
      (key) => key.startsWith("ph_") && key.endsWith("_posthog"),
    ),
  ).toBe(true);
  analytics.setConsent("rejected");
  expect(
    Object.keys(localStorage).filter(
      (key) => key.startsWith("ph_") && key.endsWith("_posthog"),
    ),
  ).toEqual([]);
  expect(localStorage.getItem("orders")).toBe("keep");
  analytics.setConsent("accepted");
  expect(sdk.get_distinct_id()).toBe(account);
  analytics.creationStarted(scope);
  expect(sdk.is_capturing()).toBe(true);
  expect(capture).toHaveBeenCalledWith(
    "stop_loss_creation_started",
    expect.anything(),
  );
  expect(capture.mock.results.at(-1)?.value).toBeDefined();
  expect(sdk._send_request).toHaveBeenCalled();
  analytics.setConsent("rejected");
  sdk.sessionManager?.destroy();
  jest.clearAllTimers();
  jest.useRealTimers();
});

test("SDK errors never escape domain methods; hidden views are not recorded", async () => {
  const h = harness();
  await h.accept();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  h.analytics.openOrdersViewed(account, [order]);
  expect(h.sdk.capture).not.toHaveBeenCalled();
  h.sdk.capture.mockImplementation(() => {
    throw Error("blocked");
  });
  expect(() => h.analytics.creationStarted(scope)).not.toThrow();
  expect(() => h.analytics.placementRequested(record)).not.toThrow();
});
