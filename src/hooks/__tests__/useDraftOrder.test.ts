/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { decodeFunctionData, erc20Abi } from "viem";

import { publicClientsFromIds } from "#/lib/publicClients";
import { VALID_TO_OPTIONS } from "#/lib/schema";
import { decodeComposableCowCreateTxData } from "#/lib/staticInputDecoder";
import { getSupportedTokens } from "#/lib/supportedTokens";
import {
  createRawTxArgs,
  TRANSACTION_TYPES,
  TransactionFactory,
} from "#/lib/transactionFactory";
import type { SwapData } from "#/lib/types";

import {
  defaultAdvancedSettings,
  useAdvancedSettingsStore,
} from "../useAdvancedSettings";
import { useDraftOrder } from "../useDraftOrder";
import { useDraftOrders } from "../useDraftOrders";
import { FALLBACK_STATES } from "../useFallbackState";

const safeAddress = "0x1111111111111111111111111111111111111111";
const { sellTokens, buyToken } = getSupportedTokens(1);
const orderInput: SwapData = {
  tokenSell: sellTokens[1].token,
  tokenBuy: buyToken.token,
  amountSell: "1",
  amountBuy: "54945",
  strikePrice: "55000",
  slippagePercent: "0.1",
  isSellOrder: true,
  validTo: VALID_TO_OPTIONS.DAY,
};

