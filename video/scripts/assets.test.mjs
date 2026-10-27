import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const video = fileURLToPath(new URL("../", import.meta.url));
const asset = (name) =>
  readFileSync(new URL(`../public/brand/${name}`, import.meta.url));
const prepare = () => {
  const result = spawnSync("python3", ["scripts/prepare.py"], {
    cwd: video,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
};
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");

test("asset preparation reuses product fonts and produces repeatable artwork", () => {
  prepare();
  const names = [
    "cow-dark.svg",
    "parachute-dark.svg",
    "sky-mobile-dark.svg",
    "moon.svg",
  ];
  const first = names.map((name) => hash(asset(name)));
  prepare();
  assert.deepEqual(
    names.map((name) => hash(asset(name))),
    first,
  );
  for (const font of ["ChakraPetch-Medium.ttf", "ChakraPetch-SemiBold.ttf"]) {
    const product = readFileSync(
      new URL(`../../src/fonts/${font}`, import.meta.url),
    );
    assert.deepEqual(asset(font), product);
  }
});

test("prepared SVGs have no clock-driven CSS animation or external references", () => {
  prepare();
  for (const name of [
    "sky-mobile-dark.svg",
    "sky-mobile-light.svg",
    "ground-mobile-dark.svg",
    "ground-mobile-light.svg",
    "cow-dark.svg",
    "parachute-dark.svg",
    "moon.svg",
  ]) {
    const source = asset(name).toString();
    assert.doesNotMatch(
      source,
      /<style|<animate|<script|https?:\/\/(?!www\.w3\.org\/2000\/svg)/,
    );
    assert.match(source, /shape-rendering="crispEdges"/);
  }
});
