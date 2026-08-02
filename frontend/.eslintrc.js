module.exports = {
  extends: ["@repo/eslint-config"],
  env: {
    browser: true,
    node: true,
  },
  overrides: [
    {
      files: ["src/**/*.ts", "src/**/*.tsx"],
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      rules: {
        "react/react-in-jsx-scope": "off",
        // Disable Next.js rule that caused issues (we can re-enable later)
        "@next/next/no-html-link-for-pages": "off",
        // Disable any other Next.js rules if needed
      },
    },
  ],
};
