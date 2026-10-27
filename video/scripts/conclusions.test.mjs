import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const captures = JSON.parse(
  readFileSync(
    new URL("../public/captures/conclusions.json", import.meta.url),
    "utf8",
  ),
);

test("both conclusions use complete, bounded real-app captures", () => {
  assert.equal(captures.passed, true);
  for (const file of [
    "open-order.png",
    "trigger-reached.png",
    "filled-order.png",
    "execution-detail.png",
  ]) {
    const shot = captures.screenshots.find((image) => image.file === file);
    assert.ok(shot, `Missing ${file}`);
    const png = readFileSync(
      new URL(`../public/captures/${file}`, import.meta.url),
    );
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), shot.width);
    assert.equal(png.readUInt32BE(20), shot.height);
    assert.ok(shot.fields.panel);
    for (const [name, rect] of Object.entries(shot.fields)) {
      assert.ok(rect.width > 0 && rect.height > 0, `${file}:${name} is empty`);
      assert.ok(
        rect.x >= -1 && rect.y >= -1,
        `${file}:${name} starts outside its image`,
      );
      assert.ok(
        rect.x + rect.width <= shot.width + 1,
        `${file}:${name} exceeds its width`,
      );
      assert.ok(
        rect.y + rect.height <= shot.height + 1,
        `${file}:${name} exceeds its height`,
      );
    }
  }
});
