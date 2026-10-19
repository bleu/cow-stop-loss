/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react";

import {
  getSafeStopLossPlacement,
  useSafeStopLossPlacement,
} from "#/hooks/useSafeStopLossPlacement";
import { createSafeStopLossPlacement } from "#/lib/safeStopLossPlacement";
import { createSafeTransactionSender } from "#/lib/safeTransactions";
import { PlacementNotSubmittedError } from "#/lib/stopLossPlacement";
import { OrderStatus } from "#/lib/types";
import {
  memoryLocks,
  memoryStorage,
  safeCreateCall,
  safePrepared,
  safeProposalId,
} from "#/test/fixtures/safePlacement";

test("persists only the calls accepted by the sequential wallet", async () => {
  const storage = memoryStorage();
  const placement = createSafeStopLossPlacement({
    storage,
    locks: memoryLocks,
  });
  const prerequisite = { ...safeCreateCall, stage: "fallback" as const };
  const calls = [prerequisite, safeCreateCall];
  const sender = createSafeTransactionSender({
    account: safePrepared.account,
    chainId: 1,
    provider: {
      request: async ({ method }) => {
        if (method === "wallet_getCapabilities") return {};
        if (method === "eth_chainId") return "0x1";
        if (method === "eth_accounts") return [safePrepared.account];
        if (method === "eth_sendTransaction") return safeProposalId;
        throw new Error(method);
      },
    },
  });
  await placement.submit(safePrepared, { send: () => sender.send(calls) });
  expect(
    createSafeStopLossPlacement({ storage, locks: memoryLocks }).getRecords(
      safePrepared,
    )[0].steps,
  ).toEqual([
    {
      calls: [prerequisite],
      reference: { id: safeProposalId, kind: "unknown" },
      status: "pending",
    },
  ]);
});

test("restores an accepted Safe proposal after a reload without calling it an active order", async () => {
  const storage = memoryStorage();
  const placement = createSafeStopLossPlacement({
    storage,
    locks: memoryLocks,
  });
  await placement.submit(safePrepared, {
    calls: [safeCreateCall],
    send: async () => ({ id: safeProposalId, kind: "proposal" as const }),
  });

  const restored = createSafeStopLossPlacement({ storage, locks: memoryLocks });
  expect(restored.getRecords(safePrepared)).toMatchObject([
    {
      status: "pending",
      prepared: { owner: safePrepared.account },
      steps: [{ reference: { id: safeProposalId, kind: "proposal" } }],
    },
  ]);
});

test.each(["rejected", "lost", "invalid"])(
  "saves no row when proposal submission is %s",
  async (outcome) => {
    const placement = createSafeStopLossPlacement({
      storage: memoryStorage(),
      locks: memoryLocks,
    });
    await expect(
      placement.submit(safePrepared, {
        calls: [safeCreateCall],
        send: async () => {
          if (outcome !== "invalid") throw new Error(outcome);
          return { id: "0x", kind: "proposal" as const };
        },
      }),
    ).rejects.toThrow();
    expect(placement.getRecords(safePrepared)).toEqual([]);
  },
);

test("does not submit another proposal while the same order is awaiting signatures", async () => {
  const placement = createSafeStopLossPlacement({
    storage: memoryStorage(),
    locks: memoryLocks,
  });
  const submission = {
    calls: [safeCreateCall],
    send: async () => ({ id: safeProposalId, kind: "proposal" as const }),
  };
  await placement.submit(safePrepared, submission);
  await expect(placement.submit(safePrepared, submission)).rejects.toThrow(
    /pending|signatures/,
  );
  expect(placement.getRecords(safePrepared)).toHaveLength(1);
  expect(
    placement.getRecords({
      account: "0x2222222222222222222222222222222222222222",
      chainId: 1,
    }),
  ).toEqual([]);
  expect(
    placement.getRecords({ account: safePrepared.account, chainId: 100 }),
  ).toEqual([]);
});

test("confirms an order only after Safe execution and on-chain order authorization", async () => {
  const placement = createSafeStopLossPlacement({
    storage: memoryStorage(),
    locks: memoryLocks,
  });
  await placement.submit(safePrepared, {
    calls: [safeCreateCall],
    send: async () => ({ id: safeProposalId, kind: "proposal" }),
  });
  await placement.refresh(safePrepared, {
    readTransaction: async () => ({ status: "pending" }),
    isCreated: async () => true,
  });
  expect(placement.getRecords(safePrepared)[0].status).toBe("pending");
  await placement.refresh(safePrepared, {
    readTransaction: async () => ({ status: "success" }),
    isCreated: async () => true,
  });
  expect(placement.getRecords(safePrepared)[0].status).toBe("confirmed");
});

