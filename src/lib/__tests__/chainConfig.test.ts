import { COW_API_URL_BY_CHAIN_ID } from "../cowApi/api";
import { getExplorerBaseUrl } from "../cowExplorer";
import { ChainId, supportedChainIds } from "../publicClients";

const expectedPaths = [
  [1, "mainnet", ""],
  [100, "xdai", "/gc"],
  [42161, "arbitrum_one", "/arb1"],
  [8453, "base", "/base"],
  [137, "polygon", "/pol"],
  [43114, "avalanche", "/avax"],
  [56, "bnb", "/bnb"],
  [59144, "linea", "/linea"],
  [9745, "plasma", "/plasma"],
  [11155111, "sepolia", "/sepolia"],
] as const satisfies ReadonlyArray<readonly [ChainId, string, string]>;

describe("chain endpoint configuration", () => {
  it("covers only the approved networks and Sepolia", () => {
    expect([...supportedChainIds].sort()).toEqual(
      expectedPaths.map(([id]) => id).sort(),
    );
  });

  it.each(expectedPaths)(
    "uses the CoW API and explorer paths for chain %s",
    (chainId, apiPath, explorerPath) => {
      expect(COW_API_URL_BY_CHAIN_ID[chainId]).toBe(
        `https://api.cow.fi/${apiPath}`,
      );
      const explorerBase =
        process.env.NEXT_PUBLIC_COW_EXPLORER_URL_PROD ||
        "https://explorer.cow.fi";
      expect(getExplorerBaseUrl(chainId)).toBe(
        `${explorerBase}${explorerPath}`,
      );
    },
  );
});
