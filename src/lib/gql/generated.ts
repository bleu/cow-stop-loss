import { GraphQLClient } from 'graphql-request';
import { GraphQLClientRequestHeaders } from 'graphql-request/build/cjs/types';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: any; output: any; }
};

export type Order = {
  __typename?: 'Order';
  OrderParametersId?: Maybe<Scalars['String']['output']>;
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  chainId: Scalars['Int']['output'];
  decodedSuccess: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  orderContract: Scalars['String']['output'];
  orderParameters?: Maybe<OrderParameters>;
  user: Scalars['String']['output'];
};

export type OrderFilter = {
  AND?: InputMaybe<Array<InputMaybe<OrderFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<OrderFilter>>>;
  OrderParametersId?: InputMaybe<Scalars['String']['input']>;
  OrderParametersId_contains?: InputMaybe<Scalars['String']['input']>;
  OrderParametersId_ends_with?: InputMaybe<Scalars['String']['input']>;
  OrderParametersId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  OrderParametersId_not?: InputMaybe<Scalars['String']['input']>;
  OrderParametersId_not_contains?: InputMaybe<Scalars['String']['input']>;
  OrderParametersId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  OrderParametersId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  OrderParametersId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  OrderParametersId_starts_with?: InputMaybe<Scalars['String']['input']>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  chainId?: InputMaybe<Scalars['Int']['input']>;
  chainId_gt?: InputMaybe<Scalars['Int']['input']>;
  chainId_gte?: InputMaybe<Scalars['Int']['input']>;
  chainId_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  chainId_lt?: InputMaybe<Scalars['Int']['input']>;
  chainId_lte?: InputMaybe<Scalars['Int']['input']>;
  chainId_not?: InputMaybe<Scalars['Int']['input']>;
  chainId_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  decodedSuccess?: InputMaybe<Scalars['Boolean']['input']>;
  decodedSuccess_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  decodedSuccess_not?: InputMaybe<Scalars['Boolean']['input']>;
  decodedSuccess_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  orderContract?: InputMaybe<Scalars['String']['input']>;
  orderContract_gt?: InputMaybe<Scalars['String']['input']>;
  orderContract_gte?: InputMaybe<Scalars['String']['input']>;
  orderContract_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  orderContract_lt?: InputMaybe<Scalars['String']['input']>;
  orderContract_lte?: InputMaybe<Scalars['String']['input']>;
  orderContract_not?: InputMaybe<Scalars['String']['input']>;
  orderContract_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type OrderPage = {
  __typename?: 'OrderPage';
  items: Array<Order>;
  pageInfo: PageInfo;
};

export type OrderParameters = {
  __typename?: 'OrderParameters';
  appData: Scalars['String']['output'];
  buyTokenPriceOracle: Scalars['String']['output'];
  id: Scalars['String']['output'];
  isPartiallyFillable: Scalars['Boolean']['output'];
  isSellOrder: Scalars['Boolean']['output'];
  maxTimeSinceLastOracleUpdate: Scalars['BigInt']['output'];
  orderId: Scalars['String']['output'];
  sellTokenPriceOracle: Scalars['String']['output'];
  strike: Scalars['BigInt']['output'];
  to: Scalars['String']['output'];
  tokenAmountIn: Scalars['BigInt']['output'];
  tokenAmountOut: Scalars['BigInt']['output'];
  tokenIn: Token;
  tokenInId: Scalars['String']['output'];
  tokenOut: Token;
  tokenOutId: Scalars['String']['output'];
  validityBucketSeconds: Scalars['BigInt']['output'];
};

export type OrderParametersFilter = {
  AND?: InputMaybe<Array<InputMaybe<OrderParametersFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<OrderParametersFilter>>>;
  appData?: InputMaybe<Scalars['String']['input']>;
  appData_gt?: InputMaybe<Scalars['String']['input']>;
  appData_gte?: InputMaybe<Scalars['String']['input']>;
  appData_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  appData_lt?: InputMaybe<Scalars['String']['input']>;
  appData_lte?: InputMaybe<Scalars['String']['input']>;
  appData_not?: InputMaybe<Scalars['String']['input']>;
  appData_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  buyTokenPriceOracle?: InputMaybe<Scalars['String']['input']>;
  buyTokenPriceOracle_gt?: InputMaybe<Scalars['String']['input']>;
  buyTokenPriceOracle_gte?: InputMaybe<Scalars['String']['input']>;
  buyTokenPriceOracle_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  buyTokenPriceOracle_lt?: InputMaybe<Scalars['String']['input']>;
  buyTokenPriceOracle_lte?: InputMaybe<Scalars['String']['input']>;
  buyTokenPriceOracle_not?: InputMaybe<Scalars['String']['input']>;
  buyTokenPriceOracle_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  isPartiallyFillable?: InputMaybe<Scalars['Boolean']['input']>;
  isPartiallyFillable_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isPartiallyFillable_not?: InputMaybe<Scalars['Boolean']['input']>;
  isPartiallyFillable_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isSellOrder?: InputMaybe<Scalars['Boolean']['input']>;
  isSellOrder_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isSellOrder_not?: InputMaybe<Scalars['Boolean']['input']>;
  isSellOrder_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  maxTimeSinceLastOracleUpdate?: InputMaybe<Scalars['BigInt']['input']>;
  maxTimeSinceLastOracleUpdate_gt?: InputMaybe<Scalars['BigInt']['input']>;
  maxTimeSinceLastOracleUpdate_gte?: InputMaybe<Scalars['BigInt']['input']>;
  maxTimeSinceLastOracleUpdate_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  maxTimeSinceLastOracleUpdate_lt?: InputMaybe<Scalars['BigInt']['input']>;
  maxTimeSinceLastOracleUpdate_lte?: InputMaybe<Scalars['BigInt']['input']>;
  maxTimeSinceLastOracleUpdate_not?: InputMaybe<Scalars['BigInt']['input']>;
  maxTimeSinceLastOracleUpdate_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  orderId?: InputMaybe<Scalars['String']['input']>;
  orderId_contains?: InputMaybe<Scalars['String']['input']>;
  orderId_ends_with?: InputMaybe<Scalars['String']['input']>;
  orderId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  orderId_not?: InputMaybe<Scalars['String']['input']>;
  orderId_not_contains?: InputMaybe<Scalars['String']['input']>;
  orderId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  orderId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  orderId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  orderId_starts_with?: InputMaybe<Scalars['String']['input']>;
  sellTokenPriceOracle?: InputMaybe<Scalars['String']['input']>;
  sellTokenPriceOracle_gt?: InputMaybe<Scalars['String']['input']>;
  sellTokenPriceOracle_gte?: InputMaybe<Scalars['String']['input']>;
  sellTokenPriceOracle_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sellTokenPriceOracle_lt?: InputMaybe<Scalars['String']['input']>;
  sellTokenPriceOracle_lte?: InputMaybe<Scalars['String']['input']>;
  sellTokenPriceOracle_not?: InputMaybe<Scalars['String']['input']>;
  sellTokenPriceOracle_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  strike?: InputMaybe<Scalars['BigInt']['input']>;
  strike_gt?: InputMaybe<Scalars['BigInt']['input']>;
  strike_gte?: InputMaybe<Scalars['BigInt']['input']>;
  strike_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  strike_lt?: InputMaybe<Scalars['BigInt']['input']>;
  strike_lte?: InputMaybe<Scalars['BigInt']['input']>;
  strike_not?: InputMaybe<Scalars['BigInt']['input']>;
  strike_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  to?: InputMaybe<Scalars['String']['input']>;
  to_gt?: InputMaybe<Scalars['String']['input']>;
  to_gte?: InputMaybe<Scalars['String']['input']>;
  to_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  to_lt?: InputMaybe<Scalars['String']['input']>;
  to_lte?: InputMaybe<Scalars['String']['input']>;
  to_not?: InputMaybe<Scalars['String']['input']>;
  to_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tokenAmountIn?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountIn_gt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountIn_gte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountIn_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  tokenAmountIn_lt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountIn_lte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountIn_not?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountIn_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  tokenAmountOut?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountOut_gt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountOut_gte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountOut_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  tokenAmountOut_lt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountOut_lte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountOut_not?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmountOut_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  tokenInId?: InputMaybe<Scalars['String']['input']>;
  tokenInId_contains?: InputMaybe<Scalars['String']['input']>;
  tokenInId_ends_with?: InputMaybe<Scalars['String']['input']>;
  tokenInId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tokenInId_not?: InputMaybe<Scalars['String']['input']>;
  tokenInId_not_contains?: InputMaybe<Scalars['String']['input']>;
  tokenInId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  tokenInId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tokenInId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  tokenInId_starts_with?: InputMaybe<Scalars['String']['input']>;
  tokenOutId?: InputMaybe<Scalars['String']['input']>;
  tokenOutId_contains?: InputMaybe<Scalars['String']['input']>;
  tokenOutId_ends_with?: InputMaybe<Scalars['String']['input']>;
  tokenOutId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tokenOutId_not?: InputMaybe<Scalars['String']['input']>;
  tokenOutId_not_contains?: InputMaybe<Scalars['String']['input']>;
  tokenOutId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  tokenOutId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tokenOutId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  tokenOutId_starts_with?: InputMaybe<Scalars['String']['input']>;
  validityBucketSeconds?: InputMaybe<Scalars['BigInt']['input']>;
  validityBucketSeconds_gt?: InputMaybe<Scalars['BigInt']['input']>;
  validityBucketSeconds_gte?: InputMaybe<Scalars['BigInt']['input']>;
  validityBucketSeconds_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  validityBucketSeconds_lt?: InputMaybe<Scalars['BigInt']['input']>;
  validityBucketSeconds_lte?: InputMaybe<Scalars['BigInt']['input']>;
  validityBucketSeconds_not?: InputMaybe<Scalars['BigInt']['input']>;
  validityBucketSeconds_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
};

export type OrderParametersPage = {
  __typename?: 'OrderParametersPage';
  items: Array<OrderParameters>;
  pageInfo: PageInfo;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  order?: Maybe<Order>;
  orderParameters?: Maybe<OrderParameters>;
  orderParameterss: OrderParametersPage;
  orders: OrderPage;
  token?: Maybe<Token>;
  tokens: TokenPage;
  user?: Maybe<User>;
  users: UserPage;
};


export type QueryOrderArgs = {
  id: Scalars['String']['input'];
  timestamp?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryOrderParametersArgs = {
  id: Scalars['String']['input'];
  timestamp?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryOrderParameterssArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<OrderParametersFilter>;
};


export type QueryOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<OrderFilter>;
};


export type QueryTokenArgs = {
  id: Scalars['String']['input'];
  timestamp?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTokensArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<TokenFilter>;
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
  timestamp?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<UserFilter>;
};

export type Token = {
  __typename?: 'Token';
  address: Scalars['String']['output'];
  chainId: Scalars['Int']['output'];
  decimals: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
};

export type TokenFilter = {
  AND?: InputMaybe<Array<InputMaybe<TokenFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<TokenFilter>>>;
  address?: InputMaybe<Scalars['String']['input']>;
  address_gt?: InputMaybe<Scalars['String']['input']>;
  address_gte?: InputMaybe<Scalars['String']['input']>;
  address_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  address_lt?: InputMaybe<Scalars['String']['input']>;
  address_lte?: InputMaybe<Scalars['String']['input']>;
  address_not?: InputMaybe<Scalars['String']['input']>;
  address_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  chainId?: InputMaybe<Scalars['Int']['input']>;
  chainId_gt?: InputMaybe<Scalars['Int']['input']>;
  chainId_gte?: InputMaybe<Scalars['Int']['input']>;
  chainId_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  chainId_lt?: InputMaybe<Scalars['Int']['input']>;
  chainId_lte?: InputMaybe<Scalars['Int']['input']>;
  chainId_not?: InputMaybe<Scalars['Int']['input']>;
  chainId_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  decimals?: InputMaybe<Scalars['Int']['input']>;
  decimals_gt?: InputMaybe<Scalars['Int']['input']>;
  decimals_gte?: InputMaybe<Scalars['Int']['input']>;
  decimals_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  decimals_lt?: InputMaybe<Scalars['Int']['input']>;
  decimals_lte?: InputMaybe<Scalars['Int']['input']>;
  decimals_not?: InputMaybe<Scalars['Int']['input']>;
  decimals_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  name_contains?: InputMaybe<Scalars['String']['input']>;
  name_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  name_not?: InputMaybe<Scalars['String']['input']>;
  name_not_contains?: InputMaybe<Scalars['String']['input']>;
  name_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  name_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  name_starts_with?: InputMaybe<Scalars['String']['input']>;
  symbol?: InputMaybe<Scalars['String']['input']>;
  symbol_contains?: InputMaybe<Scalars['String']['input']>;
  symbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  symbol_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  symbol_not?: InputMaybe<Scalars['String']['input']>;
  symbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  symbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  symbol_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  symbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  symbol_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type TokenPage = {
  __typename?: 'TokenPage';
  items: Array<Token>;
  pageInfo: PageInfo;
};

export type User = {
  __typename?: 'User';
  address: Scalars['String']['output'];
  chainId: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  orders?: Maybe<OrderPage>;
};


export type UserOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<UserFilter>;
};

export type UserFilter = {
  AND?: InputMaybe<Array<InputMaybe<UserFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<UserFilter>>>;
  address?: InputMaybe<Scalars['String']['input']>;
  address_contains?: InputMaybe<Scalars['String']['input']>;
  address_ends_with?: InputMaybe<Scalars['String']['input']>;
  address_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  address_not?: InputMaybe<Scalars['String']['input']>;
  address_not_contains?: InputMaybe<Scalars['String']['input']>;
  address_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  address_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  address_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  address_starts_with?: InputMaybe<Scalars['String']['input']>;
  chainId?: InputMaybe<Scalars['Int']['input']>;
  chainId_gt?: InputMaybe<Scalars['Int']['input']>;
  chainId_gte?: InputMaybe<Scalars['Int']['input']>;
  chainId_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  chainId_lt?: InputMaybe<Scalars['Int']['input']>;
  chainId_lte?: InputMaybe<Scalars['Int']['input']>;
  chainId_not?: InputMaybe<Scalars['Int']['input']>;
  chainId_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type UserPage = {
  __typename?: 'UserPage';
  items: Array<User>;
  pageInfo: PageInfo;
};

export type MyQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type MyQueryQuery = { __typename?: 'Query', orders: { __typename?: 'OrderPage', items: Array<{ __typename?: 'Order', blockNumber: any, blockTimestamp: any, chainId: number, decodedSuccess: boolean, id: string, orderContract: string, user: string, orderParameters?: { __typename?: 'OrderParameters', appData: string, buyTokenPriceOracle: string, id: string, isPartiallyFillable: boolean, isSellOrder: boolean, maxTimeSinceLastOracleUpdate: any, orderId: string, sellTokenPriceOracle: string, strike: any, to: string, tokenAmountIn: any, tokenAmountOut: any, tokenInId: string, tokenOutId: string, validityBucketSeconds: any } | null }> } };


export const MyQueryDocument = gql`
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
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    MyQuery(variables?: MyQueryQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<MyQueryQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyQueryQuery>(MyQueryDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'MyQuery', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;