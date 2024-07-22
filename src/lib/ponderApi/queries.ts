import { graphql } from "gql.tada";

export const USER_ORDERS_QUERY = graphql(`
  query UserStopLossOrders($userId: String!) {
    orders(
      where: { stopLossDataId_not: null, userId_in: [$userId] }
      orderBy: "blockTimestamp"
      orderDirection: "desc"
    ) {
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
          id
          appData
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
          orderUid
          filledPctBpt
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
      blockNumber
      blockTimestamp
      chainId
      decodedSuccess
      id
      txHash
      hash
      staticInput
      stopLossData {
        id
        appData
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
        filledPctBpt
        validTo
        orderUid
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
`);
