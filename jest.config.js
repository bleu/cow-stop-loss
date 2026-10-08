/* eslint-env node */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.polyfills.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.[jt]sx?$": [
      "ts-jest",
      { tsconfig: { jsx: "react-jsx", allowJs: true } },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!(?:\\.pnpm/)?@bleu[+/]ui)"],
  moduleNameMapper: {
    "^#/(.*)$": "<rootDir>/src/$1",
  },
};
