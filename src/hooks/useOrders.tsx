import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import { Address } from "viem";

import { UserStopLossOrdersQuery } from "#/lib/composableCowGql/generated";
import { composableCowSubgraph } from "#/lib/composableCowGql/sdk";
import { getCowOrders } from "#/lib/cowApi/fetchCowOrder";
import { ChainId } from "#/lib/publicClients";
import { ArrElement, GetDeepProp } from "#/utils";

type StopLossOrderTypeRaw = ArrElement<
  GetDeepProp<UserStopLossOrdersQuery, "items">
>;

export interface StopLossOrderType extends StopLossOrderTypeRaw {
  status: string;
}

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

export function useUserOrders() {
  const { safe } = useSafeAppsSDK();
  const [loaded, setLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(false);
  const [orders, setOrders] = useState<StopLossOrderType[]>([]);

  const reload = ({ showSpinner }: { showSpinner: boolean }) => {
    setLoaded(!showSpinner);
    setRetryCount(retryCount + 1);
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

  return { orders, loaded, error, reload };
}

async function getProcessedStopLossOrders({
  chainId,
  address,
}: {
  chainId: ChainId;
  address: Address;
}): Promise<StopLossOrderType[]> {
  const rawOrdersData = await composableCowSubgraph.UserStopLossOrders({
    user: `${address}-${chainId}`,
  });

  const orderFromCowApi = await getCowOrders(address, chainId);

  const orderData = rawOrdersData.orders.items.map((order) => {
    const match = orderFromCowApi.find(
      (cowOrder: CowOrder) =>
        cowOrder.appData === order.stopLossParameters?.appData
    );
    if (match && match.status !== "expired") {
      return {
        ...order,
        status: match.status,
      };
    } else {
      return {
        ...order,
        status: "created",
      };
    }
  });

  return orderData;
}
