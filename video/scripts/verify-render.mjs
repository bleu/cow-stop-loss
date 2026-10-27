import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const timeline = JSON.parse(
  readFileSync(new URL("../timeline.json", import.meta.url), "utf8"),
);

const file = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(
      new URL("../output/beta-launch-open-order.mp4", import.meta.url),
    );

const run = (command, args) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(
    result.error,
    undefined,
    `${command} could not start: ${result.error?.message}`,
  );
  assert.equal(result.status, 0, `${command} failed:\n${result.stderr}`);
  return result.stdout + result.stderr;
};

const metadata = JSON.parse(
  run("ffprobe", [
    "-v",
    "error",
    "-show_streams",
    "-show_format",
    "-of",
    "json",
    file,
  ]),
);
const video = metadata.streams.find((stream) => stream.codec_type === "video");
const audio = metadata.streams.find((stream) => stream.codec_type === "audio");
assert.ok(video, "Video stream is missing");
assert.ok(audio, "Audio stream is missing");
assert.equal(video.codec_name, "h264");
assert.equal(video.width, 1080);
assert.equal(video.height, 1350);
assert.equal(video.pix_fmt, "yuv420p");
assert.equal(video.avg_frame_rate, `${timeline.fps}/1`);
assert.equal(Number(video.nb_frames), timeline.duration * timeline.fps);
assert.ok(
  Math.abs(Number(metadata.format.duration) - timeline.duration) < 0.05,
);
assert.equal(audio.codec_name, "aac");
assert.equal(audio.channels, 2);

run("ffmpeg", ["-v", "error", "-i", file, "-f", "null", "-"]);
const volume = run("ffmpeg", [
  "-hide_banner",
  "-i",
  file,
  "-vn",
  "-af",
  "volumedetect",
  "-f",
  "null",
  "-",
]);
const peak = Number(volume.match(/max_volume: (-?[\d.]+) dB/)?.[1]);
assert.ok(
  Number.isFinite(peak) && peak < -0.3,
  `Audio peak is too high: ${peak} dBFS`,
);
console.log(
  `Verified ${file}: 1080x1350, ${timeline.fps}fps, ${timeline.duration * timeline.fps} frames, ${timeline.duration}s, H.264/AAC stereo, peak ${peak} dBFS; full decode passed.`,
);
