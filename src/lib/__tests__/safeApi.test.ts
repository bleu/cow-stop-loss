import {
  encodeAbiParameters,
  keccak256,
  parseAbiParameters,
  type PublicClient,
  stringToHex,
} from "viem";

import { readSafeTransaction } from "#/lib/safeApi";
import { safePrepared, safeProposalId } from "#/test/fixtures/safePlacement";

afterEach(() => jest.restoreAllMocks());

test("resolves a regular-wallet execution hash from the Safe execution event", async () => {
  const executionHash = `0x${"ef".repeat(32)}` as const;
  jest
    .spyOn(global, "fetch")
    .mockResolvedValue(new Response("{}", { status: 404 }));
  const client = {
    getTransactionReceipt: async () => ({
      status: "success",
      transactionHash: executionHash,
      logs: [
        {
          address: safePrepared.account,
          topics: [keccak256(stringToHex("ExecutionSuccess(bytes32,uint256)"))],
          data: encodeAbiParameters(parseAbiParameters("bytes32, uint256"), [
            safeProposalId,
            BigInt(0),
          ]),
        },
      ],
    }),
  } as unknown as PublicClient;
  await expect(
    readSafeTransaction(
      safePrepared,
      { id: executionHash, kind: "unknown" },
      { client },
    ),
  ).resolves.toMatchObject({
    status: "success",
    reference: {
      id: safeProposalId,
      kind: "proposal",
      transactionHash: executionHash,
    },
  });
});

test("does not confirm a mined outer transaction without a Safe execution event", async () => {
  jest
    .spyOn(global, "fetch")
    .mockImplementation(async () => new Response("{}", { status: 404 }));
  const client = {
    getTransactionReceipt: async () => ({
      status: "success",
      transactionHash: safeProposalId,
      logs: [],
    }),
  } as unknown as PublicClient;
  await expect(
    readSafeTransaction(
      safePrepared,
      { id: safeProposalId, kind: "unknown" },
      { client },
    ),
  ).rejects.toThrow("Safe execution event is missing");
});

test("retains a reverted outer execution as failed without a Safe event", async () => {
  jest
    .spyOn(global, "fetch")
    .mockImplementation(async () => new Response("{}", { status: 404 }));
  const client = {
    getTransactionReceipt: async () => ({
      status: "reverted",
      transactionHash: safeProposalId,
      logs: [],
    }),
  } as unknown as PublicClient;
  await expect(
    readSafeTransaction(
      safePrepared,
      { id: safeProposalId, kind: "unknown" },
      { client },
    ),
  ).resolves.toMatchObject({
    status: "failed",
    reference: {
      id: safeProposalId,
      kind: "transaction",
      transactionHash: safeProposalId,
    },
  });
});

const pending = {
  safe: safePrepared.account,
  safeTxHash: safeProposalId,
  nonce: "7",
  isExecuted: false,
  isSuccessful: null,
  transactionHash: null,
  confirmationsRequired: 2,
  rejectors: ["0x2222222222222222222222222222222222222222"],
};

test("keeps a Safe proposal pending when a cancellation has not executed", async () => {
  jest.spyOn(global, "fetch").mockImplementation(async (url) => {
    const action = new URL(String(url), "https://app.test").searchParams.get(
      "action",
    );
    return new Response(
      JSON.stringify(action === "transaction" ? pending : { results: [] }),
    );
  });
  await expect(
    readSafeTransaction(safePrepared, { id: safeProposalId, kind: "proposal" }),
  ).resolves.toMatchObject({
    status: "pending",
    reference: { id: safeProposalId, nonce: BigInt(7) },
  });
});

test.each([true, false])(
  "uses Safe execution success=%s rather than a mined transaction alone",
  async (isSuccessful) => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ...pending,
          isExecuted: true,
          isSuccessful,
          transactionHash: `0x${"ab".repeat(32)}`,
        }),
      ),
    );
    await expect(
      readSafeTransaction(safePrepared, {
        id: safeProposalId,
        kind: "proposal",
      }),
    ).resolves.toMatchObject({ status: isSuccessful ? "success" : "failed" });
  },
);

test.each([true, false])(
  "marks the proposal cancelled after a replacement consumes its nonce (success=%s)",
  async (isSuccessful) => {
    jest.spyOn(global, "fetch").mockImplementation(async (url) => {
      const action = new URL(String(url), "https://app.test").searchParams.get(
        "action",
      );
      return new Response(
        JSON.stringify(
          action === "transaction"
            ? pending
            : {
                results: [
                  {
                    ...pending,
                    safeTxHash: `0x${"cd".repeat(32)}`,
                    isExecuted: true,
                    isSuccessful,
                    transactionHash: `0x${"ab".repeat(32)}`,
                  },
                ],
              },
        ),
      );
    });
    await expect(
      readSafeTransaction(safePrepared, {
        id: safeProposalId,
        kind: "proposal",
      }),
    ).resolves.toMatchObject({ status: "cancelled" });
  },
);
