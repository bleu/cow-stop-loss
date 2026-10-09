import { formatUnits, parseUnits, type Address } from "viem";

import { STOP_LOSS_ADDRESS } from "./contracts";
import { supportedChainIds, type ChainId } from "./publicClients";
import { getSupportedTokens } from "./supportedTokens";
import { OrderStatus, type IToken } from "./types";

export type OrderToken = Omit<IToken, "decimals"> & { decimals: number | null };

export interface StopLossOrder {
  id: string;
  parentId: string;
  chainId: ChainId;
  owner: Address;
  status: OrderStatus;
  receiver: Address;
  sellAmount: bigint;
  buyAmount: bigint;
  validTo: number;
  sellToken: OrderToken;
  buyToken: OrderToken;
  strike: bigint;
  limitPrice?: string;
  partiallyFillable: boolean;
  isSellOrder: boolean;
  createdAt?: number;
  transactionHash?: string;
  hash: string;
  sellTokenPriceOracle: Address;
  buyTokenPriceOracle: Address;
  maxTimeSinceLastOracleUpdate: number;
  executedSellAmount: bigint | null;
  executedBuyAmount: bigint | null;
  executedFee: bigint | null;
  executionPrice?: string;
  cowOrder?: { uid: string; status: string; validTo: number };
}

export interface ChainOrders {
  chainId: ChainId;
  status: "success" | "error";
  orders: StopLossOrder[];
  error?: string;
}

interface Generator {
  eventId: string;
  chainId: ChainId;
  owner: Address;
  resolvedOwner: Address | null;
  handler: Address;
  orderType: string;
  status: string;
  hash: string;
  transaction: { hash: string; blockTimestamp: string } | null;
  decodedParams: {
    receiver: Address;
    sellToken: Address;
    buyToken: Address;
    sellAmount: string;
    buyAmount: string;
    validTo: number;
    strike: string;
    isPartiallyFillable: boolean;
    isSellOrder: boolean;
    sellTokenPriceOracle: Address;
    buyTokenPriceOracle: Address;
    maxTimeSinceLastOracleUpdate: number;
  };
  discreteOrders: {
    items: {
      orderUid: string;
      status: string;
      validTo: number;
      executedSellAmount: string | null;
      executedBuyAmount: string | null;
      executedFee: string | null;
    }[];
  };
}

