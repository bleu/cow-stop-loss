const weth = {
  address: "0x0bd7d308f8e1639fab988df18a8011f41eacad73",
  symbol: "WETH",
  decimals: 18,
} as const;
const usdg = {
  address: "0x5fc5360d0400a0fd4f2af552add042d716f1d168",
  symbol: "USDG",
  decimals: 6,
} as const;

it("omits Robinhood from explicitly requested history when orders are disabled", async () => {
  const originalEnv = process.env;
  process.env = { ...originalEnv };
  delete process.env.NEXT_PUBLIC_ENABLE_ROBINHOOD_ORDERS;
  const fetch = jest
    .spyOn(global, "fetch")
    .mockRejectedValue(new Error("Unexpected indexer request"));
  try {
    await jest.isolateModulesAsync(async () => {
      const { loadStopLossOrders } =
        jest.requireActual<typeof import("../stopLossOrders")>(
          "../stopLossOrders",
        );
      const result = await loadStopLossOrders({
        account: "0x1111111111111111111111111111111111111111",
        chainIds: [4663],
      });
      expect(result.chains).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });
  } finally {
    process.env = originalEnv;
    fetch.mockRestore();
  }
});

it("rejects Robinhood funding history before querying the indexer when orders are disabled", async () => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_ENABLE_ROBINHOOD_ORDERS: "false",
  };
  const fetch = jest
    .spyOn(global, "fetch")
    .mockRejectedValue(new Error("Unexpected indexer request"));
  try {
    await jest.isolateModulesAsync(async () => {
      const { loadStopLossFundingParents } =
        jest.requireActual<typeof import("../stopLossOrders")>(
          "../stopLossOrders",
        );
      await expect(
        loadStopLossFundingParents({
          account: "0x1111111111111111111111111111111111111111",
          cowShed: "0x2222222222222222222222222222222222222222",
          chainId: 4663,
        }),
      ).rejects.toThrow(/orders are unavailable/i);
      expect(fetch).not.toHaveBeenCalled();
    });
  } finally {
    process.env = originalEnv;
    fetch.mockRestore();
  }
});

it("stops direct placement prefetch before any Robinhood RPC or history reads when disabled", async () => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_ENABLE_ROBINHOOD_ORDERS: "false",
  };
  const fetch = jest
    .spyOn(global, "fetch")
    .mockRejectedValue(new Error("Unexpected indexer request"));
  try {
    await jest.isolateModulesAsync(async () => {
      const { publicClientsFromIds } =
        jest.requireActual<typeof import("../publicClients")>(
          "../publicClients",
        );
      const { prefetchPlacementChecks } =
        jest.requireActual<typeof import("../pollerStopLoss")>(
          "../pollerStopLoss",
        );
      const block = jest
        .spyOn(publicClientsFromIds[4663], "getBlockNumber")
        .mockRejectedValue(new Error("Unexpected RPC request"));
      try {
        await expect(
          prefetchPlacementChecks({
            account: "0x1111111111111111111111111111111111111111",
            chainId: 4663,
          }),
        ).rejects.toThrow(/orders are unavailable/i);
        expect(block).not.toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
      } finally {
        block.mockRestore();
      }
    });
  } finally {
    process.env = originalEnv;
    fetch.mockRestore();
  }
});

it("does not read the Robinhood Poller to review approval repair when orders are disabled", async () => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_ENABLE_ROBINHOOD_ORDERS: "false",
  };
  try {
    await jest.isolateModulesAsync(async () => {
      const { publicClientsFromIds } =
        jest.requireActual<typeof import("../publicClients")>(
          "../publicClients",
        );
      const { refreshApprovalRepair } =
        jest.requireActual<typeof import("../pollerStopLoss")>(
          "../pollerStopLoss",
        );
      const read = jest
        .spyOn(publicClientsFromIds[4663], "readContract")
        .mockRejectedValue(new Error("Unexpected RPC request"));
      try {
        await expect(
          refreshApprovalRepair({
            account: "0x1111111111111111111111111111111111111111",
            owner: "0x2222222222222222222222222222222222222222",
            hash: `0x${"ab".repeat(32)}`,
            chainId: 4663,
          }),
        ).resolves.toEqual({
          checks: {
            status: "unknown",
            error: expect.stringMatching(/orders are unavailable/i),
          },
        });
        expect(read).not.toHaveBeenCalled();
      } finally {
        read.mockRestore();
      }
    });
  } finally {
    process.env = originalEnv;
  }
});

