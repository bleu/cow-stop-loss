import {
  type Address,
  encodeAbiParameters,
  hashDomain,
  hashTypedData,
  type Hex,
  keccak256,
  parseAbiParameters,
  type PublicClient,
  zeroAddress,
  zeroHash,
} from "viem";

import {
  COMPOSABLE_COW_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
  POLLER_ADDRESS_BY_CHAIN_ID,
  STOP_LOSS_ADDRESS,
} from "#/lib/contracts";
import { loadOrderFundingHealth } from "#/lib/orderFundingHealth";
import { stopLossDataStructure } from "#/lib/staticInputEncoder";
import {
  conditionalOrderHash,
  cowOrderDigest,
  stopLossScheduleId,
} from "#/lib/stopLossOrderIdentity";
import type { StopLossOrder } from "#/lib/stopLossOrders";
import { OrderStatus } from "#/lib/types";

const funder: Address = "0x1111111111111111111111111111111111111111";
const owner: Address = "0x2222222222222222222222222222222222222222";
const receiver: Address = "0x3333333333333333333333333333333333333333";
const sellToken: Address = "0x4444444444444444444444444444444444444444";
const buyToken: Address = "0x5555555555555555555555555555555555555555";
const salt = `0x${"ab".repeat(32)}` as Hex;
const appData = `0x${"cd".repeat(32)}` as Hex;
const blockNumber = BigInt(12345);
const poller = POLLER_ADDRESS_BY_CHAIN_ID[1];
const domain = {
  name: "ComposableCoW",
  version: "1",
  chainId: BigInt(1),
  verifyingContract: COMPOSABLE_COW_ADDRESS,
} as const;
const domainSeparator = hashDomain({
  domain,
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
  },
});

function staticInput(isSellOrder = true): Hex {
  return encodeAbiParameters(stopLossDataStructure, [
    sellToken,
    buyToken,
    BigInt(100),
    BigInt(200),
    appData,
    receiver,
    isSellOrder,
    true,
    2000000000,
    zeroAddress,
    zeroAddress,
    BigInt(10),
    3600,
  ]);
}

const encodedInput = staticInput();
const expectedHash = keccak256(
  encodeAbiParameters(parseAbiParameters("(address,bytes32,bytes)"), [
    [STOP_LOSS_ADDRESS, salt, encodedInput],
  ]),
);
const expectedScheduleId = keccak256(
  encodeAbiParameters(parseAbiParameters("address,address,address,bytes32"), [
    funder,
    STOP_LOSS_ADDRESS,
    owner,
    salt,
  ]),
);

function expectedDigest(isSellOrder = true) {
  return hashTypedData({
    domain,
    primaryType: "Order",
    types: {
      Order: [
        { name: "sellToken", type: "address" },
        { name: "buyToken", type: "address" },
        { name: "receiver", type: "address" },
        { name: "sellAmount", type: "uint256" },
        { name: "buyAmount", type: "uint256" },
        { name: "validTo", type: "uint32" },
        { name: "appData", type: "bytes32" },
        { name: "feeAmount", type: "uint256" },
        { name: "kind", type: "string" },
        { name: "partiallyFillable", type: "bool" },
        { name: "sellTokenBalance", type: "string" },
        { name: "buyTokenBalance", type: "string" },
      ],
    },
    message: {
      sellToken,
      buyToken,
      receiver,
      sellAmount: BigInt(100),
      buyAmount: BigInt(200),
      validTo: 2000000000,
      appData,
      feeAmount: BigInt(0),
      kind: isSellOrder ? "sell" : "buy",
      partiallyFillable: true,
      sellTokenBalance: "erc20",
      buyTokenBalance: "erc20",
    },
  });
}

const order: StopLossOrder = {
  id: "order",
  parentId: "parent",
  chainId: 1,
  owner,
  receiver,
  status: OrderStatus.OPEN,
  funding: {
    kind: "scheduled",
    funder,
    handler: STOP_LOSS_ADDRESS,
    salt,
    staticInput: encodedInput,
  },
  sellToken: { address: sellToken, symbol: "SELL", decimals: 18 },
  buyToken: { address: buyToken, symbol: "BUY", decimals: 18 },
  sellAmount: BigInt(100),
  buyAmount: BigInt(200),
  validTo: 2000000000,
  partiallyFillable: true,
  isSellOrder: true,
  hash: expectedHash,
  strike: BigInt(10),
  sellTokenPriceOracle: zeroAddress,
  buyTokenPriceOracle: zeroAddress,
  maxTimeSinceLastOracleUpdate: 3600,
  executedSellAmount: null,
  executedBuyAmount: null,
  executedFee: null,
};

