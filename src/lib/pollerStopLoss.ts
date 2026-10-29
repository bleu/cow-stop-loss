import { AppDataSdk } from "@cowprotocol/sdk-app-data";
import { ViemAdapter } from "@cowprotocol/sdk-viem-adapter";
import {
  Address,
  encodeFunctionData,
  encodePacked,
  erc20Abi,
  Hex,
  maxUint256,
  PublicClient,
  zeroAddress,
} from "viem";

import { composableCowAbi } from "./abis/composableCow";
import { composableCowPollerAbi } from "./abis/composableCowPoller";
import { cowShedAbi, cowShedFactoryAbi } from "./abis/cowShedFactory";
import { oracleMinimalAbi } from "./abis/oracleMinimalAbi";
import { getOrderAmounts } from "./calculateAmounts";
import {
  COMPOSABLE_COW_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
  POLLER_ADDRESS_BY_CHAIN_ID,
  STOP_LOSS_ADDRESS,
} from "./contracts";
import { uploadAppData } from "./cowApi/uploadAppData";
import {
  assertOracleMaxAge,
  configuredRouteMaxAgeSeconds,
  configuredTokenRoute,
  readOraclePrice,
} from "./oracleRouter";
import { assertOrderSizeLimit } from "./orderSizeLimit";
import { getPlacementReads, type PlacementReads } from "./placementReads";
import { ChainId, publicClientsFromIds } from "./publicClients";
import { decodeStopLossStaticInput } from "./staticInputDecoder";
import { encodeStopLossStaticInput } from "./staticInputEncoder";
import {
  conditionalOrderHash,
  cowOrderDigest,
  stopLossScheduleId,
} from "./stopLossOrderIdentity";
import {
  FundingParent,
  loadStopLossFundingParents,
  loadStopLossOrders,
} from "./stopLossOrders";
import { findKnownToken, getSupportedTokens } from "./supportedTokens";
import { DraftOrder, IToken } from "./types";

export function assertPlacementRoute(
  draft: Pick<
    DraftOrder,
    | "tokenSell"
    | "tokenBuy"
    | "tokenSellOracle"
    | "tokenBuyOracle"
    | "maxHoursSinceOracleUpdates"
  >,
  chainId: ChainId,
  staticInput?: Hex,
) {
  const route = configuredTokenRoute({
    chainId,
    tokenSell: draft.tokenSell,
    tokenBuy: draft.tokenBuy,
  });
  if (
    route.tokenSellOracle.toLowerCase() !==
      draft.tokenSellOracle.toLowerCase() ||
    route.tokenBuyOracle.toLowerCase() !== draft.tokenBuyOracle.toLowerCase()
  )
    throw new Error("Unsupported token or price-feed route");
  const maxAge = draft.maxHoursSinceOracleUpdates * 3600;
  const ceiling = configuredRouteMaxAgeSeconds({
    chainId,
    tokenSell: draft.tokenSell,
    tokenBuy: draft.tokenBuy,
  });
  assertOracleMaxAge(maxAge, ceiling);
  if (staticInput) {
    const order = decodeStopLossStaticInput(staticInput);
    assertOracleMaxAge(order.maxTimeSinceLastOracleUpdate, ceiling);
    if (order.maxTimeSinceLastOracleUpdate !== Math.round(maxAge))
      throw new Error(
        "Encoded oracle time limit does not match the reviewed order",
      );
    if (
      order.sellToken.toLowerCase() !== draft.tokenSell.address.toLowerCase() ||
      order.buyToken.toLowerCase() !== draft.tokenBuy.address.toLowerCase() ||
      order.sellTokenPriceOracle.toLowerCase() !==
        route.tokenSellOracle.toLowerCase() ||
      order.buyTokenPriceOracle.toLowerCase() !==
        route.tokenBuyOracle.toLowerCase()
    )
      throw new Error("Unsupported token or price-feed route");
  }
}

