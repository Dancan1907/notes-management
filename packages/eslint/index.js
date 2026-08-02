module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
  },
  overrides: [
    {
      files: ["**/*.tsx", "**/*.jsx"],
      extends: ["plugin:react/recommended", "plugin:react-hooks/recommended"],
      settings: { react: { version: "detect" } },
    },
  ],
};