const schedule = [
  STOP_LOSS_ADDRESS,
  BigInt(0),
  funder,
  owner,
  salt,
  encodedInput,
] as const;
const revokedSchedule = [
  zeroAddress,
  BigInt(0),
  zeroAddress,
  zeroAddress,
  zeroHash,
  "0x",
] as const;
type Schedule = readonly [Address, bigint, Address, Address, Hex, Hex];
type Read = {
  address: Address;
  functionName: string;
  args?: readonly unknown[];
  blockNumber: bigint;
};

async function checkHealth(
  target: StopLossOrder = order,
  options: {
    funded?: boolean;
    schedule?: Schedule;
    balance?: bigint;
    fundingAllowance?: bigint;
    settlementAllowance?: bigint;
    reject?: string;
  } = {},
) {
  const getBlockNumber = jest.fn().mockResolvedValue(blockNumber);
  if (options.reject === "getBlockNumber") {
    getBlockNumber.mockRejectedValue(new Error("RPC unavailable"));
  }
  function readResult(read: Read) {
    switch (read.functionName) {
      case "domainSeparator":
        expect(read.address).toBe(COMPOSABLE_COW_ADDRESS);
        expect(read.args).toBeUndefined();
        return domainSeparator;
      case "funded":
        expect(read.address).toBe(poller);
        expect(read.args).toEqual([expectedScheduleId, expectedDigest()]);
        return options.funded ?? false;
      case "schedules":
        expect(read.address).toBe(poller);
        expect(read.args).toEqual([expectedScheduleId]);
        return options.schedule ?? schedule;
      case "balanceOf":
        expect(read.address).toBe(sellToken);
        expect(read.args).toEqual([
          target.funding?.kind === "scheduled" && !options.funded
            ? funder
            : owner,
        ]);
        return options.balance ?? BigInt(100);
      case "allowance":
        expect(read.address).toBe(sellToken);
        if (read.args?.[1] === GPV2_VAULT_RELAYER_ADDRESS) {
          expect(read.args).toEqual([owner, GPV2_VAULT_RELAYER_ADDRESS]);
          return options.settlementAllowance ?? BigInt(100);
        }
        expect(target.funding?.kind).toBe("scheduled");
        expect(options.funded).not.toBe(true);
        expect(read.args).toEqual([funder, poller]);
        return options.fundingAllowance ?? BigInt(100);
      default:
        throw new Error(`Unexpected read: ${read.functionName}`);
    }
  }
  const readContract = jest.fn(async (read: Read) => {
    const result = readResult(read);
    if (read.functionName === options.reject)
      throw new Error("RPC unavailable");
    return result;
  });
  const client: PublicClient = { getBlockNumber, readContract } as never;
  const health = await loadOrderFundingHealth(target, client);
  if (!target.funding || target.funding.kind === "unknown") {
    expect(getBlockNumber).not.toHaveBeenCalled();
  } else {
    expect(getBlockNumber).toHaveBeenCalledTimes(1);
    expect(getBlockNumber).toHaveBeenCalledWith({ cacheTime: 0 });
  }
  // Check requests outside the loader, which catches read failures.
  for (const [read] of readContract.mock.calls) {
    expect(read.blockNumber).toBe(blockNumber);
    readResult(read);
  }
  return { health, reads: readContract.mock.calls.map(([read]) => read) };
}

const healthyWallet = {
  status: "known",
  source: "wallet",
  insufficientBalance: false,
  insufficientFundingApproval: false,
  insufficientSettlementApproval: false,
};

