/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/lib/$1",
  },
  /* eslint-disable no-useless-escape */
  transform: {
    "^.+\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  /* eslint-enable no-useless-escape */
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
