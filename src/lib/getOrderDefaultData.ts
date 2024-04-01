import { Address } from "viem";
import { ChainId } from "./publicClients";
import {
  HOOK_TYPES,
  IEdgeData,
  IMintBalData,
  IMultiSendData,
  INodeData,
  IStopLossConditionData,
  ISwapData,
  IToken,
  TIME_OPTIONS,
} from "./types";
import { Edge, Node } from "reactflow";
import { defaultNodeProps } from "#/components/nodes";
import { cowTokenList } from "./cowTokenList";
import { CHAINS_ORACLE_ROUTER_FACTORY } from "./oracleRouter";
import { defaultEdgeProps } from "#/components/edges";
import { balancerGaugesApi } from "./gql/client";

export async function getDefaultMintBalData(
  chainId: ChainId,
  safeAddress: Address
): Promise<Omit<IMintBalData, "orderId">> {
  const gaugesShares = await balancerGaugesApi
    .gql(chainId)
    .GaugeSharesByUser({ user: safeAddress.toLowerCase() });

  const liveGauges = gaugesShares.gaugeShares
    .filter(({ gauge }) => !gauge.isKilled)
    .map(({ gauge }) => gauge.id);

  return {
    chainId: chainId,
    safeAddress: safeAddress,
    type: HOOK_TYPES.MINT_BAL,
    gauges: liveGauges as Address[],
  };
}

export const getDefaultStopLossData = async ({
  chainId,
  tokenBuy,
  tokenSell,
}: {
  chainId: ChainId;
  tokenSell: IToken;
  tokenBuy: IToken;
}): Promise<Omit<IStopLossConditionData, "orderId">> => {
  const router = new CHAINS_ORACLE_ROUTER_FACTORY[chainId]({
    chainId,
    tokenBuy,
    tokenSell,
  });
  const route = await router.findRoute();
  const strikePrice = await router.calculatePrice(route);

  return {
    strikePrice,
    tokenSellOracle: route.tokenSellOracle,
    tokenBuyOracle: route.tokenBuyOracle,
    maxTimeSinceLastOracleUpdate: TIME_OPTIONS.MINUTE_15,
  };
};

export const getDefaultSwapData = (
  chainId: number,
  safeAddress: Address
): Omit<ISwapData, "orderId"> => ({
  tokenSell: cowTokenList.findLast(
    (token) => token.symbol === "WETH" && token.chainId === chainId
  ) as IToken,
  tokenBuy: cowTokenList.findLast(
    (token) => token.symbol === "USDC" && token.chainId === chainId
  ) as IToken,
  amount: 1,
  allowedSlippage: 3,
  isSellOrder: true,
  validityBucketTime: TIME_OPTIONS.HOUR,
  isPartiallyFillable: false,
  receiver: safeAddress,
});

export function getDefaultMultiSendData(
  token: IToken,
  safeAddress: Address
): Omit<IMultiSendData, "orderId"> {
  return {
    receivers: [],
    token: token,
    amountPerReceiver: 0.1,
    safeAddress,
    type: HOOK_TYPES.MULTI_SEND,
  };
}

export const getOrderDefaultNodesAndEdges = async (
  chainId: ChainId,
  safeAddress: Address,
  currentNodes: Node<INodeData>[]
): Promise<{
  orderNodes: Node<INodeData>[];
  orderEdges: Edge<IEdgeData>[];
}> => {
  const maxCurrentNodesOrderId = Math.max(
    ...currentNodes.map((node) => node.data?.orderId ?? -1)
  );
  const orderId = maxCurrentNodesOrderId + 1;

  const swapData = getDefaultSwapData(chainId, safeAddress);
  const conditionData = await getDefaultStopLossData({
    chainId,
    tokenBuy: swapData.tokenBuy,
    tokenSell: swapData.tokenSell,
  });

  const orderNodes = [
    {
      id: `${orderId}-condition`,
      type: "stopLoss",
      data: { ...conditionData, orderId },
      ...defaultNodeProps,
    },
    {
      id: `${orderId}-swap`,
      type: "swap",
      data: { ...swapData, orderId },
      ...defaultNodeProps,
    },
  ];

  const orderEdges = [
    {
      id: `${orderId}-condition-swap`,
      source: `${orderId}-condition`,
      target: `${orderId}-swap`,
      data: { orderId },
      type: "addHook",
      ...defaultEdgeProps,
    },
    {
      id: `${orderId}-swap-submit`,
      source: `${orderId}-swap`,
      target: "submit",
      data: { orderId },
      type: "addHook",
      ...defaultEdgeProps,
    },
  ];

  return { orderNodes, orderEdges };
};
