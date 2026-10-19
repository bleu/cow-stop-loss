import { existsSync } from "fs";
import path from "path";
import { isAddress, zeroAddress } from "viem";

import { networkFor, networkIdFor } from "../../utils";
import { CHAIN_INFO } from "../chainInfo";
import { COW_API_URL_BY_CHAIN_ID } from "../cowApi/api";
import { getExplorerOrderLink } from "../cowExplorer";
import { getSupportedTokens } from "../supportedTokens";
import { CHAINS_ORACLE_ROUTER_FACTORY } from "../oracleRouter";
import {
  publicClientsFromIds,
  RPC_PROVIDERS,
  supportedChainIds,
} from "../publicClients";
import { findTokenOracles, TOKEN_CATALOG, USD_TOKENS } from "../tokenCatalog";

it("covers the requested CoW EVM networks and preserves Sepolia", () => {
  expect([...supportedChainIds].sort((a, b) => a - b)).toEqual([
    1, 56, 100, 137, 8453, 9745, 42161, 43114, 59144, 11155111,
  ]);
  expect(
    Object.keys(USD_TOKENS)
      .map(Number)
      .sort((a, b) => a - b),
  ).toEqual([...supportedChainIds].sort((a, b) => a - b));
});

it.each(supportedChainIds)(
  "has complete configuration for chain %s",
  (chainId) => {
    const info = CHAIN_INFO[chainId];
    expect(info.label).toBeTruthy();
    expect(existsSync(path.join(process.cwd(), "public", info.icon))).toBe(
      true,
    );
    expect(publicClientsFromIds[chainId].chain?.id).toBe(chainId);
    expect(new URL(RPC_PROVIDERS[chainId]).protocol).toBe("https:");
    expect(new URL(COW_API_URL_BY_CHAIN_ID[chainId]).protocol).toBe("https:");
    expect(CHAINS_ORACLE_ROUTER_FACTORY[chainId]).toBeDefined();
    expect(Number(networkIdFor(networkFor(chainId)))).toBe(chainId);
    expect(getExplorerOrderLink(chainId, "0x1234")).not.toContain("undefined");
  },
);

it("has unique, valid token contracts and local images", () => {
  const keys = TOKEN_CATALOG.map(
    (token) => `${token.chainId}:${token.address.toLowerCase()}`,
  );
  expect(new Set(keys).size).toBe(keys.length);
  for (const token of TOKEN_CATALOG) {
    expect(supportedChainIds).toContain(token.chainId);
    expect(isAddress(token.address)).toBe(true);
    expect(token.address.toLowerCase()).not.toBe(zeroAddress);
    expect(Number.isInteger(token.decimals)).toBe(true);
    expect(token.decimals).toBeGreaterThanOrEqual(0);
    expect(token.decimals).toBeLessThanOrEqual(36);
    expect(token.symbol).toBeTruthy();
    expect(token.name).toBeTruthy();
    expect(token.logoURI.startsWith("/assets/tokens/")).toBe(true);
    expect(existsSync(path.join(process.cwd(), "public", token.logoURI))).toBe(
      true,
    );
  }
});

it.each(supportedChainIds.filter((id) => id !== 11155111))(
  "routes every advertised token to its USD buy token on chain %s",
  async (chainId) => {
    const { sellTokens, buyToken: configuredBuyToken } =
      getSupportedTokens(chainId);
    const tokens = sellTokens.map(({ token }) => token);
    const buyToken = USD_TOKENS[chainId];
    expect(configuredBuyToken.token).toEqual(buyToken);
    expect(tokens.length).toBeGreaterThan(0);
    expect(
      tokens.some(
        (token) =>
          token.address.toLowerCase() === buyToken.address.toLowerCase(),
      ),
    ).toBe(false);
    const buyOracles = findTokenOracles(chainId, buyToken.address);
    for (const token of tokens) {
      const oracles = findTokenOracles(chainId, token.address);
      expect(Object.keys(oracles).length).toBeGreaterThan(0);
      for (const oracle of Object.values(oracles)) {
        expect(isAddress(oracle)).toBe(true);
        expect(oracle.toLowerCase()).not.toBe(zeroAddress);
      }
      expect(
        !!(oracles.USD && buyOracles.USD) || !!(oracles.ETH && buyOracles.ETH),
      ).toBe(true);
      const Router = CHAINS_ORACLE_ROUTER_FACTORY[chainId];
      const route = await new Router({
        chainId,
        tokenSell: token,
        tokenBuy: buyToken,
      }).findRoute();
      expect(route.tokenBuyOracle).toBe(
        oracles.ETH && buyOracles.ETH ? buyOracles.ETH : buyOracles.USD,
      );
    }
  },
);

it("looks up feeds by chain and case-insensitive contract address", () => {
  const token = USD_TOKENS[8453];
  expect(findTokenOracles(8453, token.address.toUpperCase())).toEqual(
    findTokenOracles(8453, token.address),
  );
  expect(
    findTokenOracles(8453, "0x0000000000000000000000000000000000000001"),
  ).toEqual({});
  expect(findTokenOracles(1, token.address)).toEqual({});
});
