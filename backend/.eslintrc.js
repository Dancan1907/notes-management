module.exports = {
  extends: ["@repo/eslint-config"],
  env: {
    node: true,
    jest: true,
  },
  overrides: [
    {
      files: ["src/**/*.ts", "prisma/**/*.ts"],
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        // Ignore unused variables that start with underscore
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
          },
        ],
      },
    },
  ],
};
