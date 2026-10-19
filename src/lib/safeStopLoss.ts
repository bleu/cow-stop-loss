import { MetadataApi } from "@cowprotocol/app-data";
import {
  type Address,
  encodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  hashDomain,
  type Hex,
  isHex,
  keccak256,
  parseAbi,
  parseAbiParameters,
  type PublicClient,
  stringToHex,
  zeroAddress,
} from "viem";

import { composableCowAbi } from "./abis/composableCow";
import { getOrderAmounts } from "./calculateAmounts";
import {
  COMPOSABLE_COW_ADDRESS,
  EXTENSIBLE_FALLBACK_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
  SETTLEMENT_CONTRACT_ADDRESS,
  STOP_LOSS_ADDRESS,
} from "./contracts";
import { uploadAppData } from "./cowApi/uploadAppData";
import {
  assertOracleMaxAge,
  configuredRouteMaxAgeSeconds,
  configuredTokenRoute,
  readOraclePrice,
} from "./oracleRouter";
import { type ChainId, publicClientsFromIds } from "./publicClients";
import { isSafeChainId } from "./safeChains";
import { decodeStopLossStaticInput } from "./staticInputDecoder";
import { encodeStopLossStaticInput } from "./staticInputEncoder";
import { loadStopLossOrders, type StopLossOrder } from "./stopLossOrders";
import { type DraftOrder, OrderStatus } from "./types";

