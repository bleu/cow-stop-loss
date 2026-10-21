import type { Address, PublicClient } from "viem";

import { type ChainId, publicClientsFromIds } from "./publicClients";
import {
  loadStopLossFundingParents,
  loadStopLossOrders,
} from "./stopLossOrders";

type Scope = { account: Address; chainId: ChainId };

export const PLACEMENT_READ_MAX_AGE = 15_000;

const snapshots = new Map<
  string,
  { expiresAt: number; minimumBlockNumber: bigint; reads: PlacementReads }
>();

function scopeKey({ account, chainId }: Scope) {
  return `${chainId}:${account.toLowerCase()}`;
}

export function invalidatePlacementReads(scope: Scope) {
  snapshots.delete(scopeKey(scope));
}

export function getPlacementReads({
  account,
  chainId,
  client,
  minimumBlockNumber = BigInt(0),
}: Scope & {
  client?: PublicClient;
  minimumBlockNumber?: bigint;
}): PlacementReads {
  const scope = { account, chainId };
  if (client)
    return createPlacementReads(scope, client, false, minimumBlockNumber);
  const key = scopeKey(scope);
  const now = Date.now();
  const current = snapshots.get(key);
  if (
    current &&
    current.expiresAt > now &&
    current.minimumBlockNumber >= minimumBlockNumber
  )
    return current.reads;
  for (const [key, snapshot] of snapshots) {
    if (snapshot.expiresAt <= now) snapshots.delete(key);
  }
  const reads = createPlacementReads(
    scope,
    publicClientsFromIds[chainId],
    true,
    minimumBlockNumber,
  );
  snapshots.set(key, {
    expiresAt: now + PLACEMENT_READ_MAX_AGE,
    minimumBlockNumber,
    reads,
  });
  return reads;
}

export type PlacementReads = ReturnType<typeof createPlacementReads>;

function createPlacementReads(
  scope: Scope,
  source: PublicClient,
  cache: boolean,
  minimumBlockNumber: bigint,
) {
  const pending = new Map<string, Promise<unknown>>();
  function once<T>(key: string, read: () => Promise<T>): Promise<T> {
    if (!cache) return read();
    const current = pending.get(key);
    if (current) return current as Promise<T>;
    const result = read().catch((error) => {
      pending.delete(key);
      throw error;
    });
    pending.set(key, result);
    return result;
  }
  const keyFor = (method: string, args: object) =>
    JSON.stringify(
      [method, Object.entries(args).sort(([a], [b]) => a.localeCompare(b))],
      (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    );
  const blockNumber = () =>
    once("blockNumber", async () => {
      const latest = await source.getBlockNumber({ cacheTime: 0 });
      // A receipt can arrive before the RPC's latest block catches up.
      return latest < minimumBlockNumber ? minimumBlockNumber : latest;
    });
  const client =
    cache || minimumBlockNumber > BigInt(0)
      ? ({
          ...source,
          getBlockNumber: blockNumber,
          getBlock: async (
            args: Parameters<PublicClient["getBlock"]>[0] = {},
          ) => {
            if (args.blockHash)
              return once(keyFor("getBlock", args), () =>
                source.getBlock(args),
              );
            const pinned = {
              ...args,
              blockHash: undefined,
              blockTag: undefined,
              blockNumber: args.blockNumber ?? (await blockNumber()),
            };
            return once(keyFor("getBlock", pinned), () =>
              source.getBlock(pinned),
            );
          },
          readContract: async (
            args: Parameters<PublicClient["readContract"]>[0],
          ) => {
            const pinned = {
              ...args,
              blockTag: undefined,
              blockNumber: args.blockNumber ?? (await blockNumber()),
            };
            return once(keyFor("readContract", pinned), () =>
              source.readContract(pinned),
            );
          },
          getBytecode: async (
            args: Parameters<PublicClient["getBytecode"]>[0],
          ) => {
            if (args.blockHash)
              return once(keyFor("getBytecode", args), () =>
                source.getBytecode(args),
              );
            const pinned = {
              ...args,
              blockHash: undefined,
              requireCanonical: undefined,
              blockTag: undefined,
              blockNumber: args.blockNumber ?? (await blockNumber()),
            };
            return once(keyFor("getBytecode", pinned), () =>
              source.getBytecode(pinned),
            );
          },
        } as PublicClient)
      : source;
  return {
    client,
    fundingParents: (cowShed: Address) =>
      once(`parents:${cowShed.toLowerCase()}`, () =>
        loadStopLossFundingParents({ ...scope, cowShed }),
      ),
    orders: () =>
      once("orders", () =>
        loadStopLossOrders({
          account: scope.account,
          chainIds: [scope.chainId],
        }),
      ),
  };
}
