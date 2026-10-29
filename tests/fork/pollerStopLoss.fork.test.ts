import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  encodeFunctionData,
  encodePacked,
  erc20Abi,
  getAddress,
  http,
  keccak256,
  maxUint256,
  parseAbi,
  parseEther,
  parseEventLogs,
  stringToHex,
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

import { composableCowAbi } from "#/lib/abis/composableCow";
import { composableCowPollerAbi } from "#/lib/abis/composableCowPoller";
import { cowShedAbi } from "#/lib/abis/cowShedFactory";
import { calculateAmounts } from "#/lib/calculateAmounts";
import {
  COMPOSABLE_COW_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
  SETTLEMENT_CONTRACT_ADDRESS,
  STOP_LOSS_ADDRESS,
  TRAMPOLINE_ADDRESS,
} from "#/lib/contracts";
import {
  configuredRouteMaxAgeSeconds,
  configuredTokenRoute,
  readOraclePairPrice,
} from "#/lib/oracleRouter";
import {
  buildPlacementApproval,
  buildPlacementSetup,
  preparePlacement,
  refreshPlacementChecks,
  verifyPlacementConfirmation,
} from "#/lib/pollerStopLoss";
import { getSupportedTokens } from "#/lib/supportedTokens";
import { type DraftOrder, OrderStatus } from "#/lib/types";

import { pollerEvents, settlementAbi, trampolineAbi } from "./contracts";

