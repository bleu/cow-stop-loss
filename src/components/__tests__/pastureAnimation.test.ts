/** @jest-environment jsdom */

import { readFileSync } from "node:fs";
import path from "node:path";

const assets = [
  "ground-light.svg",
  "ground-dark.svg",
  "ground-desktop-light.svg",
  "ground-desktop-dark.svg",
  "ground-mobile-light.svg",
  "ground-mobile-dark.svg",
];

describe.each(assets)("pasture animation in %s", (asset) => {
  const source = readFileSync(
    path.join(process.cwd(), "public/assets/air-rescue", asset),
    "utf8",
  );
  const svg = new DOMParser().parseFromString(source, "image/svg+xml");
  const style = svg.querySelector("style")?.textContent ?? "";

  it("keeps the mouth and grass attached to the moving head", () => {
    expect(svg.querySelector("parsererror")).toBeNull();
    expect(
      svg.querySelector("#cow .cow-head .cow-mouth .cow-grass"),
    ).not.toBeNull();
    expect(svg.querySelector("#cow .cow-tail")).not.toBeNull();
    expect(svg.querySelector("use[href='#cow']")).not.toBeNull();
  });

  if (asset.startsWith("ground-desktop-")) {
    it("mirrors the middle cow within its original pasture position", () => {
      const cows = Array.from(svg.querySelectorAll("use[href='#cow']"));

      expect(
        cows.map((cow) => cow.parentElement?.getAttribute("transform")),
      ).toEqual([
        "translate(250 73)",
        "translate(474 76) scale(-1 1)",
        "translate(600 72)",
      ]);
    });
  }

  it("uses a repeating stepped graze, chew, and bite cycle", () => {
    for (const [part, animation] of [
      ["head", "graze"],
      ["mouth", "chew"],
      ["grass", "bite"],
    ]) {
      expect(style).toMatch(
        new RegExp(
          `\\.cow-${part} \\{[^}]*${animation} 12s steps\\([^}]*infinite`,
        ),
      );
      expect(style).toContain(`@keyframes ${animation}`);
    }
  });

  it("stops motion for the pause control and reduced motion", () => {
    expect(svg.documentElement.id).toBe("still");
    expect(style).toMatch(/:root:target \{ --scene-animation: none;/);
    expect(style).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{ :root \{ --scene-animation: none;/,
    );
    for (const part of [
      "cow-head",
      "cow-mouth",
      "cow-grass",
      "cow-tail",
      "reflection",
    ]) {
      expect(style).toMatch(
        new RegExp(`\\.${part} \\{[^}]*animation: var\\(--scene-animation,`),
      );
    }
    expect(style).toMatch(/\.cow-grass \{ opacity: 0;/);
  });
});
