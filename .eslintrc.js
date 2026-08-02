module.exports = {
  root: true,
  extends: ["@repo/eslint-config"],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".next/",
    "pnpm-lock.yaml",
    "*.config.js",
    "*.config.ts",
  ],
  overrides: [
    {
      files: ["backend/**/*.ts", "backend/**/*.tsx"],
      parserOptions: {
        project: "./backend/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
      },
    },
    {
      files: ["frontend/**/*.ts", "frontend/**/*.tsx"],
      parserOptions: {
        project: "./frontend/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "react/react-in-jsx-scope": "off",
      },
    },
  ],
};
