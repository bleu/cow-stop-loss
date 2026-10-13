// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

import { randomUUID } from "node:crypto";
import { deserialize, serialize } from "node:v8";

if (!globalThis.structuredClone) {
  globalThis.structuredClone = (value) => deserialize(serialize(value));
}
if (globalThis.crypto && !globalThis.crypto.randomUUID) {
  Object.defineProperty(globalThis.crypto, "randomUUID", { value: randomUUID });
}