test("resumes the same order after a prerequisite executes without changing its expiry", async () => {
  const storage = memoryStorage();
  const placement = createSafeStopLossPlacement({
    storage,
    locks: memoryLocks,
  });
  await placement.submit(safePrepared, {
    calls: [{ ...safeCreateCall, stage: "fallback" }],
    send: async () => ({ id: safeProposalId, kind: "proposal" }),
  });
  await placement.refresh(safePrepared, {
    readTransaction: async () => ({ status: "success" }),
    isCreated: async () => false,
  });
  expect(placement.getRecords(safePrepared)[0].status).toBe("ready");
  const restored = createSafeStopLossPlacement({ storage, locks: memoryLocks });
  await restored.submit(safePrepared, {
    calls: [safeCreateCall],
    send: async () => ({ id: `0x${"13".repeat(32)}`, kind: "proposal" }),
  });
  expect(restored.getRecords(safePrepared)).toMatchObject([
    {
      status: "pending",
      prepared: { draft: { validTo: 1800003600 } },
      steps: [{ status: "success" }, { status: "pending" }],
    },
  ]);
});

test.each(["failed", "cancelled"] as const)(
  "keeps a %s Safe proposal across reloads",
  async (status) => {
    const storage = memoryStorage();
    const placement = createSafeStopLossPlacement({
      storage,
      locks: memoryLocks,
    });
    await placement.submit(safePrepared, {
      calls: [safeCreateCall],
      send: async () => ({ id: safeProposalId, kind: "proposal" }),
    });
    await placement.refresh(safePrepared, {
      readTransaction: async () => ({ status }),
      isCreated: async () => false,
    });
    expect(
      createSafeStopLossPlacement({ storage, locks: memoryLocks }).getRecords(
        safePrepared,
      ),
    ).toMatchObject([{ status }]);
  },
);

test.each(["success", "failed", "cancelled"] as const)(
  "blocks duplicate submission after %s execution",
  async (status) => {
    const placement = createSafeStopLossPlacement({
      storage: memoryStorage(),
      locks: memoryLocks,
    });
    let sends = 0;
    const submission = {
      calls: [safeCreateCall],
      send: async () => {
        sends++;
        return { id: safeProposalId, kind: "proposal" as const };
      },
    };
    await placement.submit(safePrepared, submission);
    await placement.refresh(safePrepared, {
      readTransaction: async () => ({ status }),
      isCreated: async () => true,
    });
    await expect(placement.submit(safePrepared, submission)).rejects.toThrow(
      /continue|already|terminal/,
    );
    expect(sends).toBe(1);
    expect(placement.getRecords(safePrepared)[0].steps).toHaveLength(1);
  },
);

test.each([false, true])(
  "blocks an expired submission, including continuation %s",
  async (continuation) => {
    let now = 1800000000000;
    const placement = createSafeStopLossPlacement({
      storage: memoryStorage(),
      locks: memoryLocks,
      now: () => now,
    });
    let sends = 0;
    const submission = {
      calls: [{ ...safeCreateCall, stage: "fallback" as const }],
      send: async () => {
        sends++;
        return { id: safeProposalId, kind: "proposal" as const };
      },
    };
    if (continuation) {
      await placement.submit(safePrepared, submission);
      await placement.refresh(safePrepared, {
        readTransaction: async () => ({ status: "success" }),
        isCreated: async () => false,
      });
    }
    now = 1800003600000;
    await expect(placement.submit(safePrepared, submission)).rejects.toThrow(
      /expired/,
    );
    expect(sends).toBe(continuation ? 1 : 0);
  },
);