export async function preparePlacement({
  draft,
  account,
  chainId,
  client = getPlacementReads({ account, chainId }).client,
}: {
  draft: DraftOrder;
  account: Address;
  chainId: ChainId;
  client?: PublicClient;
}) {
  if (draft.isSellOrder !== true) {
    throw new Error("Only exact-sell placement is supported");
  }
  if (draft.receiver === zeroAddress) {
    throw new Error("Receiver cannot be the zero address");
  }
  const { sellAtoms } = getOrderAmounts(draft);
  assertPlacementRoute(draft, chainId);
  const reviewed = {
    ...draft,
    tokenSell: { ...draft.tokenSell },
    tokenBuy: { ...draft.tokenBuy },
  };
  await assertOrderSizeLimit({
    chainId,
    tokenSell: reviewed.tokenSell,
    sellAmount: sellAtoms,
    client,
  });
  const poller = POLLER_ADDRESS_BY_CHAIN_ID[chainId];
  const factory = await client.readContract({
    address: poller,
    abi: composableCowPollerAbi,
    functionName: "COW_SHED_FACTORY",
  });
  const owner = await client.readContract({
    address: factory,
    abi: cowShedFactoryAbi,
    functionName: "proxyOf",
    args: [account],
  });
  const scheduleId = stopLossScheduleId(
    account,
    STOP_LOSS_ADDRESS,
    owner,
    reviewed.salt,
  );
  const metadataApi = new AppDataSdk(new ViemAdapter({ provider: client }));
  const document = await metadataApi.generateAppDataDoc({
    appCode: "bleu-stop-loss",
    metadata: {
      widget: { appCode: "bleu-stop-loss" },
      hooks: {
        version: "0.1.0",
        pre: [
          {
            target: poller,
            callData: encodeFunctionData({
              abi: composableCowPollerAbi,
              functionName: "pollFunds",
              args: [scheduleId],
            }),
            gasLimit: "350000",
          },
        ],
      },
    },
  });
  // Keep order identities stable when the SDK changes its default schema.
  document.version = "1.1.0";
  const { appDataHex, appDataContent } =
    await metadataApi.getAppDataInfo(document);
  await uploadAppData({ appDataHex, fullAppData: appDataContent, chainId });
  const staticInput = encodeStopLossStaticInput(reviewed, appDataHex as Hex);
  const paramsHash = conditionalOrderHash(
    STOP_LOSS_ADDRESS,
    reviewed.salt,
    staticInput,
  );
  const domainSeparator = await client.readContract({
    address: COMPOSABLE_COW_ADDRESS,
    abi: composableCowAbi,
    functionName: "domainSeparator",
  });
  return {
    account,
    chainId,
    factory,
    owner,
    poller,
    draft: reviewed,
    scheduleId,
    appDataHash: appDataHex as Hex,
    fullAppData: appDataContent,
    staticInput,
    paramsHash,
    orderDigest: cowOrderDigest(staticInput, domainSeparator),
    domainSeparator,
  };
}

export type PreparedPlacement = Awaited<ReturnType<typeof preparePlacement>>;
export type PreparedApprovalRepair = Omit<
  PreparedPlacement,
  "draft" | "appDataHash" | "fullAppData"
> & {
  kind: "repair";
  draft: Pick<
    DraftOrder,
    | "isSellOrder"
    | "tokenSell"
    | "salt"
    | "validTo"
    | "tokenSellOracle"
    | "tokenBuyOracle"
    | "maxHoursSinceOracleUpdates"
  >;
};
export type ApprovalRepairSelection = {
  account: Address;
  chainId: ChainId;
  owner: Address;
  hash: Hex;
};
export type ApprovalRepairReview = {
  prepared?: PreparedApprovalRepair;
  checks: FundingSnapshot;
};

export type FundingSnapshot =
  | {
      status: "known";
      blockNumber: bigint;
      blockTimestamp: number;
      outstandingSellAmount: bigint;
      requiredAllowance: bigint;
      requiredSettlementAllowance: bigint;
      currentSettlementAllowance: bigint;
      settlementApprovalRequired: boolean;
      currentAllowance: bigint;
      balance: bigint;
      approvalRequired: boolean;
      combinedCommitmentsExceedBalance: boolean;
    }
  | { status: "unknown"; error: string };

