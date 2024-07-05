import { gql } from "graphql-tag";

gql(
  `query UserStopLossOrders($user: String!) {
    orders(where: {stopLossDataId_not: null, userId_in:[$user]} orderBy: "blockTimestamp" orderDirection: "desc") {
      items {
        blockNumber
        blockTimestamp
        chainId
        decodedSuccess
        id
        txHash
        hash
        staticInput
        stopLossData {
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

gql(
  `query OrderById($orderId: String!) {
    order(id: $orderId) {
      blockNumber
      blockTimestamp
      chainId
      decodedSuccess
      id
      txHash
      hash
      staticInput
      stopLossData {
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
  `,
);
