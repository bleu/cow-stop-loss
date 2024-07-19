export enum TOOLTIP_DESCRIPTIONS {
  TRIGGER_PRICE = "If the oracle price drop below this threshold the order will be executed by the limit price.",
  LIMIT_PRICE = "The limit price is the price at which this order shall be (partially) filled.",
  CURRENT_ORACLE_PRICE = "The price that will be monitored to trigger the order posting.",
  CURRENT_MARKET_PRICE = "The current price of the token pair in the market.",
  ORDER_CREATION = "The transaction that created this stop loss order.",
  ORDER_HASH = "The hash of the stop loss order on the Composable CoW framework. Each order for each user has a unique hash.",
  STATUS = "The status can be open, filled, partially filled or cancelled.",
  SUBMISSION_TIME = "The date and time at which the order was submitted.",
  VALIDITY_BUCKET_TIME = "After the oracle price achieves the defined trigger price, how much time the order will wait to be filled on the orderbook.",
  RECEIVER = "Receiver address that will receive the buy tokens of the order.",
  AMOUNT = "The total sell and buy amount for this order. Sell amount includes the fee.",
  EXECUTION_PRICE = "The actual price at which this order has been matched and executed, after deducting fees from the amount sold.",
  ORDER = "The amount sold/bought. Also surplus for this order. This is the positive difference between the initial limit price and the actual (average) execution price.",
  ORACLE_TOKEN_SELL = "The oracle that will provide the price of the token being sold to the smart-contract. Both oracles must have the same quote currency.",
  ORACLE_TOKEN_BUY = "The oracle that will provide the price of the token being sold to the smart-contract. Both oracles must have the same quote currency.",
  RELATED_ORDERS = "The orders created based on your initial request",
  MAX_TIME_SINCE_LAST_ORACLE_UPDATE = "The maximum time since the last oracle update. If the oracle has not been updated in this time, the order will not be executed.",
  TYPE = "The order can be fill or kill (entire order must be filled) or partial fill (part of the order can be filled respecting the limit price).",
  VALID_TO = "The date and time at which the order will expire if not filled. If empty, the order will never expire.",
}
