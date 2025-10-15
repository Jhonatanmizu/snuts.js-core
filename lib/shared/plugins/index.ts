import { ParserOptions } from "@babel/parser";

export const defaultPlugins: ParserOptions["plugins"] = [
  "classProperties",
  "dynamicImport",
  "decorators",
  "jsx",
  "partialApplication",
  "exportDefaultFrom",
  ["pipelineOperator", { proposal: "minimal" }],
  //   "@babel/plugin-proposal-do-expressions",
  //   "@babel/plugin-proposal-destructuring-private",
  //   "@babel/plugin-syntax-import-assertions",
  "importAttributes",
];

export const configsTypescript: ParserOptions = {
  sourceType: "module",
  plugins: ["typescript", ...defaultPlugins],
  errorRecovery: true,
};

export const configsFlow: ParserOptions = {
  sourceType: "module",
  plugins: ["flow", ...defaultPlugins],
  errorRecovery: true,
};
