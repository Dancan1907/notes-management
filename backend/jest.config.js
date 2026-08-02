module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.(t|j)s",
    "!src/main.ts",
    "!src/**/*.module.ts",
    "!src/**/*.dto.ts",
    "!src/**/*.config.ts",
    "!src/**/index.ts",
  ],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  // Increase timeout for integration tests
  testTimeout: 120000, // 120 seconds
};
