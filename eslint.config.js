// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import vitest from "eslint-plugin-vitest";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettier from "eslint-plugin-prettier";

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, prettier, {
  plugins: {
    import: importPlugin,
    prettier: eslintPluginPrettier,
    vitest,
  },
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parser: tseslint.parser,
    parserOptions: {
      project: "./tsconfig.json",
    },
  },
  rules: {
    "prettier/prettier": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "import/order": [
      "error",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
      },
    ],
    "vitest/no-focused-tests": "error",
    "vitest/no-identical-title": "error",
  },

  ignores: [
    "eslint.config.js",
    "prettier.config.js",
    "vite.config.ts",
    "dist",
    "node_modules",
    "coverage",
    "bin/",
    "vitest.config.js",
  ],
});