describe("Supported stop loss draft creation", () => {
  beforeEach(() => {
    useAdvancedSettingsStore
      .getState()
      .setAdvancedSettings(defaultAdvancedSettings);
    useDraftOrder.getState().setCurrentDraftOrder(undefined);
    useDraftOrders.getState().setDraftOrders([]);
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ price: 1 }),
    });
    jest
      .spyOn(publicClientsFromIds[1], "readContract")
      .mockImplementation(async ({ address, functionName }) => {
        if (functionName === "decimals") return 8;
        const answer =
          address?.toLowerCase() ===
          "0xf4030086522a5beea4988f8ca5b36dbc97bee88c"
            ? BigInt("6000000000000")
            : BigInt("100000000");
        return [BigInt(1), answer, BigInt(1), BigInt(1), BigInt(1)];
      });
  });

  afterEach(() => jest.restoreAllMocks());

  it("derives draft amounts from trigger and slippage instead of a stale buy amount", async () => {
    await expect(
      useDraftOrder.getState().createDraftOrder(
        {
          ...orderInput,
          tokenSell: sellTokens[0].token,
          amountSell: "0.123456789012345678",
          amountBuy: "1",
          strikePrice: "2000",
        },
        1,
        safeAddress,
      ),
    ).resolves.toMatchObject({
      amountSell: "0.123456789012345678",
      amountBuy: "246.666665",
      slippagePercent: "0.1",
      limitPrice: "1998",
    });
  });

  it("encodes rounded draft quantities and absolute expiry without number conversion", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1700000000000);
    const draft = await useDraftOrder.getState().createDraftOrder(
      {
        ...orderInput,
        tokenSell: sellTokens[0].token,
        amountSell: "0.123456789012345678",
        amountBuy: "1",
        strikePrice: "2000",
      },
      1,
      safeAddress,
    );
    const tx = await TransactionFactory.createRawTx(
      TRANSACTION_TYPES.STOP_LOSS_ORDER,
      {
        ...draft,
        type: TRANSACTION_TYPES.STOP_LOSS_ORDER,
        chainId: 1,
        safeAddress,
      },
    );

    expect(
      decodeComposableCowCreateTxData(tx.data as `0x${string}`),
    ).toMatchObject({
      sellAmount: BigInt("123456789012345678"),
      buyAmount: BigInt("246666665"),
      strike: BigInt("2000000000000000000000"),
      receiver: safeAddress,
      isSellOrder: true,
      isPartiallyFillable: false,
      validTo: 1700086400,
      maxTimeSinceLastOracleUpdate: 3600,
    });
  });

  it("refuses to encode a draft whose amounts no longer match its slippage", async () => {
    const draft = await useDraftOrder
      .getState()
      .createDraftOrder(orderInput, 1, safeAddress);

    await expect(
      TransactionFactory.createRawTx(TRANSACTION_TYPES.STOP_LOSS_ORDER, {
        ...draft,
        amountBuy: "1",
        type: TRANSACTION_TYPES.STOP_LOSS_ORDER,
        chainId: 1,
        safeAddress,
      }),
    ).rejects.toThrow("Draft amounts do not match its trigger and slippage");
  });

  it("refuses to prepare approvals for a draft that no longer matches its slippage", async () => {
    jest
      .spyOn(publicClientsFromIds[1], "multicall")
      .mockResolvedValue([{ result: BigInt(0), status: "success" }]);
    const draft = await useDraftOrder
      .getState()
      .createDraftOrder(orderInput, 1, safeAddress);

    await expect(
      createRawTxArgs({
        data: [{ ...draft, amountBuy: "1" }],
        safeAddress,
        chainId: 1,
        domainSeparator: safeAddress,
        fallbackState: FALLBACK_STATES.HAS_DOMAIN_VERIFIER,
      }),
    ).rejects.toThrow("Draft amounts do not match its trigger and slippage");
  });

  it("encodes the rounded maximum sell in an exact buy order", async () => {
    const draft = await useDraftOrder.getState().createDraftOrder(
      {
        ...orderInput,
        tokenSell: sellTokens[0].token,
        isSellOrder: false,
        amountBuy: "1",
        amountSell: "999",
        strikePrice: "3",
        slippagePercent: "0",
      },
      1,
      safeAddress,
    );
    const tx = await TransactionFactory.createRawTx(
      TRANSACTION_TYPES.STOP_LOSS_ORDER,
      {
        ...draft,
        type: TRANSACTION_TYPES.STOP_LOSS_ORDER,
        chainId: 1,
        safeAddress,
      },
    );

    expect(
      decodeComposableCowCreateTxData(tx.data as `0x${string}`),
    ).toMatchObject({
      sellAmount: BigInt("333333333333333333"),
      buyAmount: BigInt("1000000"),
      isSellOrder: false,
    });
  });

  it("approves the same exact sell amount used by the encoded buy order", async () => {
    jest
      .spyOn(publicClientsFromIds[1], "multicall")
      .mockResolvedValue([{ result: BigInt(0), status: "success" }]);
    const draft = await useDraftOrder.getState().createDraftOrder(
      {
        ...orderInput,
        tokenSell: sellTokens[0].token,
        isSellOrder: false,
        amountBuy: "1",
        strikePrice: "3",
        slippagePercent: "0",
      },
      1,
      safeAddress,
    );
    const args = await createRawTxArgs({
      data: [draft],
      safeAddress,
      chainId: 1,
      domainSeparator: safeAddress,
      fallbackState: FALLBACK_STATES.HAS_DOMAIN_VERIFIER,
    });
    const approval = args.find(
      (arg) => arg.type === TRANSACTION_TYPES.ERC20_APPROVE,
    );
    if (!approval || !("amount" in approval))
      throw new Error("Missing approval");
    const tx = await TransactionFactory.createRawTx(
      TRANSACTION_TYPES.ERC20_APPROVE,
      approval,
    );

    expect(
      decodeFunctionData({ abi: erc20Abi, data: tx.data as `0x${string}` })
        .args?.[1],
    ).toBe(BigInt("333333333333333333"));
  });

  it("uses the current pair's configured feeds without a cached route", async () => {
    await expect(
      useDraftOrder.getState().createDraftOrder(orderInput, 1, safeAddress),
    ).resolves.toMatchObject({
      tokenSellOracle: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      tokenBuyOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      oraclePrice: 60000,
    });
  });

  it("resolves the selected pair again after creating a different draft", async () => {
    await useDraftOrder.getState().createDraftOrder(orderInput, 1, safeAddress);

    await expect(
      useDraftOrder
        .getState()
        .createDraftOrder(
          { ...orderInput, tokenSell: sellTokens[0].token },
          1,
          safeAddress,
        ),
    ).resolves.toMatchObject({
      tokenSellOracle: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      tokenBuyOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    });
  });

  it("does not produce a draft when a configured feed cannot be read", async () => {
    jest
      .mocked(publicClientsFromIds[1].readContract)
      .mockRejectedValue(new Error("RPC unavailable"));

    await expect(
      useDraftOrder.getState().createDraftOrder(orderInput, 1, safeAddress),
    ).rejects.toThrow(
      "Unable to read configured price feeds. Please try again.",
    );
  });

  it("ignores stored manual oracles while retaining the other advanced settings", async () => {
    const settings = {
      ...defaultAdvancedSettings,
      receiver: "0x4444444444444444444444444444444444444444",
      maxHoursSinceOracleUpdates: 2,
      partiallyFillable: true,
      tokenSellOracle: "0x2222222222222222222222222222222222222222",
      tokenBuyOracle: "0x3333333333333333333333333333333333333333",
    } as const;
    useAdvancedSettingsStore.getState().setAdvancedSettings(settings);

    await expect(
      useDraftOrder.getState().createDraftOrder(orderInput, 1, safeAddress),
    ).resolves.toMatchObject({
      tokenSellOracle: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      tokenBuyOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      receiver: "0x4444444444444444444444444444444444444444",
      maxHoursSinceOracleUpdates: 2,
      partiallyFillable: true,
    });
  });

  it("rejects noncanonical tokens even when draft creation bypasses the form", async () => {
    await expect(
      useDraftOrder.getState().createDraftOrder(
        {
          ...orderInput,
          tokenSell: { ...orderInput.tokenSell, decimals: 18 },
        },
        1,
        safeAddress,
      ),
    ).rejects.toThrow("Unsupported sell token on this chain");
  });

  it("uses USDC.e as the Gnosis market-price reference", async () => {
    const gnosisTokens = getSupportedTokens(100);
    jest
      .spyOn(publicClientsFromIds[100], "readContract")
      .mockImplementation(async ({ address, functionName }) => {
        if (functionName === "decimals") return 8;
        const answer =
          address?.toLowerCase() ===
          "0xa767f745331d267c7751297d982b050c93985627"
            ? BigInt("200000000000")
            : BigInt("100000000");
        return [BigInt(1), answer, BigInt(1), BigInt(1), BigInt(1)];
      });
    global.fetch = jest.fn().mockImplementation(async (input) => {
      const address = String(input)
        .split("/token/")[1]
        ?.split("/")[0]
        .toLowerCase();
      const prices: Record<string, number> = {
        "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1": 1,
        "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0": 500000000,
      };
      return { json: async () => ({ price: prices[address || ""] }) };
    });

    await expect(
      useDraftOrder.getState().createDraftOrder(
        {
          ...orderInput,
          tokenSell: gnosisTokens.sellTokens[0].token,
          tokenBuy: gnosisTokens.buyToken.token,
        },
        100,
        safeAddress,
      ),
    ).resolves.toMatchObject({ fallbackMarketPrice: expect.closeTo(2000, 8) });
  });
});