jest.mock("#/lib/cowApi/uploadAppData", () => ({
  uploadAppData: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("#/lib/stopLossOrders", () => ({
  ...jest.requireActual("#/lib/stopLossOrders"),
  loadStopLossFundingParents: jest.fn().mockResolvedValue([]),
}));

const url = process.env.FORK_TEST_RPC_URL;
if (!url || !/^http:\/\/127\.0\.0\.1:\d+$/.test(url)) {
  throw new Error("Run this suite through pnpm test:fork (local Anvil only)");
}
const client = createPublicClient({
  chain: mainnet,
  transport: http(url),
  cacheTime: 0,
});
const fork = createTestClient({
  chain: mainnet,
  mode: "anvil",
  transport: http(url),
});
const account = privateKeyToAccount(
  keccak256(stringToHex("cow-stop-loss-first-use-fork-test")),
);
const wallet = createWalletClient({
  account,
  chain: mainnet,
  transport: http(url),
});
const sellAmount = parseEther("0.01");

const fetchRpc = globalThis.fetch;
let fetchGuard: jest.SpyInstance;
beforeAll(async () => {
  fetchGuard = jest
    .spyOn(globalThis, "fetch")
    .mockImplementation((input, init) => {
      const target = new URL(
        typeof input === "string" || input instanceof URL
          ? input.toString()
          : input.url,
      );
      if (target.origin !== url)
        throw new Error("Fork tests must not access external APIs");
      return fetchRpc(input, init);
    });
  expect(await fork.getAutomine()).toBe(true);
  expect(await client.getChainId()).toBe(1);
  await fork.setBlockTimestampInterval({ interval: 1 });
});
afterAll(() => {
  fetchGuard.mockRestore();
});

let snapshot: `0x${string}`;
beforeEach(async () => {
  snapshot = await fork.snapshot();
});
afterEach(async () => {
  await fork.revert({ id: snapshot });
});

async function placeFirstOrder(triggered = true) {
  expect(await client.getTransactionCount({ address: account.address })).toBe(
    0,
  );
  expect(
    await client.getBytecode({ address: account.address }),
  ).toBeUndefined();
  await fork.setBalance({ address: account.address, value: parseEther("10") });
  const { sellTokens, buyToken } = getSupportedTokens(1);
  const tokenSell = sellTokens.find(
    ({ token }) => token.symbol === "WETH",
  )!.token;
  const tokenBuy = buyToken.token;
  const pair = { chainId: 1 as const, tokenSell, tokenBuy };
  const route = configuredTokenRoute(pair);
  const maxAge = configuredRouteMaxAgeSeconds(pair);
  const price = await readOraclePairPrice({ client, route, maxAge });
  const strikePrice = (price * (triggered ? 1.1 : 0.9)).toFixed(6);
  const draft: DraftOrder = {
    id: "first-use-fork",
    status: OrderStatus.DRAFT,
    tokenSell,
    tokenBuy,
    isSellOrder: true,
    strikePrice,
    slippagePercent: "1",
    ...calculateAmounts({
      isSellOrder: true,
      amount: "0.01",
      strikePrice,
      slippagePercent: "1",
      sellDecimals: 18,
      buyDecimals: 6,
    }),
    ...route,
    oraclePrice: price,
    maxHoursSinceOracleUpdates: maxAge / 3600,
    receiver: account.address,
    partiallyFillable: false,
    validTo: Number((await client.getBlock()).timestamp) + 3600,
    salt: keccak256(stringToHex("first-use-order")),
  };
  const prepared = await preparePlacement({
    draft,
    account: account.address,
    chainId: 1,
    client,
  });
  expect(await client.getBytecode({ address: prepared.owner })).toBeUndefined();
  const allowance = (owner: `0x${string}`, spender: `0x${string}`) =>
    client.readContract({
      address: tokenSell.address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, spender],
    });
  const balance = (owner: `0x${string}`) =>
    client.readContract({
      address: tokenSell.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [owner],
    });
  expect(await allowance(account.address, prepared.poller)).toBe(0n);
  expect(await allowance(prepared.owner, GPV2_VAULT_RELAYER_ADDRESS)).toBe(0n);
  expect(
    await client.readContract({
      address: COMPOSABLE_COW_ADDRESS,
      abi: composableCowAbi,
      functionName: "singleOrders",
      args: [prepared.owner, prepared.paramsHash],
    }),
  ).toBe(false);
  expect(
    (
      await client.readContract({
        address: prepared.poller,
        abi: composableCowPollerAbi,
        functionName: "schedules",
        args: [prepared.scheduleId],
      })
    )[0],
  ).toBe(zeroAddress);

  const deposit = await wallet.writeContract({
    address: tokenSell.address,
    abi: parseAbi(["function deposit() payable"]),
    functionName: "deposit",
    value: sellAmount,
  });
  expect(
    (await client.waitForTransactionReceipt({ hash: deposit })).status,
  ).toBe("success");
  let checks = await refreshPlacementChecks(prepared, { client });
  expect(checks).toMatchObject({
    status: "known",
    approvalRequired: true,
    settlementApprovalRequired: true,
  });
  const approval = await buildPlacementApproval(prepared, { checks });
  expect(approval.transaction).not.toBeNull();
  const approvalHash = await wallet.sendTransaction({
    ...approval.transaction!,
    account,
  });
  const approvalReceipt = await client.waitForTransactionReceipt({
    hash: approvalHash,
  });
  expect(approvalReceipt.status).toBe("success");
  expect(await allowance(account.address, prepared.poller)).toBe(sellAmount);
  checks = await refreshPlacementChecks(prepared, { client });
  expect(checks).toMatchObject({
    status: "known",
    approvalRequired: false,
    settlementApprovalRequired: true,
  });
  const setup = await buildPlacementSetup(prepared, { client, checks });
  const setupHash = await wallet.sendTransaction({ ...setup, account });
  const setupReceipt = await client.waitForTransactionReceipt({
    hash: setupHash,
  });
  expect(setupReceipt.status).toBe("success");
  expect(await client.getBytecode({ address: prepared.owner })).toMatch(
    /^0x[0-9a-f]+$/i,
  );
  expect(
    await client.readContract({
      address: prepared.owner,
      abi: cowShedAbi,
      functionName: "trustedExecutor",
    }),
  ).toBe(prepared.factory);
  expect(await allowance(prepared.owner, GPV2_VAULT_RELAYER_ADDRESS)).toBe(
    maxUint256,
  );
  expect(await verifyPlacementConfirmation(prepared, { client })).toBe(true);
  expect(
    await client.readContract({
      address: prepared.poller,
      abi: composableCowPollerAbi,
      functionName: "schedules",
      args: [prepared.scheduleId],
    }),
  ).toEqual([
    getAddress(STOP_LOSS_ADDRESS),
    0n,
    account.address,
    prepared.owner,
    draft.salt,
    prepared.staticInput,
  ]);
  const created = parseEventLogs({
    abi: composableCowAbi,
    eventName: "ConditionalOrderCreated",
    logs: setupReceipt.logs.filter(
      (log) =>
        log.address.toLowerCase() === COMPOSABLE_COW_ADDRESS.toLowerCase(),
    ),
  });
  expect(created.map(({ args }) => args)).toEqual([
    {
      owner: prepared.owner,
      params: {
        handler: getAddress(STOP_LOSS_ADDRESS),
        salt: draft.salt,
        staticInput: prepared.staticInput,
      },
    },
  ]);
  expect(await balance(account.address)).toBe(sellAmount);
  expect(await balance(prepared.owner)).toBe(0n);
  process.stdout.write(
    `Approval ${approvalHash}: ${approvalReceipt.gasUsed} gas; setup ${setupHash}: ${setupReceipt.gasUsed} gas; Shed ${prepared.owner}\n`,
  );
  return { prepared, balance };
}

test("a first-time EOA deploys its Shed and places a funded-on-execution stop loss", async () => {
  await placeFirstOrder();
});

test("an inactive stop loss cannot fund the Shed", async () => {
  const { prepared, balance } = await placeFirstOrder(false);
  const params = {
    handler: getAddress(STOP_LOSS_ADDRESS),
    salt: prepared.draft.salt,
    staticInput: prepared.staticInput,
  };
  const inactiveError = parseAbi(["error PollTryNextBlock(string reason)"]);
  await expect(
    client.readContract({
      address: COMPOSABLE_COW_ADDRESS,
      abi: [...composableCowAbi, ...inactiveError],
      functionName: "getTradeableOrderWithSignature",
      args: [prepared.owner, params, "0x", []],
    }),
  ).rejects.toThrow("strike not reached");
  await expect(
    client.simulateContract({
      address: prepared.poller,
      abi: [...composableCowPollerAbi, ...inactiveError],
      functionName: "pollFunds",
      args: [prepared.scheduleId],
      account,
    }),
  ).rejects.toThrow("strike not reached");
  expect(await balance(account.address)).toBe(sellAmount);
  expect(await balance(prepared.owner)).toBe(0n);
  expect(
    await client.readContract({
      address: prepared.poller,
      abi: composableCowPollerAbi,
      functionName: "funded",
      args: [prepared.scheduleId, prepared.orderDigest],
    }),
  ).toBe(false);
});

test("a triggered stop loss has a valid Shed signature and funds only once", async () => {
  const { prepared, balance } = await placeFirstOrder();
  const params = {
    handler: getAddress(STOP_LOSS_ADDRESS),
    salt: prepared.draft.salt,
    staticInput: prepared.staticInput,
  };
  const [order, signature] = await client.readContract({
    address: COMPOSABLE_COW_ADDRESS,
    abi: composableCowAbi,
    functionName: "getTradeableOrderWithSignature",
    args: [prepared.owner, params, "0x", []],
  });
  expect(order.sellAmount).toBe(sellAmount);
  expect(order.receiver).toBe(account.address);
  expect(
    await client.readContract({
      address: prepared.owner,
      abi: parseAbi([
        "function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)",
      ]),
      functionName: "isValidSignature",
      args: [prepared.orderDigest, signature],
    }),
  ).toBe("0x1626ba7e");
  for (let attempt = 0; attempt < 2; attempt++) {
    const hash = await wallet.writeContract({
      address: prepared.poller,
      abi: composableCowPollerAbi,
      functionName: "pollFunds",
      args: [prepared.scheduleId],
    });
    const receipt = await client.waitForTransactionReceipt({ hash });
    expect(receipt.status).toBe("success");
    const pulls = parseEventLogs({
      abi: pollerEvents,
      logs: receipt.logs.filter(
        (log) => log.address.toLowerCase() === prepared.poller.toLowerCase(),
      ),
    });
    expect(pulls).toHaveLength(attempt === 0 ? 1 : 0);
    expect(await balance(account.address)).toBe(0n);
    expect(await balance(prepared.owner)).toBe(sellAmount);
    expect(
      await client.readContract({
        address: prepared.poller,
        abi: composableCowPollerAbi,
        functionName: "funded",
        args: [prepared.scheduleId, prepared.orderDigest],
      }),
    ).toBe(true);
  }
});

test("the first stop loss settles through its funding pre-hook and pays the receiver", async () => {
  const { prepared, balance } = await placeFirstOrder();
  const params = {
    handler: getAddress(STOP_LOSS_ADDRESS),
    salt: prepared.draft.salt,
    staticInput: prepared.staticInput,
  };
  const [order, signature] = await client.readContract({
    address: COMPOSABLE_COW_ADDRESS,
    abi: composableCowAbi,
    functionName: "getTradeableOrderWithSignature",
    args: [prepared.owner, params, "0x", []],
  });
  const solver = "0x1b2E668Df159c7E06fEc46bfc5949D0F7029ec04";
  const holder = "0x28C6c06298d514Db089934071355E5743bf21d60";
  const authenticator = await client.readContract({
    address: SETTLEMENT_CONTRACT_ADDRESS,
    abi: settlementAbi,
    functionName: "authenticator",
  });
  expect(
    await client.readContract({
      address: authenticator,
      abi: parseAbi(["function isSolver(address solver) view returns (bool)"]),
      functionName: "isSolver",
      args: [solver],
    }),
  ).toBe(true);
  const buyBalance = (address: `0x${string}`) =>
    client.readContract({
      address: order.buyToken,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });
  expect(await buyBalance(holder)).toBeGreaterThanOrEqual(order.buyAmount);
  await fork.setBalance({ address: holder, value: parseEther("1") });
  await fork.setBalance({ address: solver, value: parseEther("1") });
  await fork.impersonateAccount({ address: holder });
  await fork.impersonateAccount({ address: solver });
  try {
    const liquidityHash = await wallet.writeContract({
      account: holder,
      address: order.buyToken,
      abi: erc20Abi,
      functionName: "transfer",
      args: [SETTLEMENT_CONTRACT_ADDRESS, order.buyAmount],
    });
    expect(
      (await client.waitForTransactionReceipt({ hash: liquidityHash })).status,
    ).toBe("success");
    const receiverBefore = await buyBalance(account.address);
    const uid = encodePacked(
      ["bytes32", "address", "uint32"],
      [prepared.orderDigest, prepared.owner, order.validTo],
    );
    expect(
      await client.readContract({
        address: SETTLEMENT_CONTRACT_ADDRESS,
        abi: settlementAbi,
        functionName: "filledAmount",
        args: [uid],
      }),
    ).toBe(0n);
    const hooks = JSON.parse(prepared.fullAppData).metadata.hooks.pre as {
      target: `0x${string}`;
      callData: `0x${string}`;
      gasLimit: string;
    }[];
    expect(hooks).toEqual([
      {
        target: prepared.poller,
        callData: encodeFunctionData({
          abi: composableCowPollerAbi,
          functionName: "pollFunds",
          args: [prepared.scheduleId],
        }),
        gasLimit: "350000",
      },
    ]);
    const settlementHash = await wallet.writeContract({
      account: solver,
      address: SETTLEMENT_CONTRACT_ADDRESS,
      abi: settlementAbi,
      functionName: "settle",
      args: [
        [order.sellToken, order.buyToken],
        [order.buyAmount, order.sellAmount],
        [
          {
            sellTokenIndex: 0n,
            buyTokenIndex: 1n,
            receiver: order.receiver,
            sellAmount: order.sellAmount,
            buyAmount: order.buyAmount,
            validTo: order.validTo,
            appData: order.appData,
            feeAmount: order.feeAmount,
            flags: 64n,
            executedAmount: order.sellAmount,
            signature: encodePacked(
              ["address", "bytes"],
              [prepared.owner, signature],
            ),
          },
        ],
        [
          [
            {
              target: TRAMPOLINE_ADDRESS,
              value: 0n,
              callData: encodeFunctionData({
                abi: trampolineAbi,
                functionName: "execute",
                args: [
                  hooks.map((hook) => ({
                    ...hook,
                    gasLimit: BigInt(hook.gasLimit),
                  })),
                ],
              }),
            },
          ],
          [],
          [],
        ],
      ],
    });
    const receipt = await client.waitForTransactionReceipt({
      hash: settlementHash,
    });
    expect(receipt.status).toBe("success");
    expect(await balance(account.address)).toBe(0n);
    expect(await balance(prepared.owner)).toBe(0n);
    expect(await buyBalance(account.address)).toBe(
      receiverBefore + order.buyAmount,
    );
    expect(
      await client.readContract({
        address: SETTLEMENT_CONTRACT_ADDRESS,
        abi: settlementAbi,
        functionName: "filledAmount",
        args: [uid],
      }),
    ).toBe(sellAmount);
    const pulls = parseEventLogs({
      abi: pollerEvents,
      logs: receipt.logs.filter(
        (log) => log.address.toLowerCase() === prepared.poller.toLowerCase(),
      ),
    });
    expect(pulls.map(({ args }) => args)).toEqual([
      {
        id: prepared.scheduleId,
        orderDigest: prepared.orderDigest,
        amount: sellAmount,
      },
    ]);
    const trades = parseEventLogs({
      abi: settlementAbi,
      eventName: "Trade",
      logs: receipt.logs,
    });
    expect(trades.map(({ args }) => args)).toEqual([
      {
        owner: prepared.owner,
        sellToken: order.sellToken,
        buyToken: order.buyToken,
        sellAmount,
        buyAmount: order.buyAmount,
        feeAmount: 0n,
        orderUid: uid,
      },
    ]);
    process.stdout.write(
      `Settlement ${settlementHash}: ${receipt.gasUsed} gas; receiver received ${order.buyAmount} USDC atoms\n`,
    );
  } finally {
    await fork.stopImpersonatingAccount({ address: holder });
    await fork.stopImpersonatingAccount({ address: solver });
  }
});
