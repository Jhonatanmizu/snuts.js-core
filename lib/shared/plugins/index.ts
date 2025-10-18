import { ParserOptions } from "@babel/parser";

export const defaultPlugins: ParserOptions["plugins"] = [
  "classProperties",
  "dynamicImport",
  "decorators",
  "jsx",
  "partialApplication",
  "exportDefaultFrom",
  ["pipelineOperator", { proposal: "minimal" }],
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
