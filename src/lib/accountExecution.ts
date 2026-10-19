import { type PublicClient } from "viem";

import { publicClientsFromIds } from "./publicClients";
import { isSafeChainId } from "./safeChains";
import type { PlacementScope } from "./stopLossPlacement";

export type AccountExecution = {
  kind: "eoa" | "safe" | "unsupported";
  error?: string;
};

// Safe 1.3.0 and 1.4.1 proxy artifacts from @gnosis.pm/safe-contracts and @safe-global/safe-contracts.
const proxyCodes = new Set([
  "0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea2646970667358221220d1429297349653a4918076d650332de1a1068c5f3e07c5c82360c277770b955264736f6c63430007060033",
  "0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea264697066735822122003d1488ee65e08fa41e58e888a9865554c535f2c77126a82cb4c0f917f31441364736f6c63430007060033",
]);
const singletons = new Set([
  "0xd9db270c1b5e3bd161e8c8503c55ceabee709552",
  "0x3e5c63644e683549055b9be8653de26e0b4cd36e2",
  "0x41675c099f32341bf84bfc5382af534df5c7461a",
  "0x29fcb43b46531bca003ddc8fcb67ffe91900c762",
]);

export async function readAccountExecution(
  scope: PlacementScope,
  {
    client = publicClientsFromIds[scope.chainId],
  }: { client?: PublicClient } = {},
): Promise<AccountExecution> {
  const code = await client.getBytecode({ address: scope.account });
  if (!code || code === "0x") return { kind: "eoa" };
  if (proxyCodes.has(code.toLowerCase())) {
    const storage = await client.getStorageAt({
      address: scope.account,
      slot: "0x0",
    });
    const singleton = storage && `0x${storage.slice(-40)}`.toLowerCase();
    if (singleton && singletons.has(singleton))
      return isSafeChainId(scope.chainId)
        ? { kind: "safe" }
        : {
            kind: "unsupported",
            error:
              "Safe transaction tracking is not available on this network. Select a supported Safe network.",
          };
  }
  return {
    kind: "unsupported",
    error:
      "This contract account is not a supported Safe. Use a Safe 1.3.0 or 1.4.1 account.",
  };
}