export async function prefetchPlacementChecks({
  account,
  chainId,
  tokenSell,
}: {
  account: Address;
  chainId: ChainId;
  tokenSell?: IToken;
}) {
  const reads = getPlacementReads({ account, chainId });
  const { client } = reads;
  const poller = POLLER_ADDRESS_BY_CHAIN_ID[chainId];
  const { buyToken } = getSupportedTokens(chainId);
  const route = tokenSell
    ? configuredTokenRoute({ chainId, tokenSell, tokenBuy: buyToken.token })
    : undefined;
  const tokens = tokenSell ? [tokenSell, buyToken.token] : [];
  const oracles = route ? [...new Set(Object.values(route))] : [];
  const context = async () => {
    const factory = await client.readContract({
      address: poller,
      abi: composableCowPollerAbi,
      functionName: "COW_SHED_FACTORY",
    });
    const owner = await client.readContract({
      address: factory,
      abi: cowShedFactoryAbi,
      functionName: "proxyOf",
      args: [account],
    });
    await Promise.allSettled([
      client.getBytecode({ address: factory }),
      client.getBytecode({ address: owner }),
      client.readContract({
        address: owner,
        abi: cowShedAbi,
        functionName: "trustedExecutor",
      }),
      ...tokens.map((token) =>
        client.readContract({
          address: token.address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [owner, GPV2_VAULT_RELAYER_ADDRESS],
        }),
      ),
      (async () => {
        const [parents, domainSeparator] = await Promise.all([
          reads.fundingParents(owner),
          client.readContract({
            address: COMPOSABLE_COW_ADDRESS,
            abi: composableCowAbi,
            functionName: "domainSeparator",
          }),
        ]);
        await Promise.allSettled(
          parents.map(async (parent) => {
            const id = stopLossScheduleId(
              account,
              parent.handler,
              parent.owner,
              parent.salt,
            );
            await Promise.allSettled([
              client.readContract({
                address: poller,
                abi: composableCowPollerAbi,
                functionName: "schedules",
                args: [id],
              }),
              client.readContract({
                address: COMPOSABLE_COW_ADDRESS,
                abi: composableCowAbi,
                functionName: "singleOrders",
                args: [parent.owner, parent.hash],
              }),
              (async () => {
                const funded = await client.readContract({
                  address: poller,
                  abi: composableCowPollerAbi,
                  functionName: "funded",
                  args: [
                    id,
                    cowOrderDigest(parent.staticInput, domainSeparator),
                  ],
                });
                if (funded) await reads.orders();
              })(),
            ]);
          }),
        );
      })(),
    ]);
  };
  await Promise.allSettled([
    context(),
    client.getBlock(),
    ...[poller, COMPOSABLE_COW_ADDRESS, STOP_LOSS_ADDRESS].map((address) =>
      client.getBytecode({ address }),
    ),
    client.readContract({
      address: poller,
      abi: composableCowPollerAbi,
      functionName: "COMPOSABLE_COW",
    }),
    client.readContract({
      address: COMPOSABLE_COW_ADDRESS,
      abi: composableCowAbi,
      functionName: "domainSeparator",
    }),
    ...tokens.flatMap((token) => [
      client.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account],
      }),
      client.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [account, poller],
      }),
    ]),
    ...oracles.flatMap((oracle) => [
      client.readContract({
        address: oracle,
        abi: oracleMinimalAbi,
        functionName: "latestRoundData",
      }),
      client.readContract({
        address: oracle,
        abi: oracleMinimalAbi,
        functionName: "decimals",
      }),
    ]),
  ]);
}

export async function refreshPlacementChecks(
  prepared: PreparedPlacement,
  options: {
    client?: PublicClient;
    localOrders?: readonly PreparedPlacement[];
    minimumBlockNumber?: bigint;
  } = {},
): Promise<FundingSnapshot> {
  try {
    assertPlacementRoute(
      prepared.draft,
      prepared.chainId,
      prepared.staticInput,
    );
  } catch (error) {
    return {
      status: "unknown",
      error:
        error instanceof Error
          ? error.message
          : "Unsupported token or price-feed route",
    };
  }
  return refreshFundingChecks(prepared, {
    localOrders: options.localOrders,
    reads: getPlacementReads({
      ...prepared,
      client: options.client,
      minimumBlockNumber: options.minimumBlockNumber,
    }),
  });
}