test.each(["lost", "invalid"])(
  "retains accepted progress and pauses after a later %s response",
  async (outcome) => {
    const storage = memoryStorage();
    const placement = createSafeStopLossPlacement({
      storage,
      locks: memoryLocks,
    });
    await placement.submit(safePrepared, {
      calls: [{ ...safeCreateCall, stage: "fallback" }],
      send: async () => ({ id: safeProposalId, kind: "proposal" }),
    });
    await placement.refresh(safePrepared, {
      readTransaction: async () => ({ status: "success" }),
      isCreated: async () => false,
    });
    await expect(
      placement.submit(safePrepared, {
        calls: [safeCreateCall],
        send: async () => {
          if (outcome === "lost") throw new Error("Wallet response lost");
          return { id: "0x", kind: "proposal" };
        },
      }),
    ).rejects.toThrow();
    const restored = createSafeStopLossPlacement({
      storage,
      locks: memoryLocks,
    });
    expect(restored.getRecords(safePrepared)).toMatchObject([
      {
        status: "paused",
        error: expect.any(String),
        steps: [{ status: "success", reference: { id: safeProposalId } }],
      },
    ]);
    await restored.refresh(safePrepared, {
      readTransaction: async () => {
        throw new Error("must not poll completed step");
      },
      isCreated: async () => false,
    });
    await expect(
      restored.submit(safePrepared, {
        calls: [safeCreateCall],
        send: async () => {
          throw new Error("must not resend");
        },
      }),
    ).rejects.toThrow(/ready/);
    expect(restored.getRecords(safePrepared)[0].steps).toHaveLength(1);
  },
);

test("never resends an executed create whose authorization is missing", async () => {
  const storage = memoryStorage();
  const placement = createSafeStopLossPlacement({
    storage,
    locks: memoryLocks,
  });
  const submission = {
    calls: [safeCreateCall],
    send: async () => ({ id: safeProposalId, kind: "proposal" as const }),
  };
  await placement.submit(safePrepared, submission);
  await placement.refresh(safePrepared, {
    readTransaction: async () => ({ status: "success" }),
    isCreated: async () => false,
  });
  expect(placement.getRecords(safePrepared)[0]).toMatchObject({
    status: "failed",
    error: expect.stringMatching(/authorization/i),
    steps: [{ status: "success" }],
  });
  await expect(
    createSafeStopLossPlacement({ storage, locks: memoryLocks }).submit(
      safePrepared,
      submission,
    ),
  ).rejects.toThrow(/ready/);
});

test("notifies subscribers after accepted submissions and stops after unsubscribe", async () => {
  const placement = createSafeStopLossPlacement({
    storage: memoryStorage(),
    locks: memoryLocks,
  });
  const statuses: string[] = [];
  const unsubscribe = placement.subscribe(() =>
    statuses.push(placement.getRecords(safePrepared)[0].status),
  );
  await placement.submit(safePrepared, {
    calls: [{ ...safeCreateCall, stage: "fallback" }],
    send: async () => ({ id: safeProposalId, kind: "proposal" }),
  });
  expect(statuses).toEqual(["pending"]);
  unsubscribe();
  await placement.refresh(safePrepared, {
    readTransaction: async () => ({ status: "success" }),
    isCreated: async () => false,
  });
  expect(statuses).toEqual(["pending"]);
});

test("tracking hook observes accepted proposals without submitting transactions", async () => {
  localStorage.clear();
  Object.defineProperty(navigator, "locks", {
    value: memoryLocks,
    configurable: true,
  });
  const { result, rerender, unmount } = renderHook(() =>
    useSafeStopLossPlacement(safePrepared.account, 1),
  );
  expect(result.current.records).toEqual([]);
  await act(async () => {
    await getSafeStopLossPlacement().submit(safePrepared, {
      calls: [safeCreateCall],
      send: async () => ({ id: safeProposalId, kind: "proposal" }),
    });
  });
  expect(result.current.records).toMatchObject([{ status: "pending" }]);
  const records = result.current.records;
  rerender();
  expect(result.current.records).toBe(records);
  expect(result.current.error).toBeUndefined();
  unmount();
  localStorage.clear();
});

test("observes Safe storage events without reacting to EOA storage changes", async () => {
  const storage = memoryStorage();
  const events = new EventTarget();
  const placement = createSafeStopLossPlacement({
    storage,
    locks: memoryLocks,
    events,
  });
  let updates = 0;
  const unsubscribe = placement.subscribe(() => {
    updates++;
  });
  await createSafeStopLossPlacement({ storage, locks: memoryLocks }).submit(
    safePrepared,
    {
      calls: [safeCreateCall],
      send: async () => ({ id: safeProposalId, kind: "proposal" }),
    },
  );
  events.dispatchEvent(
    new StorageEvent("storage", { key: "stop-loss-placement" }),
  );
  expect(updates).toBe(0);
  events.dispatchEvent(
    new StorageEvent("storage", { key: "safe-stop-loss-placement" }),
  );
  expect(updates).toBe(1);
  expect(placement.getRecords(safePrepared)).toMatchObject([
    { status: "pending" },
  ]);
  unsubscribe();
  events.dispatchEvent(new StorageEvent("storage", { key: null }));
  expect(updates).toBe(1);
});

