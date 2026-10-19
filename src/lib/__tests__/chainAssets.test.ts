import { readFileSync } from "node:fs";
import path from "node:path";

import { CHAIN_ASSETS } from "../chainAssets";
import { CHAIN_INFO } from "../chainInfo";
import { supportedChains } from "../publicClients";

it("has assets for exactly the supported chains", () => {
  expect(
    Object.keys(CHAIN_ASSETS)
      .map(Number)
      .sort((a, b) => a - b),
  ).toEqual(supportedChains.map(({ id }) => id).sort((a, b) => a - b));
});

it.each(supportedChains)("shares local image metadata for $name", ({ id }) => {
  const asset = CHAIN_ASSETS[id];
  expect(CHAIN_INFO[id]).toMatchObject(asset);
  expect(asset.color).toMatch(/^#[\da-f]{6}$/i);
  expect(asset.icon).toMatch(/^\/assets\/chains\/[^/]+\.svg$/);
  expect(
    readFileSync(path.join(process.cwd(), "public", asset.icon), "utf8"),
  ).toMatch(/<svg\s/);
});

it.each([59144, 9745] as const)(
  "provides RainbowKit metadata for chain %s without a built-in icon",
  (id) => {
    expect(supportedChains.find((chain) => chain.id === id)).toMatchObject({
      iconUrl: CHAIN_ASSETS[id].icon,
      iconBackground: CHAIN_ASSETS[id].color,
    });
  },
);