const ownerMappingsQuery = `
  query CowShedOwners($chain: Int!, $wallet: String!, $after: String) {
    ownerMappings(
      where: { chainId: $chain, owner: $wallet, addressType: cowshed_proxy }
      limit: 50, after: $after
    ) {
      items { chainId address owner addressType }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const ordersQuery = `
  query StopLossOrders($chain: Int!, $wallet: String!, $handler: String!, $owners: [String!]!, $after: String) {
    conditionalOrderGenerators(
      where: {
        chainId: $chain, handler: $handler, orderType: StopLoss
        OR: [{ owner_in: $owners }, { resolvedOwner: $wallet }]
      }
      limit: 50, after: $after
    ) {
      items {
        eventId chainId owner resolvedOwner handler orderType status hash decodedParams
        transaction { hash blockTimestamp }
        discreteOrders(limit: 1) {
          items { orderUid status validTo executedSellAmount executedBuyAmount executedFee }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

interface Page<T> {
  items: T[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted)
    throw signal.reason ?? new DOMException("Request aborted", "AbortError");
}

async function fetchPages<T>(
  query: string,
  field: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T[]> {
  const items: T[] = [];
  let after: string | null = null;
  const cursors = new Set<string>();
  do {
    throwIfAborted(signal);
    const response = await fetch("https://programmatic-orders.cow.fi/graphql", {
      signal,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { ...variables, after } }),
    });
    if (!response.ok) {
      throw new Error(`Order API request failed (${response.status})`);
    }
    const { data, errors } = (await response.json()) as {
      data?: Record<string, Page<T>>;
      errors?: { message: string }[];
    };
    throwIfAborted(signal);
    if (errors?.length || !data?.[field]) {
      throw new Error("Order API returned incomplete data");
    }
    const page = data[field];
    items.push(...page.items);
    if (!page.pageInfo.hasNextPage) break;
    const cursor = page.pageInfo.endCursor;
    if (!cursor || cursors.has(cursor)) {
      throw new Error("Order API pagination did not advance");
    }
    cursors.add(cursor);
    after = cursor;
  } while (after);
  return items;
}

function tokenForAddress(chainId: ChainId, address: Address): OrderToken {
  const { sellTokens, buyToken } = getSupportedTokens(chainId);
  return (
    [...sellTokens, buyToken].find(
      ({ token }) => token.address.toLowerCase() === address.toLowerCase(),
    )?.token ?? { address, symbol: "Unknown token", decimals: null }
  );
}

function priceForAmounts(
  sellAmount: bigint,
  buyAmount: bigint,
  sellToken: OrderToken,
  buyToken: OrderToken,
): string | undefined {
  if (
    sellAmount <= BigInt(0) ||
    sellToken.decimals === null ||
    buyToken.decimals === null
  ) {
    return undefined;
  }
  return formatUnits(
    (buyAmount * parseUnits("1", sellToken.decimals + 18)) /
      (sellAmount * parseUnits("1", buyToken.decimals)),
    18,
  );
}

export async function loadStopLossOrders({
  account,
  signal,
}: {
  account: Address;
  signal?: AbortSignal;
}) {
  throwIfAborted(signal);
  const chains = await Promise.all(
    supportedChainIds.map(async (chainId): Promise<ChainOrders> => {
      try {
        const mappings = await fetchPages<{
          address: Address;
          owner: Address;
          chainId: ChainId;
          addressType: string;
        }>(
          ownerMappingsQuery,
          "ownerMappings",
          { chain: chainId, wallet: account.toLowerCase() },
          signal,
        );
        const owners = [
          account.toLowerCase(),
          ...mappings
            .filter(
              (mapping) =>
                mapping.chainId === chainId &&
                mapping.owner.toLowerCase() === account.toLowerCase() &&
                mapping.addressType === "cowshed_proxy",
            )
            .map((mapping) => mapping.address.toLowerCase()),
        ];
        const parents = await fetchPages<Generator>(
          ordersQuery,
          "conditionalOrderGenerators",
          {
            chain: chainId,
            wallet: account.toLowerCase(),
            handler: STOP_LOSS_ADDRESS,
            owners,
          },
          signal,
        );
        const seen = new Set<string>();
        return {
          chainId,
          status: "success",
          orders: parents
            .filter((parent) => {
              const matches =
                parent.chainId === chainId &&
                parent.handler.toLowerCase() ===
                  STOP_LOSS_ADDRESS.toLowerCase() &&
                parent.orderType === "StopLoss" &&
                (owners.includes(parent.owner.toLowerCase()) ||
                  parent.resolvedOwner?.toLowerCase() ===
                    account.toLowerCase());
              if (!matches || seen.has(parent.eventId)) return false;
              seen.add(parent.eventId);
              return true;
            })
            .map((parent) => {
              const params = parent.decodedParams;
              const sellToken = tokenForAddress(chainId, params.sellToken);
              const buyToken = tokenForAddress(chainId, params.buyToken);
              const sellAmount = BigInt(params.sellAmount);
              const buyAmount = BigInt(params.buyAmount);
              const child = parent.discreteOrders.items[0];
              const executedSellAmount =
                child?.executedSellAmount == null
                  ? null
                  : BigInt(child.executedSellAmount);
              const executedBuyAmount =
                child?.executedBuyAmount == null
                  ? null
                  : BigInt(child.executedBuyAmount);
              const executedFee =
                child?.executedFee == null ? null : BigInt(child.executedFee);
              const partiallyFilled =
                (executedSellAmount ?? BigInt(0)) > BigInt(0) ||
                (executedBuyAmount ?? BigInt(0)) > BigInt(0);
              // This handler sets the legacy order fee to zero; executedFee is a separate surplus fee.
              const fullyFilled =
                child?.status === "fulfilled" ||
                (params.isSellOrder
                  ? sellAmount > BigInt(0) &&
                    executedSellAmount !== null &&
                    executedSellAmount >= sellAmount
                  : buyAmount > BigInt(0) &&
                    executedBuyAmount !== null &&
                    executedBuyAmount >= buyAmount);
              const cancelled =
                child?.status === "cancelled" ||
                (child?.status !== "expired" && parent.status === "Cancelled");
              const expired =
                child?.status === "expired" ||
                params.validTo < Math.floor(Date.now() / 1000) ||
                (child && child.validTo < Math.floor(Date.now() / 1000));
              const status = fullyFilled
                ? OrderStatus.FULFILLED
                : cancelled
                  ? partiallyFilled
                    ? OrderStatus.PARTIALLY_FILLED_AND_CANCELLED
                    : OrderStatus.CANCELLED
                  : expired
                    ? partiallyFilled
                      ? OrderStatus.PARTIALLY_FILLED_AND_EXPIRED
                      : OrderStatus.EXPIRED
                    : partiallyFilled
                      ? OrderStatus.PARTIALLY_FILLED
                      : OrderStatus.OPEN;
              return {
                id: `${chainId}:${parent.eventId}`,
                parentId: parent.eventId,
                chainId,
                owner: parent.owner,
                status,
                receiver: params.receiver,
                sellAmount,
                buyAmount,
                validTo: params.validTo,
                sellToken,
                buyToken,
                strike: BigInt(params.strike),
                limitPrice: priceForAmounts(
                  sellAmount,
                  buyAmount,
                  sellToken,
                  buyToken,
                ),
                partiallyFillable: params.isPartiallyFillable,
                isSellOrder: params.isSellOrder,
                createdAt: parent.transaction
                  ? Number(parent.transaction.blockTimestamp)
                  : undefined,
                transactionHash: parent.transaction?.hash,
                hash: parent.hash,
                sellTokenPriceOracle: params.sellTokenPriceOracle,
                buyTokenPriceOracle: params.buyTokenPriceOracle,
                maxTimeSinceLastOracleUpdate:
                  params.maxTimeSinceLastOracleUpdate,
                executedSellAmount,
                executedBuyAmount,
                executedFee,
                executionPrice:
                  executedSellAmount !== null && executedBuyAmount !== null
                    ? priceForAmounts(
                        executedSellAmount,
                        executedBuyAmount,
                        sellToken,
                        buyToken,
                      )
                    : undefined,
                cowOrder: child
                  ? {
                      uid: child.orderUid,
                      status: child.status,
                      validTo: child.validTo,
                    }
                  : undefined,
              };
            }),
        };
      } catch (error) {
        throwIfAborted(signal);
        return {
          chainId,
          status: "error",
          orders: [],
          error:
            error instanceof Error ? error.message : "Order API unavailable",
        };
      }
    }),
  );
  return { account, chains };
}