it("does not upload stop-loss app data for Robinhood when orders are disabled", async () => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_ENABLE_ROBINHOOD_ORDERS: "false",
  };
  const fetch = jest
    .spyOn(global, "fetch")
    .mockRejectedValue(new Error("Unexpected upload"));
  try {
    await jest.isolateModulesAsync(async () => {
      const { uploadAppData } = jest.requireActual<
        typeof import("../cowApi/uploadAppData")
      >("../cowApi/uploadAppData");
      await expect(
        uploadAppData({
          chainId: 4663,
          appDataHex: `0x${"ab".repeat(32)}`,
          fullAppData: "{}",
        }),
      ).rejects.toThrow(/orders are unavailable/i);
      expect(fetch).not.toHaveBeenCalled();
    });
  } finally {
    process.env = originalEnv;
    fetch.mockRestore();
  }
});

it("exposes the exact staged Robinhood sell set only in the order pilot", () => {
  const originalEnv = process.env;
  try {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_ENABLE_ROBINHOOD_ORDERS;
    jest.isolateModules(() => {
      const { getSupportedTokens } =
        jest.requireActual<typeof import("../supportedTokens")>(
          "../supportedTokens",
        );
      const { configuredTokenRoute } =
        jest.requireActual<typeof import("../oracleRouter")>("../oracleRouter");
      expect(getSupportedTokens(4663).sellTokens).toEqual([]);
      expect(() =>
        configuredTokenRoute({
          chainId: 4663,
          tokenSell: weth,
          tokenBuy: usdg,
        }),
      ).toThrow(/unavailable/i);
    });

    process.env.NEXT_PUBLIC_ENABLE_ROBINHOOD_ORDERS = "true";
    jest.isolateModules(() => {
      const { getSupportedTokens } =
        jest.requireActual<typeof import("../supportedTokens")>(
          "../supportedTokens",
        );
      const { configuredTokenRoute } =
        jest.requireActual<typeof import("../oracleRouter")>("../oracleRouter");
      const { sellTokens, buyToken, unavailableReason } =
        getSupportedTokens(4663);
      expect(unavailableReason).toBeUndefined();
      expect(buyToken.token).toMatchObject(usdg);
      expect(sellTokens.map(({ token }) => token.symbol).sort()).toEqual([
        "AAPL",
        "AMD",
        "AMZN",
        "ASML",
        "BABA",
        "CLSK",
        "COIN",
        "CRCL",
        "CRWV",
        "DELL",
        "ENA",
        "EWY",
        "GME",
        "GOOGL",
        "INTC",
        "IONQ",
        "LINK",
        "META",
        "MSFT",
        "MSTR",
        "MU",
        "NBIS",
        "NVDA",
        "ORCL",
        "PLTR",
        "QQQ",
        "RGTI",
        "RKLB",
        "SLV",
        "SNDK",
        "SPCX",
        "SPY",
        "TSLA",
        "TSM",
        "USO",
        "WBTC",
        "WETH",
      ]);
      expect(
        configuredTokenRoute({
          chainId: 4663,
          tokenSell: weth,
          tokenBuy: usdg,
        }),
      ).toMatchObject({
        tokenSellOracle: "0x78f3556b67e17df817d51ef5a990cdaf09e8d3a9",
        tokenBuyOracle: "0x61b7e5650328764b076a108eff5fa7282a1b9ad2",
      });
    });
  } finally {
    process.env = originalEnv;
  }
});
