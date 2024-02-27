import { gql } from "graphql-tag";

gql(`
query AllOrders {
    orders {
      items {
        blockNumber
        blockTimestamp
        chainId
        decodedSuccess
        id
        handler 
        user
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
          tokenInId
          tokenOutId
          validityBucketSeconds
        }
      }
    }
  }
`);
