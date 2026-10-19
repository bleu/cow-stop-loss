import { existsSync } from "node:fs";
import { join } from "node:path";

import { serialize } from "wagmi";

import { createWagmiConfig } from "#/utils/wagmi";
import { getWagmiInitialState, wagmiServerConfig } from "#/utils/wagmiServer";

import { CHAIN_INFO } from "../chainInfo";
import {
  chainNames,
  createRpcTransport,
  plasma,
  publicClientsFromIds,
  publicClientsFromNames,
  RPC_PROVIDERS,
  supportedChainIds,
  supportedChains,
} from "../publicClients";

const chainIds = [1, 100, 42161, 8453, 137, 43114, 56, 59144, 9745, 11155111];

describe("standalone chain configuration", () => {
  it("keeps browser and server chains, transports, and cookie storage in sync", () => {
    const browser = createWagmiConfig();
    expect(browser.chains).toEqual(wagmiServerConfig.chains);
    expect(browser.chains.map(({ id }) => id).sort()).toEqual(chainIds.sort());
    expect(browser._internal.ssr).toBe(true);
    expect(wagmiServerConfig._internal.ssr).toBe(true);
    expect(browser.storage?.key).toBe(wagmiServerConfig.storage?.key);
    for (const chain of supportedChains) {
      const browserTransport = browser.getClient({
        chainId: chain.id,
      }).transport;
      const serverTransport = wagmiServerConfig.getClient({
        chainId: chain.id,
      }).transport;
      expect(browserTransport.url).toBe(RPC_PROVIDERS[chain.id]);
      expect(serverTransport.url).toBe(browserTransport.url);
      expect(browserTransport.timeout).toBe(10000);
      expect(serverTransport.timeout).toBe(10000);
      expect(browserTransport.retryCount).toBe(1);
      expect(serverTransport.retryCount).toBe(1);
    }
  });

  it("keeps the browser connector available without WalletConnect", () => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    try {
      expect(createWagmiConfig().connectors.map(({ type }) => type)).toEqual([
        "injected",
      ]);
    } finally {
      if (projectId !== undefined)
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = projectId;
    }
  });

  it.each(chainIds)(
    "restores the selected chain %s from the SSR cookie",
    (chainId) => {
      const cookie = `wagmi.store=${serialize({ state: { chainId, connections: new Map(), current: null } })}`;
      expect(getWagmiInitialState(cookie)?.chainId).toBe(chainId);
    },
  );

  it("has complete client, label, and local image maps", () => {
    expect(Object.keys(publicClientsFromIds).map(Number).sort()).toEqual(
      [...supportedChainIds].sort(),
    );
    expect(Object.values(publicClientsFromNames)).toHaveLength(10);
    for (const chain of supportedChains) {
      expect(publicClientsFromIds[chain.id].chain?.id).toBe(chain.id);
      expect(chainNames[chain.id]).toBeTruthy();
      expect(CHAIN_INFO[chain.id].icon).toMatch(/^\/assets\/chains\//);
      expect(
        existsSync(join(process.cwd(), "public", CHAIN_INFO[chain.id].icon)),
      ).toBe(true);
      const transport = createRpcTransport(chain)({ chain });
      expect(transport.config.timeout).toBe(10000);
      expect(transport.config.retryCount).toBe(1);
    }
  });

  it("keeps the reviewed Polygon and BNB public RPC defaults", () => {
    expect(RPC_PROVIDERS[137]).toBe(
      process.env.NEXT_PUBLIC_RPC_URL_POLYGON ||
        "https://polygon-bor-rpc.publicnode.com",
    );
    expect(RPC_PROVIDERS[56]).toBe(
      process.env.NEXT_PUBLIC_RPC_URL_BNB ||
        "https://bsc-dataseed1.bnbchain.org",
    );
    expect(plasma.id).toBe(9745);
    expect(plasma.rpcUrls.default.http).toEqual(["https://rpc.plasma.to"]);
  });
});
