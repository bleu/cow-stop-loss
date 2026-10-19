import { createSafeTransactionSender } from "#/lib/safeTransactions";
import { PlacementNotSubmittedError } from "#/lib/stopLossPlacement";
import {
  safeCreateCall,
  safePrepared,
  safeProposalId,
} from "#/test/fixtures/safePlacement";

test("submits one atomic WalletConnect batch and returns the Safe proposal ID", async () => {
  let sent: unknown;
  const sender = createSafeTransactionSender({
    ...safePrepared,
    provider: {
      request: async ({
        method,
        params,
      }: {
        method: string;
        params?: unknown[];
      }) => {
        if (method === "eth_chainId") return "0x1";
        if (method === "eth_accounts") return [safePrepared.account];
        if (method === "wallet_getCapabilities")
          return { "0x1": { atomic: { status: "supported" } } };
        if (method === "wallet_sendCalls") {
          sent = params;
          return { id: safeProposalId };
        }
        throw new Error(`Unexpected wallet method: ${method}`);
      },
    },
  });
  await expect(sender.send([safeCreateCall])).resolves.toMatchObject({
    reference: { id: safeProposalId, kind: "proposal" },
    calls: [safeCreateCall],
  });
  expect(sent).toEqual([
    {
      version: "2.0.0",
      chainId: "0x1",
      from: safePrepared.account,
      atomicRequired: true,
      calls: [{ to: safeCreateCall.to, data: "0x1234", value: "0x0" }],
    },
  ]);
});

test("proposes only the first missing call when atomic batching is unsupported", async () => {
  let sent: unknown;
  const first = {
    ...safeCreateCall,
    to: safePrepared.account,
    stage: "fallback" as const,
  };
  const sender = createSafeTransactionSender({
    ...safePrepared,
    provider: {
      request: async ({ method, params }) => {
        if (method === "eth_chainId") return "0x1";
        if (method === "eth_accounts") return [safePrepared.account];
        if (method === "wallet_getCapabilities")
          return { "0x1": { atomic: { status: "unsupported" } } };
        if (method === "eth_sendTransaction") {
          sent = params;
          return safeProposalId;
        }
        throw new Error(`Unexpected wallet method: ${method}`);
      },
    },
  });
  await expect(sender.send([first, safeCreateCall])).resolves.toMatchObject({
    calls: [first],
    reference: { id: safeProposalId, kind: "unknown" },
  });
  expect(sent).toEqual([
    {
      from: safePrepared.account,
      to: safePrepared.account,
      data: "0x1234",
      value: "0x0",
      chainId: "0x1",
    },
  ]);
});

test("uses the Safe Apps SDK for an iframe batch", async () => {
  let sent: unknown;
  const sender = createSafeTransactionSender({
    ...safePrepared,
    sdk: {
      txs: {
        send: async (request) => {
          sent = request;
          return { safeTxHash: safeProposalId };
        },
      },
    },
  });
  await expect(sender.send([safeCreateCall])).resolves.toMatchObject({
    reference: { id: safeProposalId, kind: "proposal" },
  });
  expect(sent).toEqual({
    txs: [{ to: safeCreateCall.to, data: "0x1234", value: "0" }],
  });
});

test("uses regular transactions when the wallet has no capabilities method", async () => {
  const sender = createSafeTransactionSender({
    ...safePrepared,
    provider: {
      request: async ({ method }) => {
        if (method === "wallet_getCapabilities")
          throw { code: -32601, message: "Method not found" };
        if (method === "eth_chainId") return "0x1";
        if (method === "eth_accounts") return [safePrepared.account];
        if (method === "eth_sendTransaction") return safeProposalId;
        throw new Error(`Unexpected method ${method}`);
      },
    },
  });
  await expect(sender.send([safeCreateCall])).resolves.toMatchObject({
    reference: { kind: "unknown" },
  });
});

test("does not submit when the wallet changes the reviewed batch mode", async () => {
  const sender = createSafeTransactionSender({
    ...safePrepared,
    provider: {
      request: async ({ method }) => {
        if (method === "wallet_getCapabilities")
          return { "0x1": { atomic: { status: "unsupported" } } };
        if (method === "eth_chainId") return "0x1";
        if (method === "eth_accounts") return [safePrepared.account];
        throw new Error("Unexpected signature request");
      },
    },
  });
  await expect(
    sender.send([safeCreateCall], { expectedMode: "batch" }),
  ).rejects.toBeInstanceOf(PlacementNotSubmittedError);
});

test("does not submit after the wallet switches to another chain", async () => {
  const sender = createSafeTransactionSender({
    ...safePrepared,
    provider: {
      request: async ({ method }) => {
        if (method === "eth_chainId") return "0x64";
        if (method === "eth_accounts") return [safePrepared.account];
        if (method === "wallet_getCapabilities")
          return { "0x1": { atomic: { status: "supported" } } };
        throw new Error("Unexpected signature request");
      },
    },
  });
  await expect(sender.send([safeCreateCall])).rejects.toBeInstanceOf(
    PlacementNotSubmittedError,
  );
});
