# First-use EOA stop loss

An externally owned account (EOA) can place its first stop-loss order without prior CoW Protocol trades, approvals, or a deployed CowShed (Shed). The account needs the sell tokens and native currency for approval and setup gas. This page describes the EOA flow and the Ethereum mainnet fork check.

## Placement

For a new account with no approvals or Shed, placement has one offchain request and two user transactions:

1. Publish AppData offchain with `PUT /api/v1/app_data/{appDataHash}` to the chain's CoW API. The document includes a pre-hook that calls `Poller.pollFunds(scheduleId)`. Its hash is part of the order. This request does not use gas.
2. Send transaction 1 to `sellToken.approve(Poller, amount)` from the EOA. Limited approval is the default. For a first order, this is the sell amount; with other open orders, it also covers their outstanding funding commitments. Unlimited approval is optional. This approval lets the Poller pull tokens from the EOA; it does not approve the settlement relayer directly.
3. Send transaction 2 to the Poller-pinned factory's `executeOwnHooks`. The factory deploys the account's fresh Shed automatically. The Shed then calls `sellToken.approve(GPv2VaultRelayer, maxUint256)`, `ComposableCoW.create(params, true)`, and `Poller.registerFromShed(schedule)`. The `true` argument enables dispatch of the conditional order. Deployment and these internal calls are atomic: a required call failure reverts the setup transaction.

The internal Shed-to-relayer approval is always a maximum approval when needed. It is separate from the user's limited or unlimited EOA-to-Poller choice. It does not require a third user transaction.

The user signs the approval and setup transactions. The flow does not request an EIP-712 user order signature. The Shed is the CoW order owner, and contract signature validation authorizes the resulting order through ComposableCoW.

If the account already has a Shed, the factory reuses it and skips deployment. Adequate EOA-to-Poller allowance skips transaction 1. Adequate Shed-to-relayer allowance skips the internal approval. Setup still creates and registers the new conditional order.

## Funding and execution

Placement leaves the sell tokens in the EOA. It does not deposit them in the Shed or reserve the wallet balance. The EOA must retain enough tokens and Poller allowance until funding occurs.

When the order is triggered, the solver must include the published AppData pre-hook in settlement through the actual HooksTrampoline. That hook calls `Poller.pollFunds(scheduleId)`, which checks the order and pulls the sell amount from the EOA into the Shed once. The Poller records funding for that order, so a repeated call does not pull the amount again. An inactive order must not fund the Shed.

Settlement then uses the GPv2VaultRelayer to pull the sell tokens from the Shed and pays the buy tokens to the configured receiver. A direct `pollFunds` call alone does not prove that a solver included the hook or that settlement completed.

Successful setup confirms onchain authorization and registration. It does not guarantee that a live watchtower observes the order, that a solver submits it, or that market liquidity is available.

## Run the fork check

Install Node.js 24.22.1 or later in the Node 24 LTS line, pnpm 9, and [Foundry's Anvil](https://getfoundry.sh/anvil/overview). Make `anvil` available on `PATH`. Install project dependencies first; the private `@bleu/ui` package needs a package-read `NPM_TOKEN` in the install environment.

```bash
corepack pnpm@9 install
corepack pnpm test:fork
```

With pnpm 9 already available, `pnpm test:fork` is equivalent. The command runs `scripts/test-stop-loss-fork.mjs`. It starts a temporary local Anvil process on an automatically selected loopback port, runs the fork tests, and stops Anvil when the command exits. No user wallet or user private key is required. The tests use a test-only key and local funding.

The fork uses Ethereum chain ID 1, with this fixed source block:

- Block: `26277440`
- Hash: `0x07d048512650841ce2d67f7ed9b85d2fd7c38fbe731118b46730abcfe63e39a8`

The runner checks the chain ID and block hash before it runs tests. The default upstream is `https://eth.drpc.org`, which served the passing run. The pinned block requires archive-state access. Public RPC limits can change; PublicNode returned `403: Archive requests require a personal token` on a later rerun. If the default cannot serve the pinned state, provide an archive-capable Ethereum RPC:

```bash
FORK_RPC_URL=https://your-ethereum-rpc.example corepack pnpm test:fork
```

`FORK_RPC_URL` changes only Anvil's upstream data source. Test transactions go to the new local Anvil instance, not to that upstream. The local fork retains chain ID 1; it is not a separate testnet.

## Evidence and limits

First-use placement has passed on the real mainnet fork at the pinned block. The approval used 46,040 gas and setup used 737,605 gas. Setup deployed the fresh Shed, set its relayer allowance, authorized the conditional order, and registered the Poller schedule while leaving the sell tokens in the EOA. These gas amounts are observations for this fixture, not estimates for all tokens or accounts.

The four fork tests passed: fresh-Shed placement, inactive-order refusal, valid Shed contract signatures with one-time funding, and real GPv2 settlement through the AppData funding pre-hook. The settlement used 330,311 gas and paid 25.279921 USDC for 0.01 WETH in this fixture. The test checks the funding and trade events, token balances, and settlement fill state.

The fork fixture replaces AppData publication and the funding-parent API response. It does not prove a live AppData PUT or live indexing. Other contract calls and transactions use deployed contracts on Anvil; unexpected external API requests are blocked.

Controlled inactive and triggered cases use separate strike prices below and above the real oracle price at the fixed fork block. They do not change oracle storage or prove a live price crossing. Settlement uses USDC transferred from an impersonated holder on Anvil and an existing authorized solver impersonated on Anvil. Authorization checks and contract signature checks are not bypassed. The test supplies clearing prices and liquidity; it does not prove live liquidity, price discovery, or production solver participation.

## Sources

- [Placement and funding code](../src/lib/pollerStopLoss.ts)
- [AppData PUT](../src/lib/cowApi/uploadAppData.ts)
- [Fork runner](../scripts/test-stop-loss-fork.mjs) and [fork tests](../tests/fork/pollerStopLoss.fork.test.ts)
- Ethereum contracts: [Shed factory](https://eth.blockscout.com/address/0x221c28Ec177CF7da6f837DfD0052Ba8F265Fb4CA?tab=contract), [Shed implementation](https://eth.blockscout.com/address/0xF0D400089d5b9fACA64E3422AD6614546587cfFB?tab=contract), and [Settlement](https://eth.blockscout.com/address/0x9008D19f58AAbD9eD0D60971565AA8510560ab41?tab=contract).