describe("loadOrderFundingHealth", () => {
  test("an empty CowShed can use a sufficient funder wallet, with a separate receiver", async () => {
    const { health, reads } = await checkHealth();
    expect(health).toEqual(healthyWallet);
    expect(reads.map(({ functionName }) => functionName)).toEqual([
      "domainSeparator",
      "funded",
      "schedules",
      "balanceOf",
      "allowance",
      "allowance",
    ]);
    expect(
      reads
        .filter(({ functionName }) => functionName === "balanceOf")
        .map(({ args }) => args),
    ).toEqual([[funder]]);
    expect(receiver).not.toBe(funder);
    expect(owner).not.toBe(funder);
  });

  test.each([
    ["wallet balance", { balance: BigInt(99) }, "insufficientBalance"],
    [
      "poller allowance",
      { fundingAllowance: BigInt(99) },
      "insufficientFundingApproval",
    ],
    [
      "settlement allowance",
      { settlementAllowance: BigInt(99) },
      "insufficientSettlementApproval",
    ],
  ] as const)("reports a short %s", async (_name, options, flag) => {
    const { health } = await checkHealth(order, options);
    expect(health).toEqual({ ...healthyWallet, [flag]: true });
  });

  test("wallet funding needs the full amount even after a partial fill", async () => {
    const { health } = await checkHealth(
      { ...order, executedSellAmount: BigInt(40) },
      {
        balance: BigInt(60),
        fundingAllowance: BigInt(60),
        settlementAllowance: BigInt(60),
      },
    );
    expect(health).toEqual({
      ...healthyWallet,
      insufficientBalance: true,
      insufficientFundingApproval: true,
    });
  });

  test.each([
    [BigInt(60), BigInt(60), false, false],
    [BigInt(59), BigInt(60), true, false],
    [BigInt(60), BigInt(59), false, true],
  ])(
    "funded orders check remaining CowShed funds (%s, %s)",
    async (
      balance,
      settlementAllowance,
      insufficientBalance,
      insufficientSettlementApproval,
    ) => {
      const { health, reads } = await checkHealth(
        { ...order, executedSellAmount: BigInt(40) },
        {
          funded: true,
          balance,
          settlementAllowance,
          fundingAllowance: BigInt(0),
          schedule: revokedSchedule,
        },
      );
      expect(health).toEqual({
        status: "known",
        source: "cowshed",
        insufficientBalance,
        insufficientFundingApproval: false,
        insufficientSettlementApproval,
      });
      expect(reads.map(({ functionName }) => functionName)).toEqual([
        "domainSeparator",
        "funded",
        "balanceOf",
        "allowance",
      ]);
    },
  );

  test.each([
    ["revoked", revokedSchedule],
    ["handler", [zeroAddress, ...schedule.slice(1)]],
    ["funder", [schedule[0], schedule[1], receiver, ...schedule.slice(3)]],
    [
      "owner",
      [schedule[0], schedule[1], schedule[2], receiver, salt, encodedInput],
    ],
    ["salt", [...schedule.slice(0, 4), zeroHash, encodedInput]],
    ["static input", [...schedule.slice(0, 5), "0x"]],
  ])(
    "returns unknown for an unfunded %s schedule",
    async (_name, mismatched) => {
      const { health, reads } = await checkHealth(order, {
        schedule: mismatched as Schedule,
      });
      expect(health).toEqual({ status: "unknown" });
      expect(reads.map(({ functionName }) => functionName)).toEqual([
        "domainSeparator",
        "funded",
        "schedules",
      ]);
    },
  );

  test.each<Partial<StopLossOrder>>([
    { hash: zeroHash },
    { sellToken: { ...order.sellToken, address: buyToken } },
    { buyToken: { ...order.buyToken, address: sellToken } },
    { sellAmount: BigInt(101) },
    { buyAmount: BigInt(201) },
    { receiver: funder },
    { validTo: order.validTo + 1 },
    { partiallyFillable: false },
    { isSellOrder: false },
    {
      funding: {
        kind: "scheduled",
        funder,
        handler: zeroAddress,
        salt,
        staticInput: encodedInput,
      },
    },
    {
      funding: {
        kind: "scheduled",
        funder,
        handler: STOP_LOSS_ADDRESS,
        salt,
        staticInput: "0x",
      },
    },
  ])(
    "returns unknown when the funding identity and display disagree: %p",
    async (changes) => {
      const { health, reads } = await checkHealth({ ...order, ...changes });
      expect(health).toEqual({ status: "unknown" });
      expect(reads).toEqual([]);
    },
  );

  test("scheduled exact-buy remains unknown", async () => {
    const input = staticInput(false);
    const { health, reads } = await checkHealth({
      ...order,
      isSellOrder: false,
      hash: conditionalOrderHash(STOP_LOSS_ADDRESS, salt, input),
      funding: {
        kind: "scheduled",
        funder,
        handler: STOP_LOSS_ADDRESS,
        salt,
        staticInput: input,
      },
    });
    expect(health).toEqual({ status: "unknown" });
    expect(reads).toEqual([]);
  });

  test.each([
    "domainSeparator",
    "funded",
    "schedules",
    "balanceOf",
    "allowance",
  ])("returns unknown after a rejected %s read", async (reject) => {
    const { health, reads } = await checkHealth(order, { reject });
    expect(health).toEqual({ status: "unknown" });
    expect(reads.some(({ functionName }) => functionName === reject)).toBe(
      true,
    );
  });

  test("returns unknown if the snapshot block cannot be read", async () => {
    const { health, reads } = await checkHealth(order, {
      reject: "getBlockNumber",
    });
    expect(health).toEqual({ status: "unknown" });
    expect(reads).toEqual([]);
  });

  test.each([undefined, { kind: "unknown" } as const])(
    "does not read without a known funding identity: %j",
    async (funding) => {
      const { health, reads } = await checkHealth({ ...order, funding });
      expect(health).toEqual({ status: "unknown" });
      expect(reads).toEqual([]);
    },
  );

  test.each([
    [BigInt(60), BigInt(60), false, false],
    [BigInt(59), BigInt(60), true, false],
    [BigInt(60), BigInt(59), false, true],
  ])(
    "direct orders retain owner balance and relayer checks (%s, %s)",
    async (
      balance,
      settlementAllowance,
      insufficientBalance,
      insufficientSettlementApproval,
    ) => {
      const { health, reads } = await checkHealth(
        {
          ...order,
          funding: { kind: "direct" },
          executedSellAmount: BigInt(40),
        },
        { balance, settlementAllowance },
      );
      expect(health).toEqual({
        status: "known",
        source: "direct",
        insufficientBalance,
        insufficientFundingApproval: false,
        insufficientSettlementApproval,
      });
      expect(reads.map(({ functionName }) => functionName)).toEqual([
        "balanceOf",
        "allowance",
      ]);
    },
  );

  test.each([BigInt(100), BigInt(101)])(
    "clamps the remaining amount to zero after selling %s",
    async (executedSellAmount) => {
      const { health } = await checkHealth(
        { ...order, funding: { kind: "direct" }, executedSellAmount },
        { balance: BigInt(0), settlementAllowance: BigInt(0) },
      );
      expect(health).toEqual({ ...healthyWallet, source: "direct" });
    },
  );
});