test("tracking hook polls Safe observations without changing or resending a pending proposal", async () => {
  jest.useFakeTimers();
  localStorage.clear();
  Object.defineProperty(navigator, "locks", {
    value: memoryLocks,
    configurable: true,
  });
  const originalFetch = globalThis.fetch;
  const fetcher = jest.fn(
    async (url: RequestInfo | URL) =>
      ({
        ok: true,
        json: async () =>
          String(url).includes("action=replacements")
            ? { results: [] }
            : {
                safe: safePrepared.account,
                safeTxHash: safeProposalId,
                nonce: "4",
                isExecuted: false,
                isSuccessful: null,
                transactionHash: null,
              },
      }) as Response,
  );
  globalThis.fetch = fetcher;
  let sends = 0;
  await getSafeStopLossPlacement().submit(safePrepared, {
    calls: [safeCreateCall],
    send: async () => {
      sends++;
      return { id: safeProposalId, kind: "proposal" };
    },
  });
  const { result, unmount } = renderHook(() => {
    const primary = useSafeStopLossPlacement(safePrepared.account, 1);
    useSafeStopLossPlacement(safePrepared.account, 1);
    return primary;
  });
  await act(async () => {});
  expect(fetcher).toHaveBeenCalledTimes(2);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(10000);
  });
  expect(fetcher.mock.calls.length).toBeGreaterThan(2);
  expect(result.current.records).toMatchObject([{ status: "pending" }]);
  expect(sends).toBe(1);
  unmount();
  globalThis.fetch = originalFetch;
  jest.useRealTimers();
  localStorage.clear();
});

test.each([
  new PlacementNotSubmittedError("Wallet changed before submission"),
  Object.assign(new Error("User rejected the request"), { code: 4001 }),
])(
  "keeps ready progress after a definite pre-submission failure: %s",
  async (failure) => {
    const placement = createSafeStopLossPlacement({
      storage: memoryStorage(),
      locks: memoryLocks,
    });
    await placement.submit(safePrepared, {
      calls: [{ ...safeCreateCall, stage: "fallback" }],
      send: async () => ({ id: safeProposalId, kind: "proposal" }),
    });
    await placement.refresh(safePrepared, {
      readTransaction: async () => ({ status: "success" }),
      isCreated: async () => false,
    });
    await expect(
      placement.submit(safePrepared, {
        calls: [safeCreateCall],
        send: async () => {
          throw failure;
        },
      }),
    ).rejects.toThrow(failure.message);
    expect(placement.getRecords(safePrepared)).toMatchObject([
      {
        status: "ready",
        error: failure.message,
        steps: [{ status: "success" }],
      },
    ]);
  },
);

test("does not keep another account's records when storage becomes unreadable", async () => {
  localStorage.clear();
  Object.defineProperty(navigator, "locks", {
    value: memoryLocks,
    configurable: true,
  });
  const placement = getSafeStopLossPlacement();
  await placement.submit(safePrepared, {
    calls: [{ ...safeCreateCall, stage: "fallback" }],
    send: async () => ({ id: safeProposalId, kind: "proposal" }),
  });
  await placement.refresh(safePrepared, {
    readTransaction: async () => ({ status: "success" }),
    isCreated: async () => false,
  });
  const { result, rerender, unmount } = renderHook(
    ({ account }: { account: `0x${string}` }) =>
      useSafeStopLossPlacement(account, 1),
    { initialProps: { account: safePrepared.account } },
  );
  expect(result.current.records).toHaveLength(1);
  localStorage.setItem("safe-stop-loss-placement", "invalid");
  rerender({ account: "0x2222222222222222222222222222222222222222" });
  expect(result.current.records).toEqual([]);
  expect(result.current.error).toEqual(expect.any(String));
  unmount();
  localStorage.clear();
});