function assertSafePlacementRoute(
  draft: DraftOrder,
  chainId: ChainId,
  staticInput?: Hex,
) {
  if (!isSafeChainId(chainId))
    throw new Error("Safe placement is not supported on this network");
  const pair = {
    chainId,
    tokenSell: draft.tokenSell,
    tokenBuy: draft.tokenBuy,
  };
  const route = configuredTokenRoute(pair);
  if (
    route.tokenSellOracle.toLowerCase() !==
      draft.tokenSellOracle.toLowerCase() ||
    route.tokenBuyOracle.toLowerCase() !== draft.tokenBuyOracle.toLowerCase()
  )
    throw new Error("Unsupported token or price-feed route");
  const maxAge = draft.maxHoursSinceOracleUpdates * 3600;
  const ceiling = configuredRouteMaxAgeSeconds(pair);
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

export async function prepareSafePlacement({
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
  if (draft.receiver === zeroAddress)
    throw new Error("Receiver cannot be the zero address");
  assertSafePlacementRoute(draft, chainId);
  const reviewed = structuredClone(draft);
  const metadata = new MetadataApi();
  const document = await metadata.generateAppDataDoc({
    metadata: { widget: { appCode: "Stop Loss" } },
  });
  const { appDataHex, appDataContent } = await metadata.appDataToCid(document);
  await uploadAppData({ appDataHex, fullAppData: appDataContent, chainId });
  const staticInput = encodeStopLossStaticInput(reviewed, appDataHex as Hex);
  const paramsHash = keccak256(
    encodeAbiParameters(
      parseAbiParameters("(address handler, bytes32 salt, bytes staticInput)"),
      [{ handler: STOP_LOSS_ADDRESS, salt: reviewed.salt, staticInput }],
    ),
  );
  const domainSeparator = await client.readContract({
    address: COMPOSABLE_COW_ADDRESS,
    abi: composableCowAbi,
    functionName: "domainSeparator",
  });
  return {
    account,
    owner: account,
    chainId,
    draft: reviewed,
    appDataHash: appDataHex as Hex,
    fullAppData: appDataContent,
    staticInput,
    paramsHash,
    domainSeparator,
  };
}

export type PreparedSafePlacement = Awaited<
  ReturnType<typeof prepareSafePlacement>
>;

export const safeSetupAbi = parseAbi([
  "function setFallbackHandler(address handler)",
  "function setDomainVerifier(bytes32 domainSeparator, address verifier)",
  "function domainVerifiers(address safe, bytes32 domainSeparator) view returns (address)",
]);

export type SafeCall = {
  to: Address;
  data: Hex;
  value: bigint;
  stage:
    | "fallback"
    | "verifier"
    | "approval-reset"
    | "approval"
    | "create"
    | "cancel";
};

export type SafePlacementChecks = {
  fallbackHandler: Address;
  domainVerifier: Address;
  allowance: bigint;
  requiredAllowance: bigint;
  balance: bigint;
  created: boolean;
};

export async function readSafePlacementChecks(
  prepared: PreparedSafePlacement,
  {
    client = publicClientsFromIds[prepared.chainId],
    indexedOrders,
    localOrders = [],
  }: {
    client?: PublicClient;
    indexedOrders?: readonly StopLossOrder[];
    localOrders?: readonly PreparedSafePlacement[];
  } = {},
): Promise<SafePlacementChecks> {
  assertSafePlacementRoute(
    prepared.draft,
    prepared.chainId,
    prepared.staticInput,
  );
  const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
  const { timestamp } = await client.getBlock({ blockNumber });
  const codes = await Promise.all(
    [
      COMPOSABLE_COW_ADDRESS,
      STOP_LOSS_ADDRESS,
      EXTENSIBLE_FALLBACK_ADDRESS,
      SETTLEMENT_CONTRACT_ADDRESS,
      GPV2_VAULT_RELAYER_ADDRESS,
      prepared.draft.tokenSell.address,
      prepared.account,
    ].map((address) => client.getBytecode({ address, blockNumber })),
  );
  if (codes.some((code) => !code || code === "0x"))
    throw new Error("Required Safe order contract is not deployed");
  const [settlementDomain, composableDomain] = await Promise.all([
    client.readContract({
      address: SETTLEMENT_CONTRACT_ADDRESS,
      abi: parseAbi(["function domainSeparator() view returns (bytes32)"]),
      functionName: "domainSeparator",
      blockNumber,
    }),
    client.readContract({
      address: COMPOSABLE_COW_ADDRESS,
      abi: composableCowAbi,
      functionName: "domainSeparator",
      blockNumber,
    }),
  ]);
  const expectedDomain = hashDomain({
    domain: {
      name: "Gnosis Protocol",
      version: "v2",
      chainId: prepared.chainId,
      verifyingContract: SETTLEMENT_CONTRACT_ADDRESS,
    },
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
    },
  });
  if (
    [settlementDomain, composableDomain, prepared.domainSeparator].some(
      (domain) => domain.toLowerCase() !== expectedDomain,
    )
  ) {
    throw new Error(
      "Settlement domain does not match the reviewed order and ComposableCoW",
    );
  }
  const relayer = await client.readContract({
    address: SETTLEMENT_CONTRACT_ADDRESS,
    abi: parseAbi(["function vaultRelayer() view returns (address)"]),
    functionName: "vaultRelayer",
    blockNumber,
  });
  if (relayer.toLowerCase() !== GPV2_VAULT_RELAYER_ADDRESS.toLowerCase())
    throw new Error("Settlement vault relayer does not match this app");
  if (BigInt(prepared.draft.validTo) <= timestamp)
    throw new Error("Order has expired");
  const fallback = await client.getStorageAt({
    address: prepared.account,
    slot: keccak256(stringToHex("fallback_manager.handler.address")),
    blockNumber,
  });
  const fallbackHandler: Address = fallback
    ? `0x${fallback.slice(-40)}`
    : zeroAddress;
  const domainVerifier =
    fallbackHandler.toLowerCase() === EXTENSIBLE_FALLBACK_ADDRESS.toLowerCase()
      ? await client.readContract({
          address: prepared.account,
          abi: safeSetupAbi,
          functionName: "domainVerifiers",
          args: [prepared.account, prepared.domainSeparator],
          blockNumber,
        })
      : zeroAddress;
  const [balance, allowance, created] = await Promise.all([
    client.readContract({
      address: prepared.draft.tokenSell.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [prepared.account],
      blockNumber,
    }),
    client.readContract({
      address: prepared.draft.tokenSell.address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [prepared.account, GPV2_VAULT_RELAYER_ADDRESS],
      blockNumber,
    }),
    client.readContract({
      address: COMPOSABLE_COW_ADDRESS,
      abi: composableCowAbi,
      functionName: "singleOrders",
      args: [prepared.account, prepared.paramsHash],
      blockNumber,
    }),
  ]);
  for (const oracle of [
    prepared.draft.tokenSellOracle,
    prepared.draft.tokenBuyOracle,
  ]) {
    await readOraclePrice({
      client,
      oracle,
      blockNumber,
      timestamp,
      maxAge: prepared.draft.maxHoursSinceOracleUpdates * 3600,
    });
  }
  if (!indexedOrders) {
    const result = await loadStopLossOrders({
      account: prepared.account,
      chainIds: [prepared.chainId],
    });
    const chain = result.chains.find(
      ({ chainId }) => chainId === prepared.chainId,
    );
    if (!chain || chain.status !== "success")
      throw new Error(chain?.error ?? "Indexed funding data is unavailable");
    indexedOrders = chain.orders;
  }
  const seen = new Set<string>();
  const outstanding = indexedOrders.filter((order) => {
    if (
      order.chainId === prepared.chainId &&
      order.owner.toLowerCase() === prepared.account.toLowerCase() &&
      (!isHex(order.hash) ||
        order.hash.length !== 66 ||
        typeof order.sellAmount !== "bigint" ||
        order.sellAmount <= BigInt(0) ||
        !Number.isSafeInteger(order.validTo) ||
        order.validTo < 0)
    )
      throw new Error("Order API returned incomplete Safe funding data");
    const key = `${order.chainId}:${order.owner.toLowerCase()}:${order.hash.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return (
      order.chainId === prepared.chainId &&
      order.owner.toLowerCase() === prepared.account.toLowerCase() &&
      order.sellToken.address.toLowerCase() ===
        prepared.draft.tokenSell.address.toLowerCase() &&
      BigInt(order.validTo) > timestamp &&
      ![
        OrderStatus.FULFILLED,
        OrderStatus.CANCELLED,
        OrderStatus.PARTIALLY_FILLED_AND_CANCELLED,
        OrderStatus.EXPIRED,
        OrderStatus.PARTIALLY_FILLED_AND_EXPIRED,
      ].includes(order.status)
    );
  });
  const localOutstanding = localOrders
    .filter((order) => {
      const key = `${order.chainId}:${order.owner.toLowerCase()}:${order.paramsHash.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return (
        order.chainId === prepared.chainId &&
        order.account.toLowerCase() === prepared.account.toLowerCase() &&
        order.owner.toLowerCase() === prepared.account.toLowerCase()
      );
    })
    .map((order) => decodeStopLossStaticInput(order.staticInput))
    .filter(
      (order) =>
        order.sellToken.toLowerCase() ===
          prepared.draft.tokenSell.address.toLowerCase() &&
        BigInt(order.validTo) > timestamp,
    );
  const requiredAllowance =
    getOrderAmounts(prepared.draft).sellAtoms +
    [...outstanding, ...localOutstanding].reduce(
      (total, order) => total + order.sellAmount,
      BigInt(0),
    );
  return {
    fallbackHandler,
    domainVerifier,
    balance,
    allowance,
    created,
    requiredAllowance,
  };
}

export function buildSafePlacementPlan(
  prepared: PreparedSafePlacement,
  checks: SafePlacementChecks,
): { calls: SafeCall[] } {
  assertSafePlacementRoute(
    prepared.draft,
    prepared.chainId,
    prepared.staticInput,
  );
  if (checks.created) throw new Error("This order has already been created");
  if (prepared.draft.validTo <= Math.floor(Date.now() / 1000))
    throw new Error("Order has expired");
  if (checks.balance < getOrderAmounts(prepared.draft).sellAtoms)
    throw new Error("Safe token balance is insufficient");
  if (checks.balance < checks.requiredAllowance)
    throw new Error(
      "Safe token balance is insufficient for combined commitments",
    );
  const calls: SafeCall[] = [
    {
      to: prepared.account,
      data: encodeFunctionData({
        abi: safeSetupAbi,
        functionName: "setFallbackHandler",
        args: [EXTENSIBLE_FALLBACK_ADDRESS],
      }),
      value: BigInt(0),
      stage: "fallback",
    },
    {
      to: prepared.account,
      data: encodeFunctionData({
        abi: safeSetupAbi,
        functionName: "setDomainVerifier",
        args: [prepared.domainSeparator, COMPOSABLE_COW_ADDRESS],
      }),
      value: BigInt(0),
      stage: "verifier",
    },
    {
      to: prepared.draft.tokenSell.address,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [GPV2_VAULT_RELAYER_ADDRESS, BigInt(0)],
      }),
      value: BigInt(0),
      stage: "approval-reset",
    },
    {
      to: prepared.draft.tokenSell.address,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [GPV2_VAULT_RELAYER_ADDRESS, checks.requiredAllowance],
      }),
      value: BigInt(0),
      stage: "approval",
    },
    {
      to: COMPOSABLE_COW_ADDRESS,
      data: encodeFunctionData({
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
      value: BigInt(0),
      stage: "create",
    },
  ];
  const hasHandler =
    checks.fallbackHandler.toLowerCase() ===
    EXTENSIBLE_FALLBACK_ADDRESS.toLowerCase();
  return {
    calls: calls.filter((call) => {
      if (call.stage === "fallback") return !hasHandler;
      if (call.stage === "verifier")
        return (
          !hasHandler ||
          checks.domainVerifier.toLowerCase() !==
            COMPOSABLE_COW_ADDRESS.toLowerCase()
        );
      if (call.stage === "approval-reset")
        return (
          checks.allowance > BigInt(0) &&
          checks.allowance < checks.requiredAllowance
        );
      if (call.stage === "approval")
        return checks.allowance < checks.requiredAllowance;
      return true;
    }),
  };
}
