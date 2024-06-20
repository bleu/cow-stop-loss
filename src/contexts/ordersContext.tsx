"use client";

import { ArrElement, GetDeepProp } from "@bleu/ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import {
  getTransactionDetails,
  getTransactionQueue,
  Transaction,
  TransactionDetails,
} from "@safe-global/safe-gateway-typescript-sdk";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { Address } from "viem";

import { composableCowAbi } from "#/lib/abis/composableCow";
import { COMPOSABLE_COW_ADDRESS } from "#/lib/contracts";
import { getCowOrders } from "#/lib/cowApi/fetchCowOrder";
import { fetchTokenInfo } from "#/lib/fetchTokenInfo";
import { composableCowApi } from "#/lib/gql/client";
import { UserStopLossOrdersQuery } from "#/lib/gql/composable-cow/__generated__/1";
import { ChainId, publicClientsFromIds } from "#/lib/publicClients";
import { decodeComposableCowCreateTxData } from "#/lib/staticInputDecoder";
import { IToken } from "#/lib/types";

type StopLossOrderTypeRaw = ArrElement<
  GetDeepProp<UserStopLossOrdersQuery, "items">
>;

export interface StopLossOrderType extends StopLossOrderTypeRaw {
  status?: string;
  executedBuyAmount?: string;
  executedSellAmount?: string;
  executedSurplusFee?: string;
  singleOrder?: Address | boolean | undefined;
}

export interface StopLossPendingOrderType {
  tokenIn: IToken;
  tokenOut: IToken;
  status: string;
}
interface singleOrderReturn {
  error?: Error;
  result?: Address;
  status: "success" | "failure";
}

type singleOrder = Address | boolean | undefined;

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
  reload: ({ showSpinner }: { showSpinner: boolean }) => void;
  getRelatedCowOrders: ({
    appData,
  }: {
    appData: string;
  }) => Promise<CowOrder[] | undefined>;
  pendingOrders: StopLossPendingOrderType[];
};

export const OrderContext = createContext({} as OrderContextType);

