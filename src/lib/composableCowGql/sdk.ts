import { GraphQLClient } from "graphql-request";

import { getSdk } from "#/lib/composableCowGql/generated";

export const ENDPOINT = "https://composable-cow-api.up.railway.app/";

const client = new GraphQLClient(ENDPOINT);

export const composableCowSubgraph = getSdk(client);
