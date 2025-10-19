// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettier from "eslint-plugin-prettier";
import babelParser from "@babel/eslint-parser"; // Import the babel parser

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: {
      import: importPlugin,
      prettier: eslintPluginPrettier,
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
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
    },

    ignores: [
      "eslint.config.js",
      "prettier.config.js",
      "vite.config.ts",
      "dist",
      "node_modules",
      "coverage",
      "bin/",
    ],
  },
  {
    files: ["**/*.js"], // Apply this configuration to all .js files
    languageOptions: {
      parser: babelParser, // Use the imported babel parser
      parserOptions: {
        requireConfigFile: false, // Allow parsing without a Babel config file
        babelOptions: {
          presets: ["@babel/preset-env"], // Use a preset for modern JavaScript features
        },
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
    },
  },
);
