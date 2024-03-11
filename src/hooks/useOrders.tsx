import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import { Address } from "viem";

import { getCowOrders } from "#/lib/cowApi/fetchCowOrder";
import { UserStopLossOrdersQuery } from "#/lib/gql/generated";
import { composableCowSubgraph } from "#/lib/gql/sdk";
import { ChainId } from "#/lib/publicClients";
import { ArrElement, GetDeepProp } from "#/lib/utils";

export type StopLossOrderType = ArrElement<
  GetDeepProp<UserStopLossOrdersQuery, "items">
>;

gql(
  `query UserStopLossOrders($user: String!) {
    orders(where: {stopLossParametersId_not: null, user_in: [$user]}) {
      items {
        blockNumber
        blockTimestamp
        chainId
        decodedSuccess
        handler
        id
        user
        staticInput
        stopLossParameters {
          appData
          buyTokenPriceOracle
          id
          isPartiallyFillable
          isSellOrder
          maxTimeSinceLastOracleUpdate
          orderId
          sellTokenPriceOracle
          strike
          to
          tokenAmountIn
          tokenAmountOut
          tokenIn {
            address
            decimals
            name
            symbol
          }
          tokenOut {
            address
            decimals
            name
            symbol
          }
          validityBucketSeconds
        }
      }
    }
  } 
  `,
);


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

  //TODO: use this on COW-100
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const orderFromCowApi = await getCowOrders(address, chainId);

  return rawOrdersData.orders.items;
}
