module.exports = {
  // Run Prettier on all supported files
  "*.{js,jsx,ts,tsx,json,md,yml,yaml}": ["prettier --write"],

  // Run ESLint on TS/JS files and auto‑fix
  "*.{js,jsx,ts,tsx}": ["eslint --fix"],

  // Optional: run type‑checking on staged TS files (can be slow)
  // '*.{ts,tsx}': () => 'pnpm run type-check',
};