async function refreshFundingChecks(
  prepared: PreparedPlacement | PreparedApprovalRepair,
  {
    reads,
    client = reads?.client ?? publicClientsFromIds[prepared.chainId],
    localOrders = [],
    parents: reviewedParents,
  }: {
    client?: PublicClient;
    localOrders?: readonly PreparedPlacement[];
    parents?: FundingParent[];
    reads?: PlacementReads;
  } = {},
): Promise<FundingSnapshot> {
  try {
    if (
      prepared.draft.isSellOrder !== true ||
      !decodeStopLossStaticInput(prepared.staticInput).isSellOrder
    )
      throw new Error("Only exact-sell orders are supported.");
    const repair = "kind" in prepared && prepared.kind === "repair";
    const parents =
      reviewedParents ??
      (await (reads?.fundingParents(prepared.owner) ??
        loadStopLossFundingParents({
          account: prepared.account,
          chainId: prepared.chainId,
          cowShed: prepared.owner,
        })));
    const blockNumber = await client.getBlockNumber();
    const block = await client.getBlock({ blockNumber });
    const codes = await Promise.all(
      [
        prepared.poller,
        prepared.factory,
        COMPOSABLE_COW_ADDRESS,
        STOP_LOSS_ADDRESS,
      ].map((address) => client.getBytecode({ address, blockNumber })),
    );
    if (codes.some((code) => !code || code === "0x")) {
      throw new Error("Required stop-loss contract is not deployed");
    }
    const pinnedComposableCow = await client.readContract({
      address: prepared.poller,
      abi: composableCowPollerAbi,
      functionName: "COMPOSABLE_COW",
      blockNumber,
    });
    if (
      pinnedComposableCow.toLowerCase() !== COMPOSABLE_COW_ADDRESS.toLowerCase()
    ) {
      throw new Error("Poller contract configuration does not match this app");
    }
    const shedCode = await client.getBytecode({
      address: prepared.owner,
      blockNumber,
    });
    if (shedCode && shedCode !== "0x") {
      const trustedExecutor = await client.readContract({
        address: prepared.owner,
        abi: cowShedAbi,
        functionName: "trustedExecutor",
        blockNumber,
      });
      if (trustedExecutor.toLowerCase() !== prepared.factory.toLowerCase()) {
        throw new Error("CowShed does not trust the Poller-pinned factory");
      }
    }
    if (prepared.draft.validTo < Number(block.timestamp)) {
      throw new Error("Reviewed order has expired");
    }
    if (!repair)
      await Promise.all(
        [prepared.draft.tokenSellOracle, prepared.draft.tokenBuyOracle].map(
          (oracle) =>
            readOraclePrice({
              client,
              oracle,
              blockNumber,
              timestamp: block.timestamp,
              maxAge: prepared.draft.maxHoursSinceOracleUpdates * 3600,
            }),
        ),
      );
    const fundingParents = [
      ...parents,
      ...localOrders
        .filter(
          (order) =>
            order.chainId === prepared.chainId &&
            order.account.toLowerCase() === prepared.account.toLowerCase(),
        )
        .map((order) => ({
          chainId: order.chainId,
          owner: order.owner,
          handler: STOP_LOSS_ADDRESS,
          salt: order.draft.salt,
          hash: order.paramsHash,
          staticInput: order.staticInput,
        })),
    ];
    let outstandingSellAmount = BigInt(0);
    let outstandingSettlementAmount = BigInt(0);
    let displayed: Awaited<ReturnType<typeof loadStopLossOrders>> | undefined;
    const seen = new Set<string>();
    for (const parent of fundingParents) {
      const key = `${parent.owner.toLowerCase()}:${parent.hash.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (
        conditionalOrderHash(
          parent.handler,
          parent.salt,
          parent.staticInput,
        ) !== parent.hash.toLowerCase()
      ) {
        throw new Error("Order API returned inconsistent funding parameters");
      }
      const order = decodeStopLossStaticInput(parent.staticInput);
      if (
        order.sellToken.toLowerCase() !==
          prepared.draft.tokenSell.address.toLowerCase() ||
        order.validTo < block.timestamp
      )
        continue;
      const id = stopLossScheduleId(
        prepared.account,
        parent.handler,
        parent.owner,
        parent.salt,
      );
      const schedule = await client.readContract({
        address: prepared.poller,
        abi: composableCowPollerAbi,
        functionName: "schedules",
        args: [id],
        blockNumber,
      });
      const registered =
        schedule[0].toLowerCase() === parent.handler.toLowerCase() &&
        schedule[2].toLowerCase() === prepared.account.toLowerCase() &&
        schedule[3].toLowerCase() === parent.owner.toLowerCase() &&
        schedule[4].toLowerCase() === parent.salt.toLowerCase() &&
        schedule[5].toLowerCase() === parent.staticInput.toLowerCase();
      const authorized = await client.readContract({
        address: COMPOSABLE_COW_ADDRESS,
        abi: composableCowAbi,
        functionName: "singleOrders",
        args: [parent.owner, parent.hash],
        blockNumber,
      });
      if (!authorized) {
        if (
          repair &&
          parent.owner.toLowerCase() === prepared.owner.toLowerCase() &&
          parent.hash.toLowerCase() === prepared.paramsHash.toLowerCase()
        )
          throw new Error("Selected order is no longer authorized");
        continue;
      }
      const funded = await client.readContract({
        address: prepared.poller,
        abi: composableCowPollerAbi,
        functionName: "funded",
        args: [
          id,
          cowOrderDigest(parent.staticInput, prepared.domainSeparator),
        ],
        blockNumber,
      });
      if (authorized && !funded) {
        if (registered) outstandingSellAmount += order.sellAmount;
        if (parent.owner.toLowerCase() === prepared.owner.toLowerCase())
          outstandingSettlementAmount += order.sellAmount;
      } else if (
        authorized &&
        funded &&
        parent.owner.toLowerCase() === prepared.owner.toLowerCase()
      ) {
        displayed ??= await (reads?.orders() ??
          loadStopLossOrders({ account: prepared.account }));
        const chain = displayed.chains.find(
          ({ chainId }) => chainId === prepared.chainId,
        );
        if (!chain || chain.status === "error")
          throw new Error(
            chain?.error ?? "Settlement execution data is unavailable",
          );
        const execution = chain.orders.find(
          (candidate) =>
            candidate.owner.toLowerCase() === parent.owner.toLowerCase() &&
            candidate.hash.toLowerCase() === parent.hash.toLowerCase(),
        );
        const expectedUid = encodePacked(
          ["bytes32", "address", "uint32"],
          [
            cowOrderDigest(parent.staticInput, prepared.domainSeparator),
            parent.owner,
            Number(order.validTo),
          ],
        );
        if (
          !execution?.cowOrder ||
          execution.cowOrder.uid.toLowerCase() !== expectedUid.toLowerCase() ||
          execution.cowOrder.validTo !== Number(order.validTo) ||
          execution.sellAmount !== order.sellAmount ||
          execution.sellToken.address.toLowerCase() !==
            order.sellToken.toLowerCase() ||
          execution.executedSellAmount === null ||
          execution.executedSellAmount < BigInt(0) ||
          execution.executedSellAmount > order.sellAmount ||
          (!order.isSellOrder &&
            (execution.executedBuyAmount === null ||
              execution.executedBuyAmount < BigInt(0)))
        ) {
          if (!repair) {
            // Keep the full settlement obligation until indexed fills can be verified.
            outstandingSettlementAmount += order.sellAmount;
            continue;
          }
          throw new Error(
            "Settlement execution data is missing or inconsistent",
          );
        }
        if (
          !order.isSellOrder &&
          execution.executedBuyAmount !== null &&
          execution.executedBuyAmount >= order.buyAmount
        )
          continue;
        outstandingSettlementAmount +=
          order.sellAmount - execution.executedSellAmount;
      }
    }
    const [currentAllowance, balance] = await Promise.all([
      client.readContract({
        address: prepared.draft.tokenSell.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [prepared.account, prepared.poller],
        blockNumber,
      }),
      client.readContract({
        address: prepared.draft.tokenSell.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [prepared.account],
        blockNumber,
      }),
    ]);
    const sellAmount = repair
      ? BigInt(0)
      : decodeStopLossStaticInput(prepared.staticInput).sellAmount;
    if (!repair && balance < sellAmount)
      throw new Error("Insufficient balance for this order");
    const currentSettlementAllowance =
      shedCode && shedCode !== "0x"
        ? await client.readContract({
            address: prepared.draft.tokenSell.address,
            abi: erc20Abi,
            functionName: "allowance",
            args: [prepared.owner, GPV2_VAULT_RELAYER_ADDRESS],
            blockNumber,
          })
        : BigInt(0);
    const requiredSettlementAllowance =
      sellAmount + outstandingSettlementAmount;
    const requiredAllowance = sellAmount + outstandingSellAmount;
    return {
      status: "known",
      blockNumber,
      blockTimestamp: Number(block.timestamp),
      outstandingSellAmount,
      requiredAllowance,
      requiredSettlementAllowance,
      currentSettlementAllowance,
      settlementApprovalRequired:
        currentSettlementAllowance < requiredSettlementAllowance,
      currentAllowance,
      balance,
      approvalRequired: currentAllowance < requiredAllowance,
      combinedCommitmentsExceedBalance: requiredAllowance > balance,
    };
  } catch (error) {
    return {
      status: "unknown",
      error:
        error instanceof Error ? error.message : "Funding state is unavailable",
    };
  }
}

export async function refreshApprovalRepair(
  selection: ApprovalRepairSelection,
  {
    client = publicClientsFromIds[selection.chainId],
    localOrders = [],
  }: { client?: PublicClient; localOrders?: readonly PreparedPlacement[] } = {},
): Promise<ApprovalRepairReview> {
  try {
    const poller = POLLER_ADDRESS_BY_CHAIN_ID[selection.chainId];
    const factory = await client.readContract({
      address: poller,
      abi: composableCowPollerAbi,
      functionName: "COW_SHED_FACTORY",
    });
    const owner = await client.readContract({
      address: factory,
      abi: cowShedFactoryAbi,
      functionName: "proxyOf",
      args: [selection.account],
    });
    if (owner.toLowerCase() !== selection.owner.toLowerCase())
      throw new Error("This CowShed is not controlled by the connected wallet");
    const parents = await loadStopLossFundingParents({
      account: selection.account,
      chainId: selection.chainId,
      cowShed: owner,
    });
    const parent = parents.find(
      (candidate) =>
        candidate.owner.toLowerCase() === owner.toLowerCase() &&
        candidate.hash.toLowerCase() === selection.hash.toLowerCase(),
    );
    if (
      !parent ||
      conditionalOrderHash(parent.handler, parent.salt, parent.staticInput) !==
        parent.hash.toLowerCase()
    )
      throw new Error(
        "Selected order funding identity is unavailable or inconsistent",
      );
    const order = decodeStopLossStaticInput(parent.staticInput);
    const tokenSell = findKnownToken(selection.chainId, order.sellToken);
    if (!order.isSellOrder || !tokenSell)
      throw new Error("Only supported exact-sell orders can update approval");
    const domainSeparator = await client.readContract({
      address: COMPOSABLE_COW_ADDRESS,
      abi: composableCowAbi,
      functionName: "domainSeparator",
    });
    const prepared: PreparedApprovalRepair = {
      kind: "repair",
      account: selection.account,
      chainId: selection.chainId,
      owner,
      poller,
      factory,
      staticInput: parent.staticInput,
      paramsHash: parent.hash,
      domainSeparator,
      orderDigest: cowOrderDigest(parent.staticInput, domainSeparator),
      scheduleId: stopLossScheduleId(
        selection.account,
        parent.handler,
        owner,
        parent.salt,
      ),
      draft: {
        tokenSell,
        isSellOrder: true,
        salt: parent.salt,
        validTo: order.validTo,
        tokenSellOracle: order.sellTokenPriceOracle,
        tokenBuyOracle: order.buyTokenPriceOracle,
        maxHoursSinceOracleUpdates: order.maxTimeSinceLastOracleUpdate / 3600,
      },
    };
    const checks = await refreshFundingChecks(prepared, {
      client,
      localOrders,
      parents,
    });
    return { prepared, checks };
  } catch (cause) {
    return {
      checks: {
        status: "unknown",
        error:
          cause instanceof Error
            ? cause.message
            : "Approval state is unavailable",
      },
    };
  }
}

export type ApprovalRepairStage = "wallet" | "settlement";
export type ApprovalRepairWork = {
  stage: ApprovalRepairStage;
  target: bigint;
  transaction: PlacementTransaction;
};

export async function buildApprovalRepair(
  prepared: PreparedApprovalRepair,
  {
    checks,
    mode = "limited",
  }: { checks: FundingSnapshot; mode?: ApprovalMode },
): Promise<ApprovalRepairWork[]> {
  if (checks.status === "unknown") throw new Error(checks.error);
  const work: ApprovalRepairWork[] = [];
  const wallet = await buildPlacementApproval(prepared, { checks, mode });
  if (wallet.transaction)
    work.push({
      stage: "wallet",
      target: mode === "unlimited" ? maxUint256 : checks.requiredAllowance,
      transaction: wallet.transaction,
    });
  if (checks.settlementApprovalRequired)
    work.push({
      stage: "settlement",
      target: maxUint256,
      transaction: {
        account: prepared.account,
        chainId: prepared.chainId,
        to: prepared.factory,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: cowShedFactoryAbi,
          functionName: "executeOwnHooks",
          args: [
            [
              {
                target: prepared.draft.tokenSell.address,
                value: BigInt(0),
                allowFailure: false,
                isDelegateCall: false,
                callData: encodeFunctionData({
                  abi: erc20Abi,
                  functionName: "approve",
                  args: [GPV2_VAULT_RELAYER_ADDRESS, maxUint256],
                }),
              },
            ],
          ],
        }),
      },
    });
  return work;
}

export interface PlacementTransaction {
  account: Address;
  chainId: ChainId;
  to: Address;
  data: Hex;
  value: bigint;
}

export type ApprovalMode = "limited" | "unlimited";

export async function assertPlacementOrderSize(
  prepared: PreparedPlacement,
  client = publicClientsFromIds[prepared.chainId],
) {
  await assertOrderSizeLimit({
    chainId: prepared.chainId,
    tokenSell: prepared.draft.tokenSell,
    sellAmount: decodeStopLossStaticInput(prepared.staticInput).sellAmount,
    client,
  });
}

export async function buildPlacementApproval(
  prepared: PreparedPlacement | PreparedApprovalRepair,
  {
    checks,
    mode = "limited",
    client = publicClientsFromIds[prepared.chainId],
  }: { checks: FundingSnapshot; mode?: ApprovalMode; client?: PublicClient },
): Promise<{
  kind: "approval" | "none";
  transaction: PlacementTransaction | null;
}> {
  if (
    prepared.draft.isSellOrder !== true ||
    !decodeStopLossStaticInput(prepared.staticInput).isSellOrder
  )
    throw new Error("Only exact-sell orders are supported.");
  if (!("kind" in prepared)) {
    assertPlacementRoute(
      prepared.draft,
      prepared.chainId,
      prepared.staticInput,
    );
    await assertPlacementOrderSize(prepared, client);
  }
  if (checks.status === "unknown") throw new Error(checks.error);
  if (!checks.approvalRequired) return { kind: "none", transaction: null };
  return {
    kind: "approval",
    transaction: {
      account: prepared.account,
      chainId: prepared.chainId,
      to: prepared.draft.tokenSell.address,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [
          prepared.poller,
          mode === "unlimited" ? maxUint256 : checks.requiredAllowance,
        ],
      }),
    },
  };
}

export async function buildPlacementSetup(
  prepared: PreparedPlacement,
  {
    client = publicClientsFromIds[prepared.chainId],
    checks,
  }: { client?: PublicClient; checks: FundingSnapshot },
): Promise<PlacementTransaction> {
  if (
    prepared.draft.isSellOrder !== true ||
    !decodeStopLossStaticInput(prepared.staticInput).isSellOrder
  )
    throw new Error("Only exact-sell orders are supported.");
  assertPlacementRoute(prepared.draft, prepared.chainId, prepared.staticInput);
  await assertPlacementOrderSize(prepared, client);
  if (checks.status === "unknown") throw new Error(checks.error);
  if (checks.approvalRequired) {
    throw new Error("Approve the funding amount before placing this order");
  }
  const authorized = await client.readContract({
    address: COMPOSABLE_COW_ADDRESS,
    abi: composableCowAbi,
    functionName: "singleOrders",
    args: [prepared.owner, prepared.paramsHash],
  });
  if (authorized) throw new Error("This order has already been created.");
  const schedule = await client.readContract({
    address: prepared.poller,
    abi: composableCowPollerAbi,
    functionName: "schedules",
    args: [prepared.scheduleId],
  });
  const calls = [
    ...(!checks.settlementApprovalRequired
      ? []
      : [
          {
            target: prepared.draft.tokenSell.address,
            callData: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [GPV2_VAULT_RELAYER_ADDRESS, maxUint256],
            }),
          },
        ]),
    {
      target: COMPOSABLE_COW_ADDRESS,
      callData: encodeFunctionData({
        abi: composableCowAbi,
        functionName: "create",
        args: [
          {
            handler: STOP_LOSS_ADDRESS,
            salt: prepared.draft.salt,
            staticInput: prepared.staticInput,
          },
          true,
        ],
      }),
    },
    {
      target: prepared.poller,
      callData: encodeFunctionData({
        abi: composableCowPollerAbi,
        functionName: "registerFromShed",
        args: [
          {
            handler: STOP_LOSS_ADDRESS,
            authEpoch: schedule[1],
            funder: prepared.account,
            owner: prepared.owner,
            salt: prepared.draft.salt,
            staticInput: prepared.staticInput,
          },
        ],
      }),
    },
  ].map((call) => ({
    ...call,
    value: BigInt(0),
    allowFailure: false,
    isDelegateCall: false,
  }));
  return {
    account: prepared.account,
    chainId: prepared.chainId,
    to: prepared.factory,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: cowShedFactoryAbi,
      functionName: "executeOwnHooks",
      args: [calls],
    }),
  };
}

export async function verifyPlacementConfirmation(
  prepared: PreparedPlacement,
  {
    client = publicClientsFromIds[prepared.chainId],
    requiredSettlementAllowance = decodeStopLossStaticInput(
      prepared.staticInput,
    ).sellAmount,
  }: { client?: PublicClient; requiredSettlementAllowance?: bigint } = {},
): Promise<boolean> {
  const blockNumber = await client.getBlockNumber();
  const shedCode = await client.getBytecode({
    address: prepared.owner,
    blockNumber,
  });
  if (!shedCode || shedCode === "0x") return false;
  const authorized = await client.readContract({
    address: COMPOSABLE_COW_ADDRESS,
    abi: composableCowAbi,
    functionName: "singleOrders",
    args: [prepared.owner, prepared.paramsHash],
    blockNumber,
  });
  if (!authorized) return false;
  const [schedule, trustedExecutor, settlementAllowance] = await Promise.all([
    client.readContract({
      address: prepared.poller,
      abi: composableCowPollerAbi,
      functionName: "schedules",
      args: [prepared.scheduleId],
      blockNumber,
    }),
    client.readContract({
      address: prepared.owner,
      abi: cowShedAbi,
      functionName: "trustedExecutor",
      blockNumber,
    }),
    client.readContract({
      address: prepared.draft.tokenSell.address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [prepared.owner, GPV2_VAULT_RELAYER_ADDRESS],
      blockNumber,
    }),
  ]);
  return (
    schedule[0].toLowerCase() === STOP_LOSS_ADDRESS.toLowerCase() &&
    schedule[2].toLowerCase() === prepared.account.toLowerCase() &&
    schedule[3].toLowerCase() === prepared.owner.toLowerCase() &&
    schedule[4].toLowerCase() === prepared.draft.salt.toLowerCase() &&
    schedule[5].toLowerCase() === prepared.staticInput.toLowerCase() &&
    trustedExecutor.toLowerCase() === prepared.factory.toLowerCase() &&
    settlementAllowance >= requiredSettlementAllowance
  );
}
