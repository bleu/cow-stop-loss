import { arbitrum, avalanche, base, gnosis, linea, sepolia } from "viem/chains";

const robinhoodRpc = "https://robinhood-rpc.publicnode.com";

const networks = [
  [1, "ethereum", "https://ethereum-rpc.publicnode.com"],
  [100, "gnosis", gnosis.rpcUrls.default.http[0]],
  [11155111, "sepolia", sepolia.rpcUrls.default.http[0]],
  [42161, "arbitrum", arbitrum.rpcUrls.default.http[0]],
  [8453, "base", base.rpcUrls.default.http[0]],
  [137, "polygon", "https://polygon-bor-rpc.publicnode.com"],
  [43114, "avalanche", avalanche.rpcUrls.default.http[0]],
  [56, "bsc", "https://bsc-dataseed1.bnbchain.org"],
  [59144, "linea", linea.rpcUrls.default.http[0]],
  [9745, "plasma", "https://rpc.plasma.to"],
  [4663, "robinhood", robinhoodRpc],
] as const;

describe("shared RPC configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL = "https://obsolete.example";
    process.env.NEXT_PUBLIC_RPC_URL_MAINNET = "https://obsolete.example";
    process.env.NEXT_PUBLIC_RPC_URL_POLYGON = "https://obsolete.example";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each([undefined, "", "test-key", "test/+?#%key"])(
    "uses the same RPCs across clients with dRPC key %p",
    (key) => {
      if (key === undefined) {
        delete process.env.NEXT_PUBLIC_DRPC_KEY;
      } else {
        process.env.NEXT_PUBLIC_DRPC_KEY = key;
      }

      jest.isolateModules(() => {
        const { RPC_PROVIDERS, publicClientsFromIds, supportedChainIds } =
          jest.requireActual<typeof import("../publicClients")>(
            "../publicClients",
          );
        const { createWagmiConfig } =
          jest.requireActual<typeof import("#/utils/wagmi")>("#/utils/wagmi");
        const { wagmiServerConfig } = jest.requireActual<
          typeof import("#/utils/wagmiServer")
        >("#/utils/wagmiServer");
        const browser = createWagmiConfig();

        expect(Object.keys(RPC_PROVIDERS)).toHaveLength(networks.length);
        for (const [id, network, defaultUrl] of networks) {
          const expectedUrl = key
            ? `https://lb.drpc.live/${network}/${encodeURIComponent(key)}`
            : defaultUrl;
          expect(RPC_PROVIDERS[id]).toBe(expectedUrl);
          if (key) {
            const url = new URL(RPC_PROVIDERS[id]);
            expect(url.origin).toBe("https://lb.drpc.live");
            expect(decodeURIComponent(url.pathname.split("/")[2])).toBe(key);
            expect(url.search).toBe("");
            expect(url.hash).toBe("");
          }
          const transports = [
            publicClientsFromIds[id].transport,
            browser.getClient({ chainId: id }).transport,
            wagmiServerConfig.getClient({ chainId: id }).transport,
          ];
          for (const transport of transports) {
            expect(transport.url).toBe(expectedUrl);
            expect(transport.timeout).toBe(10000);
            expect(transport.retryCount).toBe(1);
          }
        }
        expect(supportedChainIds).toContain(4663);
        for (const config of [browser, wagmiServerConfig]) {
          expect(config.chains.map(({ id }) => id)).toEqual(supportedChainIds);
          expect(config.getClient({ chainId: 4663 }).chain).toMatchObject({
            id: 4663,
            name: "Robinhood",
            nativeCurrency: { symbol: "ETH", decimals: 18 },
            rpcUrls: { default: { http: [robinhoodRpc] } },
            blockExplorers: {
              default: { url: "https://robinhoodchain.blockscout.com" },
            },
            contracts: {
              multicall3: {
                address: "0xcA11bde05977b3631167028862bE2a173976CA11",
              },
            },
          });
        }
      });
    },
  );
});
