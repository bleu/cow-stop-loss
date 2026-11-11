/** @jest-environment jsdom */
import { act, fireEvent, render, screen } from "@testing-library/react";

import { analytics, ANALYTICS_CONSENT_KEY } from "#/lib/analytics";

import { AnalyticsProvider, useAnalyticsConsent } from "../AnalyticsProvider";
import { Footer } from "../Footer";

jest.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, status: "disconnected" }),
}));
jest.mock("next/navigation", () => ({ usePathname: () => "/orders" }));
jest.mock("#/lib/analytics", () => {
  const listeners = new Set<() => void>();
  let consent: "accepted" | "rejected" | null = null;
  function readConsent() {
    const raw = localStorage.getItem("cow.analytics.consent.v1");
    if (raw === null) return "accepted";
    const stored = JSON.parse(raw);
    return stored?.version === 1 &&
      (stored.choice === "accepted" || stored.choice === "rejected")
      ? stored.choice
      : null;
  }
  return {
    ANALYTICS_CONSENT_KEY: "cow.analytics.consent.v1",
    analyticsEnabled: () => process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true",
    analytics: {
      getConsent: jest.fn(() => consent),
      subscribe: jest.fn((listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }),
      syncConsent: jest.fn(() => {
        consent = readConsent();
        for (const listener of listeners) listener();
      }),
      setConsent: jest.fn((choice: "accepted" | "rejected") => {
        localStorage.setItem(
          "cow.analytics.consent.v1",
          JSON.stringify({ version: 1, choice }),
        );
        consent = choice;
        for (const listener of listeners) listener();
      }),
      setWallet: jest.fn(),
      pageview: jest.fn(),
      refreshSession: jest.fn(),
    },
  };
});

function State() {
  const { consent, revision } = useAnalyticsConsent();
  return (
    <output data-testid="consent">
      {consent ?? "unset"}:{revision}
    </output>
  );
}
function mount() {
  return render(
    <AnalyticsProvider>
      <State />
      <Footer githubLink="" discordLink="" />
    </AnalyticsProvider>,
  );
}
function openPreferences() {
  fireEvent.click(
    screen.getByRole("button", { name: "Analytics preferences" }),
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_POSTHOG_ENABLED = "true";
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

test("defaults to analytics on without a first-visit banner or a saved choice", () => {
  mount();
  expect(screen.getByTestId("consent").textContent).toMatch(/^accepted:/);
  expect(
    screen.queryByRole("region", { name: "Analytics consent" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(analytics.setConsent).not.toHaveBeenCalled();
  expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBeNull();
});

test("footer preferences show simple copy and turn analytics off and back on", () => {
  mount();
  openPreferences();
  expect(
    screen.getByRole("dialog", { name: "Analytics preferences" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Analytics: on.")).toBeInTheDocument();
  expect(
    screen.getByText(
      "We collect usage data to understand how the app is used and improve it. You can turn analytics off at any time.",
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText(/PostHog|in the US/)).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Turn analytics off" }),
  ).toHaveClass("pixel-control");
  fireEvent.click(screen.getByRole("button", { name: "Turn analytics off" }));
  expect(analytics.setConsent).toHaveBeenLastCalledWith("rejected");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  openPreferences();
  expect(screen.getByText("Analytics: off.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Turn analytics on" }));
  expect(analytics.setConsent).toHaveBeenLastCalledWith("accepted");
  expect(screen.getByTestId("consent").textContent).toMatch(/^accepted:/);
});

test("preserves an existing opt-out on mount", () => {
  localStorage.setItem(
    ANALYTICS_CONSENT_KEY,
    JSON.stringify({ version: 1, choice: "rejected" }),
  );
  mount();
  expect(screen.getByTestId("consent").textContent).toMatch(/^rejected:/);
  openPreferences();
  expect(screen.getByText("Analytics: off.")).toBeInTheDocument();
  expect(analytics.setConsent).not.toHaveBeenCalled();
});

test("shows the effective opt-out when the controller cannot save it", () => {
  mount();
  openPreferences();
  jest.mocked(analytics.setConsent).mockImplementationOnce(() => {});
  jest.mocked(analytics.getConsent).mockReturnValueOnce("rejected");
  fireEvent.click(screen.getByRole("button", { name: "Turn analytics off" }));
  expect(localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBeNull();
  openPreferences();
  expect(screen.getByText("Analytics: off.")).toBeInTheDocument();
});

test("cross-tab opt-out and clearing storage synchronize the effective preference", () => {
  mount();
  act(() => {
    localStorage.setItem(
      ANALYTICS_CONSENT_KEY,
      JSON.stringify({ version: 1, choice: "rejected" }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key: ANALYTICS_CONSENT_KEY }),
    );
  });
  expect(screen.getByTestId("consent").textContent).toMatch(/^rejected:/);
  act(() => {
    localStorage.removeItem(ANALYTICS_CONSENT_KEY);
    window.dispatchEvent(
      new StorageEvent("storage", { key: ANALYTICS_CONSENT_KEY }),
    );
  });
  expect(screen.getByTestId("consent").textContent).toMatch(/^accepted:/);
  act(() => {
    localStorage.setItem(
      ANALYTICS_CONSENT_KEY,
      JSON.stringify({ version: 1, choice: "rejected" }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key: ANALYTICS_CONSENT_KEY }),
    );
    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
  expect(screen.getByTestId("consent").textContent).toMatch(/^accepted:/);
});

test("local and preview remain off without explicit enabled flag", () => {
  delete process.env.NEXT_PUBLIC_POSTHOG_ENABLED;
  mount();
  expect(
    screen.queryByRole("region", { name: "Analytics consent" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Analytics preferences" }),
  ).not.toBeInTheDocument();
});

test("timer checks sessions read-only, while visible user activity advances session", () => {
  jest.useFakeTimers();
  const view = mount();
  act(() => {
    jest.advanceTimersByTime(30_000);
  });
  expect(analytics.refreshSession).toHaveBeenLastCalledWith();
  fireEvent.pointerDown(document);
  expect(analytics.refreshSession).toHaveBeenLastCalledWith(true);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  jest.mocked(analytics.refreshSession).mockClear();
  fireEvent.pointerDown(document);
  act(() => {
    jest.advanceTimersByTime(30_000);
  });
  expect(analytics.refreshSession).not.toHaveBeenCalled();
  view.unmount();
  jest.useRealTimers();
});
