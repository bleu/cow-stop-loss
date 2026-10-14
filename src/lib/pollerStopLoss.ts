import { MetadataApi } from "@cowprotocol/app-data";
import {
  Address,
  concatHex,
  encodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  Hex,
  keccak256,
  maxUint256,
  parseAbiParameters,
  PublicClient,
  stringToHex,
  zeroAddress,
} from "viem";

import { composableCowAbi } from "./abis/composableCow";
import { composableCowPollerAbi } from "./abis/composableCowPoller";
import { cowShedAbi, cowShedFactoryAbi } from "./abis/cowShedFactory";
import {
  COMPOSABLE_COW_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
  POLLER_ADDRESS_BY_CHAIN_ID,
  STOP_LOSS_ADDRESS,
} from "./contracts";
import { getOrderAmounts } from "./calculateAmounts";
import { uploadAppData } from "./cowApi/uploadAppData";
import { readOraclePrice } from "./oracleRouter";
import { ChainId, publicClientsFromIds } from "./publicClients";
import { decodeStopLossStaticInput } from "./staticInputDecoder";
import { encodeStopLossStaticInput } from "./staticInputEncoder";
import { loadStopLossFundingParents } from "./stopLossOrders";
import { getSupportedTokens } from "./supportedTokens";
import { DraftOrder } from "./types";

