import { parseAbi } from "viem";

export const composableCowPollerAbi = parseAbi([
  "function COW_SHED_FACTORY() view returns (address)",
  "function COMPOSABLE_COW() view returns (address)",
  "function pollFunds(bytes32 id) returns (bool)",
  "function schedules(bytes32 id) view returns (address handler, uint96 authEpoch, address funder, address owner, bytes32 salt, bytes staticInput)",
  "function funded(bytes32 id, bytes32 orderDigest) view returns (bool)",
  "function registerFromShed((address handler,uint96 authEpoch,address funder,address owner,bytes32 salt,bytes staticInput) schedule) returns (bytes32 id)",
]);
