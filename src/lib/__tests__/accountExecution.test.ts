import { type PublicClient } from "viem";

import { readAccountExecution } from "#/lib/accountExecution";
import { safePrepared } from "#/test/fixtures/safePlacement";

const proxyCode =
  "0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea264697066735822122003d1488ee65e08fa41e58e888a9865554c535f2c77126a82cb4c0f917f31441364736f6c63430007060033";

function client(
  code: string | undefined,
  singleton = "0x41675C099F32341bf84BFc5382aF534df5C7461a",
) {
  return {
    getBytecode: async () => code,
    getStorageAt: async () => `0x${"00".repeat(12)}${singleton.slice(2)}`,
    readContract: async () => singleton,
  } as unknown as PublicClient;
}

test("keeps new networks available to EOAs but blocks Safe submission without status support", async () => {
  const scope = { ...safePrepared, chainId: 8453 as const };
  await expect(
    readAccountExecution(scope, { client: client(undefined) }),
  ).resolves.toEqual({ kind: "eoa" });
  await expect(
    readAccountExecution(scope, { client: client(proxyCode) }),
  ).resolves.toEqual({
    kind: "unsupported",
    error:
      "Safe transaction tracking is not available on this network. Select a supported Safe network.",
  });
});

test("selects direct Safe execution only for a known Safe proxy and singleton", async () => {
  await expect(
    readAccountExecution(safePrepared, { client: client(proxyCode) }),
  ).resolves.toEqual({ kind: "safe" });
  await expect(
    readAccountExecution(safePrepared, { client: client(undefined) }),
  ).resolves.toEqual({ kind: "eoa" });
  await expect(
    readAccountExecution(safePrepared, { client: client("0x1234") }),
  ).resolves.toMatchObject({ kind: "unsupported" });
  await expect(
    readAccountExecution(safePrepared, {
      client: client(proxyCode, safePrepared.account),
    }),
  ).resolves.toMatchObject({ kind: "unsupported" });
});
