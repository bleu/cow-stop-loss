#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// CoW Swap success sound, GPL-3.0; keep the upstream bytes unchanged.
export const SOURCE_URL =
  "https://raw.githubusercontent.com/cowprotocol/cowswap/d0bf6060e0fcf1f48c37c7c5af42430f851bafb5/apps/cowswap-frontend/public/audio/success.mp3";
export const SHA256 =
  "fb1bc32dcba9ba7996d150bef795cbfdde15eb75aab914332ef2d36ab3bdb032";
export const OUTPUT = fileURLToPath(
  new URL("../public/audio/cowswap-moo.mp3", import.meta.url),
);

function validate(bytes) {
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== SHA256) {
    throw new Error(
      `CoW Swap moo SHA-256 mismatch: expected ${SHA256}, got ${actual}`,
    );
  }
}

export async function fetchMoo({ output = OUTPUT, fetchImpl = fetch } = {}) {
  let existing;
  try {
    existing = await readFile(output);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (existing !== undefined) {
    validate(existing);
    return output;
  }
  const response = await fetchImpl(SOURCE_URL, { redirect: "error" });
  if (!response.ok)
    throw new Error(`CoW Swap moo download failed: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  validate(bytes);
  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, bytes, { flag: "wx" });
    await rename(temporary, output);
  } finally {
    await rm(temporary, { force: true });
  }
  return output;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  fetchMoo()
    .then((output) => console.log(`${output}: verified SHA-256 ${SHA256}`))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
