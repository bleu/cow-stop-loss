/* eslint-env node */
const base = require("./jest.config");

module.exports = {
  ...base,
  roots: ["<rootDir>/tests/fork"],
  testMatch: ["**/*.fork.test.ts"],
  testTimeout: 180000,
  maxWorkers: 1,
};
