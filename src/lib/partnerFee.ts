import type { Address } from "viem";

export const PARTNER_FEE = {
  bps: 25,
  recipient: "0x5D40015034DA6cD75411c54dd826135f725c2498",
} as const satisfies { bps: number; recipient: Address };
