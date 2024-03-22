import { gql } from "graphql-tag";

export const gaugeSharesByUser = gql`
  query GaugeSharesByUser($user: String!) {
    gaugeShares(where: { user: $user, balance_gt: 0 }) {
      balance
      gauge {
        id
        poolAddress
        poolId
        totalSupply
        isPreferentialGauge
        isKilled
      }
    }
  }
`;
