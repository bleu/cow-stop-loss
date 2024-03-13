import { gql } from "graphql-tag";

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
  `
);
