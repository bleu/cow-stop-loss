import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { fetchMoo, OUTPUT, SHA256, SOURCE_URL } from "./fetch-moo.mjs";

const timeline = JSON.parse(
  await readFile(new URL("../timeline.json", import.meta.url), "utf8"),
);
const audioScript = fileURLToPath(new URL("audio.py", import.meta.url));
const asset = (name) =>
  fileURLToPath(new URL(`../public/audio/${name}`, import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result.stdout;
};

// Require the pinned local asset; tests must not use the network.
await fetchMoo({
  fetchImpl: () => {
    throw new Error("Run node video/scripts/fetch-moo.mjs before audio tests");
  },
});
const moo = await readFile(OUTPUT);

test("moo uses the pinned upstream bytes and a verified offline cache", async () => {
  assert.equal(hash(moo), SHA256);
  const directory = await mkdtemp(join(tmpdir(), "cow-audio-"));
  const output = join(directory, "moo.mp3");
  try {
    let requests = 0;
    await fetchMoo({
      output,
      fetchImpl: async (url, options) => {
        requests++;
        assert.equal(url, SOURCE_URL);
        assert.equal(options.redirect, "error");
        return new Response(moo);
      },
    });
    await fetchMoo({
      output,
      fetchImpl: () => {
        throw new Error("Unexpected network request");
      },
    });
    assert.equal(requests, 1);
    assert.deepEqual(await readFile(output), moo);
    await writeFile(output, "corrupt cache");
    await assert.rejects(fetchMoo({ output }), /SHA-256 mismatch/);
    assert.equal((await readFile(output)).toString(), "corrupt cache");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("failed or changed downloads do not create an audio file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cow-audio-"));
  const output = join(directory, "moo.mp3");
  try {
    await assert.rejects(
      fetchMoo({ output, fetchImpl: async () => new Response("changed") }),
      /SHA-256 mismatch/,
    );
    await assert.rejects(
      fetchMoo({
        output,
        fetchImpl: async () => new Response("missing", { status: 404 }),
      }),
      /HTTP 404/,
    );
    await assert.rejects(readFile(output), { code: "ENOENT" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test(`${timeline.duration}-second score and separate effects are repeatable and pass PCM checks`, async () => {
  const names = [
    "music.wav",
    "danger.wav",
    "whistle.wav",
    "pop.wav",
    "click.wav",
  ];
  run("python3", [audioScript]);
  const first = await Promise.all(
    names.map(async (name) => hash(await readFile(asset(name)))),
  );
  run("python3", [audioScript]);
  assert.deepEqual(
    await Promise.all(
      names.map(async (name) => hash(await readFile(asset(name)))),
    ),
    first,
  );
  run("python3", [audioScript, "--check"]);
  await assert.rejects(readFile(asset("moo.wav")), { code: "ENOENT" });
  const metadata = JSON.parse(
    run("python3", [
      "-B",
      "-c",
      `
import importlib.util, json
spec = importlib.util.spec_from_file_location("audio", ${JSON.stringify(audioScript)})
audio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audio)
duration = audio.moo_duration()
assert audio.BPM == 150
assert audio.DURATION == audio.TIMELINE["duration"]
assert audio.OUTRO_START == audio.DURATION - 1
assert audio.CUES == {**{name: audio.TIMELINE["sounds"][name] for name in ("danger", "whistle", "pop", "moo")}, "click": tuple(audio.TIMELINE["sounds"]["clicks"])}
assert audio.DURATIONS == {"music": audio.TIMELINE["duration"], "danger": .7, "whistle": .8, "pop": .22, "click": .085}
assert abs(audio.music_duck(audio.CUES["moo"], duration) - audio.DUCK_GAIN) < 1e-9
assert abs(audio.music_duck(audio.CUES["moo"] + duration, duration) - audio.DUCK_GAIN) < 1e-9
assert audio.music_duck(audio.CUES["moo"] + duration + .23, duration) == 1
assert audio.CUES["moo"] + duration <= audio.TIMELINE["scenes"]["rescue"]["duration"]
print(json.dumps({"mooDuration": duration}))
`,
    ]),
  );
  assert.ok(Math.abs(metadata.mooDuration - 3.06932) < 0.000001);
  const music = await readFile(asset("music.wav"));
  // The standard-library WAV writer emits a 44-byte PCM header.
  assert.equal(music.readUInt32LE(24), 44100);
  assert.equal(music.readUInt32LE(40), timeline.duration * 44100 * 4);
  const windowRms = (start, end) => {
    const first = 44 + Math.round(start * 44100) * 4;
    const last = 44 + Math.round(end * 44100) * 4;
    let energy = 0;
    for (let offset = first; offset < last; offset += 2) {
      const sample = music.readInt16LE(offset) / 32768;
      energy += sample * sample;
    }
    return Math.sqrt(energy / ((last - first) / 2));
  };
  const outroStart = timeline.duration - 1;
  // Check each quarter-second so a final chord cannot hide a missing groove.
  for (let start = outroStart - 2.5; start < outroStart - 0.5; start += 0.25) {
    const rms = windowRms(start, start + 0.25);
    assert.ok(rms > 0.005, `Missing groove at ${start}s: RMS ${rms}`);
  }
  assert.ok(windowRms(outroStart - 0.5, outroStart - 0.35) > 0.005);
  assert.equal(windowRms(outroStart - 0.2, outroStart), 0);
  let endingPeak = 0;
  for (
    let offset = 44 + (timeline.duration - 1) * 44100 * 4;
    offset < music.length;
    offset += 2
  ) {
    endingPeak = Math.max(
      endingPeak,
      Math.abs(music.readInt16LE(offset)) / 32768,
    );
  }
  assert.ok(endingPeak > 0.1, `Missing tonic ending: ${endingPeak}`);

  const inputs = [
    "music.wav",
    "danger.wav",
    "whistle.wav",
    "pop.wav",
    "cowswap-moo.mp3",
    "click.wav",
  ];
  const filters = [
    "[0:a]volume=1[music]",
    `[1:a]adelay=${timeline.sounds.danger * 1000}:all=1[danger]`,
    `[2:a]adelay=${timeline.sounds.whistle * 1000}:all=1[whistle]`,
    `[3:a]adelay=${timeline.sounds.pop * 1000}:all=1[pop]`,
    `[4:a]volume=0.65,adelay=${timeline.sounds.moo * 1000}:all=1[moo]`,
    `[5:a]asplit=${timeline.sounds.clicks.length}${timeline.sounds.clicks.map((_, index) => `[c${index + 1}]`).join("")}`,
    ...timeline.sounds.clicks.map(
      (time, index) =>
        `[c${index + 1}]adelay=${time * 1000}:all=1[click${index + 1}]`,
    ),
    `[music][danger][whistle][pop][moo]${timeline.sounds.clicks.map((_, index) => `[click${index + 1}]`).join("")}amix=inputs=${5 + timeline.sounds.clicks.length}:normalize=0:duration=longest[out]`,
  ].join(";");
  const pcm = run(
    "ffmpeg",
    [
      "-v",
      "error",
      ...inputs.flatMap((name) => ["-i", asset(name)]),
      "-filter_complex",
      filters,
      "-map",
      "[out]",
      "-ar",
      "176400",
      "-ac",
      "2",
      "-f",
      "f32le",
      "pipe:1",
    ],
    { encoding: null, maxBuffer: 40 * 1024 * 1024 },
  );
  let peak = 0;
  for (let offset = 0; offset < pcm.length; offset += 4)
    peak = Math.max(peak, Math.abs(pcm.readFloatLE(offset)));
  assert.ok(peak < 0.9, `Combined mix lacks headroom: ${peak}`);
  console.log(
    `Combined 4x-oversampled peak: ${peak.toFixed(6)} (${(20 * Math.log10(peak)).toFixed(2)} dBFS)`,
  );
});
