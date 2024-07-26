import { graphql } from "gql.tada";

export const USER_ORDERS_QUERY = graphql(`
  query UserStopLossOrders($userId: String!) {
    orders(
      where: { stopLossDataId_not: null, userId_in: [$userId] }
      orderBy: "blockTimestamp"
      orderDirection: "desc"
    ) {
      items {
        blockTimestamp
        chainId
        id
        txHash
        hash
        stopLossData {
          orderUid
          buyTokenPriceOracle
          isPartiallyFillable
          isSellOrder
          maxTimeSinceLastOracleUpdate
          orderId
          sellTokenPriceOracle
          strike
          to
          tokenBuyAmount
          executedTokenBuyAmount
          tokenSellAmount
          executedTokenSellAmount
          validTo
          filledPctBps
          tokenSell {
            address
            decimals
            name
            symbol
          }
          tokenBuy {
            address
            decimals
            name
            symbol
          }
        }
      }
    }
  }
`);

export const ORDER_QUERY = graphql(`
  query OrderById($orderId: String!) {
    order(id: $orderId) {
      blockTimestamp
      chainId
      id
      txHash
      hash
      stopLossData {
        orderUid
        buyTokenPriceOracle
        isPartiallyFillable
        isSellOrder
        maxTimeSinceLastOracleUpdate
        orderId
        sellTokenPriceOracle
        strike
        to
        tokenBuyAmount
        executedTokenBuyAmount
        tokenSellAmount
        executedTokenSellAmount
        validTo
        filledPctBps
        tokenSell {
          address
          decimals
          symbol
        }
        tokenBuy {
          address
          decimals
          symbol
        }
      }
    }
  }
`);
