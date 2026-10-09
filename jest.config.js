/* eslint-env node */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.polyfills.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
    "^.+\\.jsx?$": [
      require.resolve("next/dist/build/swc/jest-transformer"),
      {},
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!.*(?:@bleu[+/]ui|@rainbow-me[+/]rainbowkit|wagmi|@wagmi[+/]|uint8arrays|multiformats))",
  ],
  moduleNameMapper: {
    "^#/(.*)$": "<rootDir>/src/$1",
  },
};
