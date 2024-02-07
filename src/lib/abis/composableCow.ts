export const composableCowAbi = [
  {
    inputs: [{ internalType: "address", name: "_settlement", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "InterfaceNotSupported", type: "error" },
  { inputs: [], name: "InvalidFallbackHandler", type: "error" },
  { inputs: [], name: "InvalidHandler", type: "error" },
  { inputs: [], name: "ProofNotAuthed", type: "error" },
  { inputs: [], name: "SingleOrderNotAuthed", type: "error" },
  { inputs: [], name: "SwapGuardRestricted", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        components: [
          {
            internalType: "contract IConditionalOrder",
            name: "handler",
            type: "address",
          },
          { internalType: "bytes32", name: "salt", type: "bytes32" },
          { internalType: "bytes", name: "staticInput", type: "bytes" },
        ],
        indexed: false,
        internalType: "struct IConditionalOrder.ConditionalOrderParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "ConditionalOrderCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "root",
        type: "bytes32",
      },
      {
        components: [
          { internalType: "uint256", name: "location", type: "uint256" },
          { internalType: "bytes", name: "data", type: "bytes" },
        ],
        indexed: false,
        internalType: "struct ComposableCoW.Proof",
        name: "proof",
        type: "tuple",
      },
    ],
    name: "MerkleRootSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "contract ISwapGuard",
        name: "swapGuard",
        type: "address",
      },
    ],
    name: "SwapGuardSet",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "bytes32", name: "", type: "bytes32" },
    ],
    name: "cabinet",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "contract IConditionalOrder",
            name: "handler",
            type: "address",
          },
          { internalType: "bytes32", name: "salt", type: "bytes32" },
          { internalType: "bytes", name: "staticInput", type: "bytes" },
        ],
        internalType: "struct IConditionalOrder.ConditionalOrderParams",
        name: "params",
        type: "tuple",
      },
      { internalType: "bool", name: "dispatch", type: "bool" },
    ],
    name: "create",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "contract IConditionalOrder",
            name: "handler",
            type: "address",
          },
          { internalType: "bytes32", name: "salt", type: "bytes32" },
          { internalType: "bytes", name: "staticInput", type: "bytes" },
        ],
        internalType: "struct IConditionalOrder.ConditionalOrderParams",
        name: "params",
        type: "tuple",
      },
      {
        internalType: "contract IValueFactory",
        name: "factory",
        type: "address",
      },
      { internalType: "bytes", name: "data", type: "bytes" },
      { internalType: "bool", name: "dispatch", type: "bool" },
    ],
    name: "createWithContext",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "domainSeparator",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      {
        components: [
          {
            internalType: "contract IConditionalOrder",
            name: "handler",
            type: "address",
          },
          { internalType: "bytes32", name: "salt", type: "bytes32" },
          { internalType: "bytes", name: "staticInput", type: "bytes" },
        ],
        internalType: "struct IConditionalOrder.ConditionalOrderParams",
        name: "params",
        type: "tuple",
      },
      { internalType: "bytes", name: "offchainInput", type: "bytes" },
      { internalType: "bytes32[]", name: "proof", type: "bytes32[]" },
    ],
    name: "getTradeableOrderWithSignature",
    outputs: [
      {
        components: [
          {
            internalType: "contract IERC20",
            name: "sellToken",
            type: "address",
          },
          {
            internalType: "contract IERC20",
            name: "buyToken",
            type: "address",
          },
          { internalType: "address", name: "receiver", type: "address" },
          { internalType: "uint256", name: "sellAmount", type: "uint256" },
          { internalType: "uint256", name: "buyAmount", type: "uint256" },
          { internalType: "uint32", name: "validTo", type: "uint32" },
          { internalType: "bytes32", name: "appData", type: "bytes32" },
          { internalType: "uint256", name: "feeAmount", type: "uint256" },
          { internalType: "bytes32", name: "kind", type: "bytes32" },
          { internalType: "bool", name: "partiallyFillable", type: "bool" },
          {
            internalType: "bytes32",
            name: "sellTokenBalance",
            type: "bytes32",
          },
          { internalType: "bytes32", name: "buyTokenBalance", type: "bytes32" },
        ],
        internalType: "struct GPv2Order.Data",
        name: "order",
        type: "tuple",
      },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "contract IConditionalOrder",
            name: "handler",
            type: "address",
          },
          { internalType: "bytes32", name: "salt", type: "bytes32" },
          { internalType: "bytes", name: "staticInput", type: "bytes" },
        ],
        internalType: "struct IConditionalOrder.ConditionalOrderParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "hash",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract Safe", name: "safe", type: "address" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "bytes32", name: "_hash", type: "bytes32" },
      { internalType: "bytes32", name: "_domainSeparator", type: "bytes32" },
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "bytes", name: "encodeData", type: "bytes" },
      { internalType: "bytes", name: "payload", type: "bytes" },
    ],
    name: "isValidSafeSignature",
    outputs: [{ internalType: "bytes4", name: "magic", type: "bytes4" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "singleOrderHash", type: "bytes32" },
    ],
    name: "remove",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "roots",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "root", type: "bytes32" },
      {
        components: [
          { internalType: "uint256", name: "location", type: "uint256" },
          { internalType: "bytes", name: "data", type: "bytes" },
        ],
        internalType: "struct ComposableCoW.Proof",
        name: "proof",
        type: "tuple",
      },
    ],
    name: "setRoot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "root", type: "bytes32" },
      {
        components: [
          { internalType: "uint256", name: "location", type: "uint256" },
          { internalType: "bytes", name: "data", type: "bytes" },
        ],
        internalType: "struct ComposableCoW.Proof",
        name: "proof",
        type: "tuple",
      },
      {
        internalType: "contract IValueFactory",
        name: "factory",
        type: "address",
      },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "setRootWithContext",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISwapGuard",
        name: "swapGuard",
        type: "address",
      },
    ],
    name: "setSwapGuard",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "bytes32", name: "", type: "bytes32" },
    ],
    name: "singleOrders",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "swapGuards",
    outputs: [
      { internalType: "contract ISwapGuard", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
