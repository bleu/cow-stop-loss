import { erc20Abi } from "viem";

import {
  getPlacementReads,
  invalidatePlacementReads,
  PLACEMENT_READ_MAX_AGE,
} from "#/lib/placementReads";
import { publicClientsFromIds } from "#/lib/publicClients";

const scope = {
  account: "0x1111111111111111111111111111111111111111",
  chainId: 1,
} as const;
const balanceRead = {
  address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [scope.account],
} as const;

beforeEach(() => {
  invalidatePlacementReads(scope);
  jest
    .spyOn(publicClientsFromIds[1], "getBlockNumber")
    .mockResolvedValue(BigInt(100));
});
afterEach(() => {
  invalidatePlacementReads(scope);
  jest.restoreAllMocks();
});

test("shares concurrent reads from the same block", async () => {
  const read = jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockResolvedValue(BigInt(7));
  const { client } = getPlacementReads(scope);
  await expect(
    Promise.all([
      client.readContract(balanceRead),
      client.readContract(balanceRead),
    ]),
  ).resolves.toEqual([BigInt(7), BigInt(7)]);
  expect(read).toHaveBeenCalledTimes(1);
  expect(read).toHaveBeenCalledWith(
    expect.objectContaining({ blockNumber: BigInt(100) }),
  );
});

test("keeps wallets and networks separate", () => {
  const first = getPlacementReads(scope);
  expect(
    getPlacementReads({
      ...scope,
      account: "0x2222222222222222222222222222222222222222",
    }),
  ).not.toBe(first);
  expect(getPlacementReads({ ...scope, chainId: 100 })).not.toBe(first);
});

test("refreshes expired reads and reads invalidated after an approval", async () => {
  const now = jest.spyOn(Date, "now").mockReturnValue(1000);
  const read = jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockResolvedValueOnce(BigInt(0))
    .mockResolvedValueOnce(BigInt(1))
    .mockResolvedValueOnce(BigInt(2));
  await expect(
    getPlacementReads(scope).client.readContract(balanceRead),
  ).resolves.toBe(BigInt(0));
  now.mockReturnValue(1000 + PLACEMENT_READ_MAX_AGE);
  await expect(
    getPlacementReads(scope).client.readContract(balanceRead),
  ).resolves.toBe(BigInt(1));
  invalidatePlacementReads(scope);
  await expect(
    getPlacementReads(scope).client.readContract(balanceRead),
  ).resolves.toBe(BigInt(2));
  expect(read).toHaveBeenCalledTimes(3);
});

test("replaces an older snapshot with reads at or after the receipt block", async () => {
  const read = jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockResolvedValue(BigInt(7));
  const previous = getPlacementReads(scope);
  await previous.client.readContract(balanceRead);
  const current = getPlacementReads({
    ...scope,
    minimumBlockNumber: BigInt(101),
  });
  expect(current).not.toBe(previous);
  await current.client.readContract(balanceRead);
  expect(read).toHaveBeenLastCalledWith(
    expect.objectContaining({ blockNumber: BigInt(101) }),
  );
  expect(getPlacementReads(scope)).toBe(current);
  expect(publicClientsFromIds[1].getBlockNumber).toHaveBeenCalledWith({
    cacheTime: 0,
  });
});

test("uses a newer chain head instead of the receipt block when available", async () => {
  jest
    .mocked(publicClientsFromIds[1].getBlockNumber)
    .mockResolvedValue(BigInt(102));
  const { client } = getPlacementReads({
    ...scope,
    minimumBlockNumber: BigInt(101),
  });
  await expect(client.getBlockNumber()).resolves.toBe(BigInt(102));
});

test("keeps an explicit block when an injected client's head advances", async () => {
  jest
    .mocked(publicClientsFromIds[1].getBlockNumber)
    .mockResolvedValueOnce(BigInt(101))
    .mockResolvedValue(BigInt(102));
  const getBlock = jest
    .spyOn(publicClientsFromIds[1], "getBlock")
    .mockResolvedValue({ timestamp: BigInt(1000) } as never);
  const { client } = getPlacementReads({
    ...scope,
    client: publicClientsFromIds[1],
    minimumBlockNumber: BigInt(101),
  });
  const blockNumber = await client.getBlockNumber();
  await client.getBlock({ blockNumber });
  expect(getBlock).toHaveBeenCalledWith(
    expect.objectContaining({ blockNumber: BigInt(101) }),
  );
});

test("retries a failed read instead of caching a missing balance", async () => {
  const read = jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockRejectedValueOnce(new Error("RPC unavailable"))
    .mockResolvedValueOnce(BigInt(7));
  const { client } = getPlacementReads(scope);
  await expect(client.readContract(balanceRead)).rejects.toThrow(
    "RPC unavailable",
  );
  await expect(client.readContract(balanceRead)).resolves.toBe(BigInt(7));
  expect(read).toHaveBeenCalledTimes(2);
});