describe("stop-loss order identity", () => {
  test("hashes the conditional order tuple", () => {
    expect(conditionalOrderHash(STOP_LOSS_ADDRESS, salt, encodedInput)).toBe(
      expectedHash,
    );
    expect(
      conditionalOrderHash(STOP_LOSS_ADDRESS, zeroHash, encodedInput),
    ).not.toBe(expectedHash);
  });

  test("hashes the schedule funder, handler, owner and salt", () => {
    expect(stopLossScheduleId(funder, STOP_LOSS_ADDRESS, owner, salt)).toBe(
      expectedScheduleId,
    );
    expect(
      stopLossScheduleId(receiver, STOP_LOSS_ADDRESS, owner, salt),
    ).not.toBe(expectedScheduleId);
    expect(
      stopLossScheduleId(funder, STOP_LOSS_ADDRESS, receiver, salt),
    ).not.toBe(expectedScheduleId);
  });

  test.each([true, false])(
    "matches the EIP-712 order digest for isSellOrder=%s",
    (isSellOrder) => {
      expect(cowOrderDigest(staticInput(isSellOrder), domainSeparator)).toBe(
        expectedDigest(isSellOrder),
      );
      expect(cowOrderDigest(staticInput(isSellOrder), zeroHash)).not.toBe(
        expectedDigest(isSellOrder),
      );
    },
  );
});
