import { ChainId } from "#/lib/publicClients";
import { SUBGRAPHS, Subgraph } from "codegen";
import { GraphQLClient } from "graphql-request";
import balancerGaugesSdk from "./balancer-gauges";
import composableCowSdk from "./composable-cow";

const clientFor = (client: Subgraph) => (chainId: ChainId) => {
  const endpoint = SUBGRAPHS[client].endpointFor(chainId);
  return new GraphQLClient(endpoint);
};

export const balancerGaugesApi = {
  client: clientFor(Subgraph.BalancerGauges),
  gql: (chainId: ChainId) =>
    balancerGaugesSdk[chainId](balancerGaugesApi.client(chainId)),
};

export const composableCowApi = {
  client: clientFor(Subgraph.ComposableCow),
  gql: (chainId: ChainId) =>
    composableCowSdk[chainId](composableCowApi.client(chainId)),
};