export async function preparePlacement({
  draft,
  account,
  chainId,
  client = publicClientsFromIds[chainId],
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
  getOrderAmounts(draft);
  const supported = getSupportedTokens(chainId);
  const sell = supported.sellTokens.find(
    ({ token }) =>
      token.address.toLowerCase() === draft.tokenSell.address.toLowerCase(),
  );
  if (
    !sell ||
    sell.token.decimals !== draft.tokenSell.decimals ||
    supported.buyToken.token.address.toLowerCase() !==
      draft.tokenBuy.address.toLowerCase() ||
    supported.buyToken.token.decimals !== draft.tokenBuy.decimals ||
    sell.priceFeed.toLowerCase() !== draft.tokenSellOracle.toLowerCase() ||
    supported.buyToken.priceFeed.toLowerCase() !==
      draft.tokenBuyOracle.toLowerCase()
  )
    throw new Error("Unsupported token or price-feed route");
  const reviewed = {
    ...draft,
    tokenSell: { ...draft.tokenSell },
    tokenBuy: { ...draft.tokenBuy },
  };
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
  const scheduleId = keccak256(
    encodeAbiParameters(
      parseAbiParameters("address, address, address, bytes32"),
      [account, STOP_LOSS_ADDRESS, owner, reviewed.salt],
    ),
  );
  const metadataApi = new MetadataApi();
  const document = await metadataApi.generateAppDataDoc({
    metadata: {
      widget: { appCode: "Stop Loss" },
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
  const { appDataHex, appDataContent } =
    await metadataApi.appDataToCid(document);
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
export type FundingSnapshot =
  | {
      status: "known";
      blockNumber: bigint;
      blockTimestamp: number;
      outstandingSellAmount: bigint;
      requiredAllowance: bigint;
      currentAllowance: bigint;
      balance: bigint;
      approvalRequired: boolean;
      combinedCommitmentsExceedBalance: boolean;
    }
  | { status: "unknown"; error: string };

export async function refreshPlacementChecks(
  prepared: PreparedPlacement,
  {
    client = publicClientsFromIds[prepared.chainId],
    localOrders = [],
  }: { client?: PublicClient; localOrders?: readonly PreparedPlacement[] } = {},
): Promise<FundingSnapshot> {
  try {
    if (
      prepared.draft.isSellOrder !== true ||
      !decodeStopLossStaticInput(prepared.staticInput).isSellOrder
    )
      throw new Error("Only exact-sell orders are supported.");
    const parents = await loadStopLossFundingParents({
      account: prepared.account,
      chainId: prepared.chainId,
      cowShed: prepared.owner,
    });
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
    if (prepared.draft.validTo <= Number(block.timestamp)) {
      throw new Error("Reviewed order has expired");
    }
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
        order.validTo <= block.timestamp
      )
        continue;
      const id = keccak256(
        encodeAbiParameters(
          parseAbiParameters("address, address, address, bytes32"),
          [prepared.account, parent.handler, parent.owner, parent.salt],
        ),
      );
      const schedule = await client.readContract({
        address: prepared.poller,
        abi: composableCowPollerAbi,
        functionName: "schedules",
        args: [id],
        blockNumber,
      });
      if (
        schedule[0].toLowerCase() !== parent.handler.toLowerCase() ||
        schedule[2].toLowerCase() !== prepared.account.toLowerCase() ||
        schedule[3].toLowerCase() !== parent.owner.toLowerCase() ||
        schedule[4].toLowerCase() !== parent.salt.toLowerCase() ||
        schedule[5].toLowerCase() !== parent.staticInput.toLowerCase()
      )
        continue;
      const [authorized, funded] = await Promise.all([
        client.readContract({
          address: COMPOSABLE_COW_ADDRESS,
          abi: composableCowAbi,
          functionName: "singleOrders",
          args: [parent.owner, parent.hash],
          blockNumber,
        }),
        client.readContract({
          address: prepared.poller,
          abi: composableCowPollerAbi,
          functionName: "funded",
          args: [
            id,
            cowOrderDigest(parent.staticInput, prepared.domainSeparator),
          ],
          blockNumber,
        }),
      ]);
      if (authorized && !funded) outstandingSellAmount += order.sellAmount;
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
    const sellAmount = getOrderAmounts(prepared.draft).sellAtoms;
    if (balance < sellAmount)
      throw new Error("Insufficient balance for this order");
    const requiredAllowance = sellAmount + outstandingSellAmount;
    return {
      status: "known",
      blockNumber,
      blockTimestamp: Number(block.timestamp),
      outstandingSellAmount,
      requiredAllowance,
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

export interface PlacementTransaction {
  account: Address;
  chainId: ChainId;
  to: Address;
  data: Hex;
  value: bigint;
}

export async function buildPlacementApproval(
  prepared: PreparedPlacement,
  {
    client = publicClientsFromIds[prepared.chainId],
    localOrders = [],
    reviewedRequiredAllowance,
  }: {
    client?: PublicClient;
    reviewedRequiredAllowance: bigint;
    localOrders?: readonly PreparedPlacement[];
  },
): Promise<{
  kind: "approval" | "reset" | "none";
  transaction: PlacementTransaction | null;
}> {
  const checks = await refreshPlacementChecks(prepared, {
    client,
    localOrders,
  });
  if (checks.status === "unknown") throw new Error(checks.error);
  if (checks.requiredAllowance !== reviewedRequiredAllowance) {
    throw new Error("Funding total changed. Review the order again.");
  }
  if (!checks.approvalRequired) return { kind: "none", transaction: null };
  const reset = checks.currentAllowance > BigInt(0);
  return {
    kind: reset ? "reset" : "approval",
    transaction: {
      account: prepared.account,
      chainId: prepared.chainId,
      to: prepared.draft.tokenSell.address,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [prepared.poller, reset ? BigInt(0) : checks.requiredAllowance],
      }),
    },
  };
}

export async function buildPlacementSetup(
  prepared: PreparedPlacement,
  {
    client = publicClientsFromIds[prepared.chainId],
    localOrders = [],
    reviewedRequiredAllowance,
  }: {
    client?: PublicClient;
    reviewedRequiredAllowance: bigint;
    localOrders?: readonly PreparedPlacement[];
  },
): Promise<PlacementTransaction> {
  const checks = await refreshPlacementChecks(prepared, {
    client,
    localOrders,
  });
  if (checks.status === "unknown") throw new Error(checks.error);
  if (checks.requiredAllowance !== reviewedRequiredAllowance) {
    throw new Error("Funding total changed. Review the order again.");
  }
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
  const shedCode = await client.getBytecode({
    address: prepared.owner,
    blockNumber: checks.blockNumber,
  });
  const settlementAllowance =
    shedCode && shedCode !== "0x"
      ? await client.readContract({
          address: prepared.draft.tokenSell.address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [prepared.owner, GPV2_VAULT_RELAYER_ADDRESS],
          blockNumber: checks.blockNumber,
        })
      : BigInt(0);
  const calls = [
    ...(settlementAllowance > BigInt(0) && settlementAllowance < maxUint256
      ? [
          {
            target: prepared.draft.tokenSell.address,
            callData: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [GPV2_VAULT_RELAYER_ADDRESS, BigInt(0)],
            }),
          },
        ]
      : []),
    ...(settlementAllowance === maxUint256
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
  }: { client?: PublicClient } = {},
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
    settlementAllowance === maxUint256
  );
}

function conditionalOrderHash(handler: Address, salt: Hex, staticInput: Hex) {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters("(address handler, bytes32 salt, bytes staticInput)"),
      [{ handler, salt, staticInput }],
    ),
  );
}

function cowOrderDigest(staticInput: Hex, domainSeparator: Hex) {
  const order = decodeStopLossStaticInput(staticInput);
  const typeHash = keccak256(
    stringToHex(
      "Order(address sellToken,address buyToken,address receiver,uint256 sellAmount,uint256 buyAmount,uint32 validTo,bytes32 appData,uint256 feeAmount,string kind,bool partiallyFillable,string sellTokenBalance,string buyTokenBalance)",
    ),
  );
  const erc20Balance = keccak256(stringToHex("erc20"));
  const structHash = keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        "bytes32,address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32",
      ),
      [
        typeHash,
        order.sellToken,
        order.buyToken,
        order.receiver,
        order.sellAmount,
        order.buyAmount,
        Number(order.validTo),
        order.appData,
        BigInt(0),
        keccak256(stringToHex(order.isSellOrder ? "sell" : "buy")),
        order.isPartiallyFillable,
        erc20Balance,
        erc20Balance,
      ],
    ),
  );
  return keccak256(concatHex(["0x1901", domainSeparator, structHash]));
}
