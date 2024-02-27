import { gql } from "graphql-tag";

gql(`
query MyQuery {
    orders {
      items {
        blockNumber
        blockTimestamp
        chainId
        decodedSuccess
        id
        orderContract
        user
        orderParameters {
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
