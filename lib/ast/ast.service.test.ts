import { describe, it, expect } from "vitest";
import astService from "./ast.service.ts";
import * as t from "@babel/types";

describe("ast service", () => {
  it("should parse code to AST", () => {
    const codeExample = `const a: number = 1;`;
    const ast = astService.parseToAst(codeExample);
    expect(ast).toBeDefined();
    expect(ast.type).toBe("File");
  });

  it("should identify function nodes correctly", () => {
    const functionNodes: t.Node[] = [
      t.functionDeclaration(t.identifier("myFunc"), [], t.blockStatement([])),
      t.functionExpression(
        t.identifier("myFuncExpr"),
        [],
        t.blockStatement([])
      ),
      t.arrowFunctionExpression([], t.blockStatement([])),
      t.objectMethod(
        "method",
        t.identifier("myMethod"),
        [],
        t.blockStatement([])
      ),
      t.classMethod(
        "method",
        t.identifier("myClassMethod"),
        [],
        t.blockStatement([])
      ),
      t.classPrivateMethod(
        "method",
        t.privateName(t.identifier("myPrivateMethod")),
        [],
        t.blockStatement([])
      ),
    ];

    functionNodes.forEach((node) => {
      expect(astService.isFunction(node)).toBe(true);
    });
  });

  it("should return false for non-function nodes", () => {
    const nonFunctionNodes: t.Node[] = [
      t.variableDeclaration("const", [
        t.variableDeclarator(t.identifier("a"), t.numericLiteral(1)),
      ]),
      t.expressionStatement(t.stringLiteral("Hello, World!")),
      t.classDeclaration(t.identifier("MyClass"), null, t.classBody([])),
    ];

    nonFunctionNodes.forEach((node) => {
      expect(astService.isFunction(node)).toBe(false);
    });
  });
});
