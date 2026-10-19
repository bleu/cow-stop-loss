import { existsSync } from "fs";
import path from "path";
import { isAddress, zeroAddress } from "viem";

import { networkFor, networkIdFor } from "../../utils";
import { CHAIN_INFO } from "../chainInfo";
import { COW_API_URL_BY_CHAIN_ID } from "../cowApi/api";
import { getExplorerOrderLink } from "../cowExplorer";
import { CHAINS_ORACLE_ROUTER_FACTORY } from "../oracleRouter";
import {
  publicClientsFromIds,
  RPC_PROVIDERS,
  supportedChainIds,
} from "../publicClients";
import { getSupportedTokens } from "../supportedTokens";
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
  "retains metadata but advertises no production routes on chain %s",
  async (chainId) => {
    const { sellTokens, buyToken, unavailableReason } =
      getSupportedTokens(chainId);
    expect(buyToken.token).toEqual(USD_TOKENS[chainId]);
    expect(sellTokens).toEqual([]);
    expect(buyToken.oracles).toEqual({});
    expect(unavailableReason).toEqual(expect.any(String));
    const tokens = TOKEN_CATALOG.filter((token) => token.chainId === chainId);
    expect(tokens.length).toBeGreaterThan(0);
    for (const token of tokens)
      expect(findTokenOracles(chainId, token.address)).toEqual({});
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[chainId];
    await expect(
      new Router({
        chainId,
        tokenSell: tokens.find(
          (token) => token.address !== buyToken.token.address,
        )!,
        tokenBuy: buyToken.token,
      }).findRoute(),
    ).rejects.toThrow(unavailableReason);
  },
);

it("does not expose feeds for metadata-only, unknown or cross-chain addresses", () => {
  const token = USD_TOKENS[8453];
  expect(findTokenOracles(8453, token.address.toUpperCase())).toEqual({});
  expect(findTokenOracles(8453, token.address)).toEqual({});
  expect(
    findTokenOracles(8453, "0x0000000000000000000000000000000000000001"),
  ).toEqual({});
  expect(findTokenOracles(1, token.address)).toEqual({});
});
