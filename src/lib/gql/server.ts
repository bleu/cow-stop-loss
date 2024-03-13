import { ChainId } from "#/lib/publicClients";
import { SUBGRAPHS, Subgraph } from "codegen";
import { GraphQLClient } from "graphql-request";
import balancerGaugesSdk from "./balancer-gauges/index.server";
import composableCowSdk from "./composable-cow/index.server";

const clientFor = (client: Subgraph) => (chainId: ChainId) => {
  const endpoint = SUBGRAPHS[client].endpointFor(chainId);
  return new GraphQLClient(endpoint);
};

export const gauges = {
  client: clientFor(Subgraph.BalancerGauges),
  gql: (chainId: ChainId) => balancerGaugesSdk[chainId](gauges.client(chainId)),
};

export const orders = {
  client: clientFor(Subgraph.ComposableCow),
  gql: (chainId: ChainId) => composableCowSdk[chainId](orders.client(chainId)),
};
