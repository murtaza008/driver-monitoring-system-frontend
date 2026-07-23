import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".next"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Most of this codebase is .js/.jsx, not .ts/.tsx — without this block, lint
  // (including no-unused-vars) never ran on the vast majority of the app.
  // Root-level build config files (vite.config.js etc.) run in Node, not the
  // browser, and are excluded — they're tooling config, not app source.
  {
    extends: [js.configs.recommended],
    files: ["**/*.{js,jsx}"],
    ignores: ["*.config.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Without this, base no-unused-vars doesn't know a JSX tag like
      // <Button> counts as a use of the imported `Button` identifier, and
      // flags nearly every component import in the app as unused.
      "react/jsx-uses-vars": "warn",
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
    },
  },
);
