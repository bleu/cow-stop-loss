import { readFileSync } from "node:fs";
import path from "node:path";

import { CHAIN_ASSETS } from "../chainAssets";
import { CHAIN_INFO } from "../chainInfo";
import { supportedChains, walletChains } from "../publicClients";

it("has assets for exactly the wallet networks", () => {
  expect(
    Object.keys(CHAIN_ASSETS)
      .map(Number)
      .sort((a, b) => a - b),
  ).toEqual(walletChains.map(({ id }) => id).sort((a, b) => a - b));
});

it.each(supportedChains)(
  "shares order chain image metadata for $name",
  ({ id }) => {
    expect(CHAIN_INFO[id]).toMatchObject(CHAIN_ASSETS[id]);
  },
);

it.each(walletChains)("has a local image for $name", ({ id }) => {
  const asset = CHAIN_ASSETS[id];
  expect(asset.color).toMatch(/^#[\da-f]{6}$/i);
  expect(asset.icon).toMatch(/^\/assets\/chains\/[^/]+\.svg$/);
  expect(
    readFileSync(path.join(process.cwd(), "public", asset.icon), "utf8"),
  ).toMatch(/<svg\s/);
});

it.each([59144, 9745, 4663] as const)(
  "provides RainbowKit metadata for chain %s without a built-in icon",
  (id) => {
    expect(walletChains.find((chain) => chain.id === id)).toMatchObject({
      iconUrl: CHAIN_ASSETS[id].icon,
      iconBackground: CHAIN_ASSETS[id].color,
    });
  },
);
