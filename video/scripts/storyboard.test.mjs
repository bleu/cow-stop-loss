import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const timeline = JSON.parse(
  readFileSync(new URL("../timeline.json", import.meta.url), "utf8"),
);
const capture = JSON.parse(
  readFileSync(
    new URL("../public/captures/metadata.json", import.meta.url),
    "utf8",
  ),
);

const contains = (outer, inner) =>
  inner.x >= outer.x - 1 &&
  inner.y >= outer.y - 1 &&
  inner.x + inner.width <= outer.x + outer.width + 1 &&
  inner.y + inner.height <= outer.y + outer.height + 1;

test("both stories fill 690 frames with no gaps or overlaps", () => {
  assert.equal(timeline.duration * timeline.fps, 690);
  let end = 0;
  for (const scene of Object.values(timeline.scenes)) {
    assert.equal(scene.from, end);
    assert.ok(Number.isInteger(scene.from * timeline.fps));
    assert.ok(Number.isInteger(scene.duration * timeline.fps));
    end += scene.duration;
  }
  assert.equal(end, timeline.duration);
  assert.ok(timeline.sounds.danger < timeline.sounds.whistle);
  assert.ok(timeline.sounds.whistle < timeline.sounds.pop);
  assert.ok(timeline.sounds.pop < timeline.sounds.moo);
  assert.equal(timeline.scenes.amount.duration, 2.5);
  assert.equal(timeline.scenes.trigger.duration, 2.5);
  assert.equal(
    timeline.scenes.trigger.from +
      timeline.scenes.trigger.duration -
      timeline.scenes.amount.from,
    5,
  );
  assert.deepEqual(timeline.sounds.clicks, [
    timeline.actions.tokenSelector,
    timeline.actions.amountEntered,
    timeline.actions.triggerEntered,
    timeline.actions.orderVisible,
  ]);
  assert.ok(timeline.actions.triggerEntered < timeline.scenes.conclusion.from);
  assert.ok(timeline.actions.executionVisible < timeline.scenes.closing.from);
});

test("closing card has no Discord message or replacement", () => {
  const source = readFileSync(
    new URL("../src/RescueScenes.tsx", import.meta.url),
    "utf8",
  );
  const closing = source.slice(source.indexOf("export const ClosingCard"));
  assert.doesNotMatch(closing, /Discord|Find it on/);
  assert.match(closing, /Beta is live/);
  assert.match(closing, /Built by/);
});

test("camera groups include field context and fit the real screenshots", () => {
  assert.equal(capture.passed, true);
  assert.equal(capture.viewport.width, 640);
  assert.equal(capture.order.limit, "2970 USDC/WETH");
  const panelWidth = capture.screenshots[0].fields.panel.width;
  for (const image of capture.screenshots) {
    const png = { x: 0, y: 0, width: image.width, height: image.height };
    assert.equal(image.fields.panel.width, panelWidth);
    for (const [name, rect] of Object.entries(image.fields)) {
      assert.ok(contains(png, rect), `${image.file}:${name} exceeds its PNG`);
    }
    if (image.file === "review.png") {
      assert.ok(image.fields.reviewAmounts);
      assert.ok(image.fields.reviewTerms);
    } else {
      assert.ok(
        contains(image.fields.receiveGroup, image.fields.receiveAmount),
        `${image.file}: receive summary omits its amount`,
      );
      for (const [group, input] of [
        ["sellGroup", "sellAmount"],
        ["triggerGroup", "triggerPrice"],
        ["limitGroup", "limitPrice"],
      ]) {
        assert.ok(
          contains(image.fields[group], image.fields[input]),
          `${image.file}:${group} omits its input`,
        );
        assert.ok(
          image.fields[group].y < image.fields[input].y,
          `${image.file}:${group} omits its label`,
        );
      }
    }
  }
});