export function OrderProvider({ children }: PropsWithChildren) {
  const { safe } = useSafeAppsSDK();
  const {
    safe: { chainId, safeAddress },
  } = useSafeAppsSDK();
  const [loaded, setLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(false);
  const [orders, setOrders] = useState<StopLossOrderType[]>([]);
  const [pendingOrders, setPendingOrders] = useState<
    StopLossPendingOrderType[]
  >([]);

  const reload = ({ showSpinner }: { showSpinner: boolean }) => {
    setRetryCount(retryCount + 1);
    setLoaded(!showSpinner);
  };

  async function loadOrders() {
    try {
      const [processedOrders, notProcessedOrders] = await Promise.all([
        getProcessedStopLossOrders({
          chainId: safe.chainId as ChainId,
          address: safe.safeAddress as Address,
        }),
        getSigningStopLossOrders(),
      ]);
      setOrders(processedOrders);
      setPendingOrders(notProcessedOrders);
      setError(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(true);
    }
    setLoaded(true);
  }

  useEffect(() => {
    loadOrders();
  }, [safe, retryCount]);

  async function getProcessedStopLossOrders({
    chainId,
    address,
  }: {
    chainId: ChainId;
    address: Address;
  }): Promise<StopLossOrderType[]> {
    const publicClient = publicClientsFromIds[chainId];
    const rawOrdersData = await composableCowApi
      .gql(chainId)
      .UserStopLossOrders({
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
      const cowOrdersMatch = cowOrders.filter(
        (cowOrder) => cowOrder.appData === order.stopLossData?.appData
      );
      let singleOrderResult: singleOrder = true;

      const orderIndex = ordersNeedingCheck.findIndex(
        (o) => o.hash === order.hash
      );
      if (orderIndex !== -1) {
        singleOrderResult = multicallResults[orderIndex]?.result;
      }

      const orderWithoutStatus = {
        ...order,
        executedBuyAmount: String(
          cowOrdersMatch?.reduce(
            (acc, cowOrder) => acc + Number(cowOrder.executedBuyAmount),
            0
          )
        ),
        executedSellAmount: String(
          cowOrdersMatch?.reduce(
            (acc, cowOrder) => acc + Number(cowOrder.executedSellAmount),
            0
          )
        ),
        singleOrder: singleOrderResult,
      };

      const status = getOrderStatus({
        order: orderWithoutStatus,
        cowOrdersMatch,
      });

      return {
        ...orderWithoutStatus,
        status,
      };
    });
    return ordersWithStatus;
  }

  function getComposableCowTransactionsFromTransactionsDetails(
    transactionDetails: TransactionDetails
  ) {
    return (
      transactionDetails.txData?.dataDecoded?.parameters?.[0].valueDecoded?.filter(
        (value) =>
          value.to?.toLowerCase() == COMPOSABLE_COW_ADDRESS.toLowerCase()
      ) || []
    );
  }

  async function getSigningStopLossOrders(): Promise<
    StopLossPendingOrderType[]
  > {
    const chainIdString = String(chainId);
    const queuedTransaction = (
      await getTransactionQueue(chainIdString, safeAddress)
    ).results.filter((result) => {
      if (result.type != "TRANSACTION") return false;
      if (!(`methodName` in result.transaction.txInfo)) return false;
      return result.transaction.txInfo.methodName === "multiSend";
    }) as Transaction[];

    const queuedTransactionQueueDetails = await Promise.all(
      queuedTransaction.map((transaction) =>
        getTransactionDetails(chainIdString, transaction.transaction.id)
      )
    );

    const queuedStopLossTransactionQueueDetails =
      queuedTransactionQueueDetails.filter((transactionDetails) =>
        transactionDetails.txData?.dataDecoded?.parameters?.[0].valueDecoded?.some(
          (value) =>
            value.to?.toLowerCase() == COMPOSABLE_COW_ADDRESS.toLowerCase()
        )
      );

    const queuedStopLossTranasactionsDetails = await Promise.all(
      queuedStopLossTransactionQueueDetails.map((transactionDetails) =>
        Promise.all(
          getComposableCowTransactionsFromTransactionsDetails(
            transactionDetails
          )
        )
      )
    );

    const queuedStaticInputs = queuedStopLossTranasactionsDetails
      .flat()
      .map(({ data }) =>
        decodeComposableCowCreateTxData(data as `0x${string}`)
      );

    const [tokensIn, tokensOut] = await Promise.all(
      [0, 1].map((index) =>
        Promise.all(
          queuedStaticInputs.map((staticInput) =>
            fetchTokenInfo(
              staticInput[index] as Address,
              Number(chainId) as ChainId
            )
          )
        )
      )
    );

    return tokensIn.map((tokenIn, tokenInIndex) => {
      return {
        status: "Not executed",
        tokenIn: tokenIn,
        tokenOut: tokensOut[tokenInIndex],
      };
    });
  }

  async function getRelatedCowOrders({
    appData,
  }: {
    appData: string;
  }): Promise<CowOrder[] | undefined> {
    const cowOrders = await getCowOrders(
      safe.safeAddress as Address,
      safe.chainId as ChainId
    );
    return cowOrders.filter((order) => order.appData === appData);
  }

  function getOrderStatus({
    order,
    cowOrdersMatch,
  }: {
    order: Omit<StopLossOrderType, "status">;
    cowOrdersMatch: CowOrder[] | undefined;
  }) {
    if (
      cowOrdersMatch &&
      cowOrdersMatch.some(({ status }) => status === "fulfilled")
    ) {
      if (order?.stopLossData?.isPartiallyFillable) {
        if (order?.singleOrder) {
          return "partiallyFilled";
        }
      }
      return "fulfilled";
    }
    if (!order?.singleOrder) {
      return "cancelled";
    }
    return "created";
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        loaded,
        error,
        reload,
        getRelatedCowOrders,
        pendingOrders,
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
