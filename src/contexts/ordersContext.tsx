"use client";

import { ArrElement, GetDeepProp } from "@bleu-fi/ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { createContext, PropsWithChildren, useContext, useEffect, useState} from "react";
import { Address } from "viem";

import { composableCowAbi } from "#/lib/abis/composableCow";
import { COMPOSABLE_COW_ADDRESS } from "#/lib/contracts";
import { getCowOrders } from "#/lib/cowApi/fetchCowOrder";
import { composableCowApi } from "#/lib/gql/client";
import { UserStopLossOrdersQuery } from "#/lib/gql/composable-cow/__generated__/1";
import { ChainId, publicClientsFromIds } from "#/lib/publicClients";



type StopLossOrderTypeRaw = ArrElement<
  GetDeepProp<UserStopLossOrdersQuery, "items">
>;

export interface StopLossOrderType extends StopLossOrderTypeRaw {
  status?: string;
  executedBuyAmount?: string;
  executedSellAmount?: string;
  executedSurplusFee?: string;
}

interface singleOrderReturn {
  error?: Error;
  result?: Address;
  status: "success" | "failure";
}

type singleOrder = Address| boolean | undefined

export interface CowOrder {
  appData: string;
  availableBalance: string;
  buyAmount: string;
  buyToken: string;
  buyTokenBalance: string;
  class: string;
  creationDate: string;
  executedBuyAmount: string;
  executedFeeAmount: string;
  executedSellAmount: string;
  executedSellAmountBeforeFees: string;
  executedSurplusFee: string;
  feeAmount: string;
  fullAppData: string;
  fullFeeAmount: string;
  interactions: {
    pre: Array<string>;
    post: Array<string>;
  };
  invalidated: boolean;
  isLiquidityOrder: boolean;
  kind: string;
  owner: string;
  partiallyFillable: boolean;
  receiver: string;
  sellAmount: string;
  sellToken: string;
  sellTokenBalance: string;
  settlementContract: string;
  signature: string;
  signingScheme: string;
  solverFee: string;
  status: string;
  uid: string;
  validTo: number;
}

type OrderContextType = {
  orders: StopLossOrderType[];
  loaded: boolean;
  error: boolean;
  reload: ({showSpinner}: {showSpinner: boolean}) => void;
};

export const OrderContext = createContext({} as OrderContextType);

export function OrderProvider({ children }: PropsWithChildren) {
const { safe } = useSafeAppsSDK();
const [loaded, setLoaded] = useState(false);
const [retryCount, setRetryCount] = useState(0);
const [error, setError] = useState(false);
const [orders, setOrders] = useState<StopLossOrderType[]>([]);

const reload = ({ showSpinner }: { showSpinner: boolean }) => {
  setRetryCount(retryCount + 1);
  setLoaded(!showSpinner);
};


useEffect(() => {
  async function loadOrders() {
    try {
      const [processedOrders] = await Promise.all([
        getProcessedStopLossOrders({
          chainId: safe.chainId as ChainId,
          address: safe.safeAddress as Address,
        }),
      ]);
      if (processedOrders !== undefined) {
        setOrders([...processedOrders]);
      } else {
        setOrders([]);
      }
      setError(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(true);
    }
    setLoaded(true);
  }

  loadOrders();
}, [safe, retryCount]);


async function getProcessedStopLossOrders({
  chainId,
  address,
}: {
  chainId: ChainId;
  address: Address;
}) {
  const publicClient = publicClientsFromIds[chainId];
  const rawOrdersData = await composableCowApi.gql(chainId).UserStopLossOrders({
    user: `${address}-${chainId}`,
  });
  const cowOrders = await getCowOrders(address, chainId);


  if (!rawOrdersData?.orders?.items) {
    return [];
  }

  const ordersNeedingCheck = rawOrdersData.orders.items.filter((order) => {
    const cowOrderMatch = cowOrders.find(
      (cowOrder) => cowOrder.appData === order.stopLossData?.appData
    );
    return !cowOrderMatch || cowOrderMatch.status === "open";
  });

  let multicallResults: singleOrderReturn[] = [];

  if (ordersNeedingCheck.length > 0) {
    multicallResults = await publicClient.multicall({
      contracts: ordersNeedingCheck.map((order) => ({
        address: COMPOSABLE_COW_ADDRESS,
        abi: composableCowAbi,
        functionName: "singleOrders",
        args: [address, order.hash],
      })),
    });
  }

  const ordersWithStatus = rawOrdersData.orders.items.map((order) => {
    const cowOrderMatch = cowOrders.find(
      (cowOrder) => cowOrder.appData === order.stopLossData?.appData
    );
    let singleOrderResult:singleOrder = true;

    const orderIndex = ordersNeedingCheck.findIndex(
      (o) => o.hash === order.hash
    );
    if (orderIndex !== -1) {
      singleOrderResult = multicallResults[orderIndex]?.result;
    }

    const status = getOrderStatus({
      cowOrderMatch,
      singleOrder: singleOrderResult,
    });


    
    return {
      ...order,
      status: status,
      executedBuyAmount: cowOrderMatch?.executedBuyAmount,
      executedSellAmount: cowOrderMatch?.executedSellAmount,
    };
  });
  return ordersWithStatus;
}

function getOrderStatus({
  cowOrderMatch,
  singleOrder,
}: {
  cowOrderMatch: CowOrder | undefined;
  singleOrder: Address| boolean | undefined;
}) {
  if (
    (cowOrderMatch && cowOrderMatch.status !== "fulfilled" && !singleOrder) ||
    (!cowOrderMatch && !singleOrder)
  ) {
    return "cancelled";
  } else if (cowOrderMatch) {
    return cowOrderMatch.status === "open" ? "posted" : cowOrderMatch.status;
  } else {
    return "created";
  }
}

  return (
    <OrderContext.Provider
      value={{
        orders,
        loaded,
        error,
        reload,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  return context;
}