test("shows a pending order as expired at its original expiry without discarding its proposal", async () => {
  let now = 1800000000000;
  const placement = createSafeStopLossPlacement({
    storage: memoryStorage(),
    locks: memoryLocks,
    now: () => now,
  });
  await placement.submit(safePrepared, {
    calls: [safeCreateCall],
    send: async () => ({ id: safeProposalId, kind: "proposal" }),
  });
  expect(placement.mergeRows(safePrepared, [])[0].status).toBe(
    OrderStatus.ON_QUEUE,
  );
  now = 1800003600001;
  expect(placement.mergeRows(safePrepared, [])[0].status).toBe(
    OrderStatus.EXPIRED,
  );
  expect(placement.getRecords(safePrepared)[0].steps[0].reference.id).toBe(
    safeProposalId,
  );
});

test("recovers paused placement from its scoped indexed order without inventing a submission", async () => {
  const storage = memoryStorage();
  const placement = createSafeStopLossPlacement({
    storage,
    locks: memoryLocks,
  });
  await placement.submit(safePrepared, {
    calls: [{ ...safeCreateCall, stage: "fallback" }],
    send: async () => ({ id: safeProposalId, kind: "proposal" }),
  });
  await placement.refresh(safePrepared, {
    readTransaction: async () => ({ status: "success" }),
    isCreated: async () => false,
  });
  await expect(
    placement.submit(safePrepared, {
      calls: [safeCreateCall],
      send: async () => {
        throw new Error("Wallet response lost");
      },
    }),
  ).rejects.toThrow("Wallet response lost");
  const steps = placement.getRecords(safePrepared)[0].steps;
  const indexed = {
    ...placement.mergeRows(safePrepared, [])[0],
    id: "indexed-order",
    status: OrderStatus.CANCELLED,
    source: "api" as const,
    canLink: true as const,
  };
  await placement.reconcile(safePrepared, [
    { ...indexed, chainId: 100 },
    { ...indexed, owner: "0x2222222222222222222222222222222222222222" },
    { ...indexed, hash: `0x${"13".repeat(32)}` },
  ]);
  expect(placement.getRecords(safePrepared)[0].status).toBe("paused");
  await placement.reconcile(safePrepared, [indexed]);
  const recovered = createSafeStopLossPlacement({
    storage,
    locks: memoryLocks,
  }).getRecords(safePrepared)[0];
  expect(recovered.status).toBe("confirmed");
  expect(recovered.error).toBeUndefined();
  expect(recovered.steps).toEqual(steps);
  expect(placement.mergeRows(safePrepared, [indexed])).toEqual([indexed]);
});

test("reconciliation needs Web Locks only when an indexed match changes a saved record", async () => {
  const storage = memoryStorage();
  const writer = createSafeStopLossPlacement({ storage, locks: memoryLocks });
  await writer.submit(safePrepared, {
    calls: [safeCreateCall],
    send: async () => ({ id: safeProposalId, kind: "proposal" }),
  });
  const indexed = {
    ...writer.mergeRows(safePrepared, [])[0],
    source: "api" as const,
    canLink: true as const,
  };
  const previousLocks = navigator.locks;
  Object.defineProperty(navigator, "locks", {
    value: undefined,
    configurable: true,
  });
  try {
    const placement = createSafeStopLossPlacement({ storage });
    await expect(placement.reconcile(safePrepared, [])).resolves.toMatchObject([
      { status: "pending" },
    ]);
    await expect(
      placement.reconcile({ ...safePrepared, chainId: 100 }, [indexed]),
    ).resolves.toEqual([]);
    await expect(placement.reconcile(safePrepared, [indexed])).rejects.toThrow(
      /Web Locks/,
    );
  } finally {
    Object.defineProperty(navigator, "locks", {
      value: previousLocks,
      configurable: true,
    });
  }
});

test("replaces the matching local row with its indexed order without duplicates", async () => {
  const placement = createSafeStopLossPlacement({
    storage: memoryStorage(),
    locks: memoryLocks,
  });
  await placement.submit(safePrepared, {
    calls: [safeCreateCall],
    send: async () => ({ id: safeProposalId, kind: "proposal" }),
  });
  const row = placement.mergeRows(safePrepared, [])[0];
  const indexed = {
    ...row,
    id: "indexed-order",
    source: "api" as const,
    canLink: true as const,
  };
  expect(
    placement.mergeRows(safePrepared, [indexed]).map(({ id }) => id),
  ).toEqual(["indexed-order"]);
});
