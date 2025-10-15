import { describe, it, expect } from "vitest";
import astService from "./ast.service.ts";
import * as t from "@babel/types";

describe("astService", () => {
  describe("parseToAst()", () => {
    it("should parse valid TypeScript code into a File AST", () => {
      const code = `const a: number = 1;`;

      const ast = astService.parseToAst(code);

      expect(ast).toBeDefined();
      expect(ast.type).toBe("File");
    });

    it("should throw an error for invalid syntax", () => {
      const invalidCode = `const = ;`;
      expect(() => astService.parseToAst(invalidCode)).toThrow();
    });
  });

  describe("isFunction()", () => {
    const functionNodes: [string, t.Node][] = [
      [
        "function declaration",
        t.functionDeclaration(t.identifier("myFunc"), [], t.blockStatement([])),
      ],
      [
        "function expression",
        t.functionExpression(
          t.identifier("myFuncExpr"),
          [],
          t.blockStatement([])
        ),
      ],
      ["arrow function", t.arrowFunctionExpression([], t.blockStatement([]))],
      [
        "object method",
        t.objectMethod(
          "method",
          t.identifier("myMethod"),
          [],
          t.blockStatement([])
        ),
      ],
      [
        "class method",
        t.classMethod(
          "method",
          t.identifier("myClassMethod"),
          [],
          t.blockStatement([])
        ),
      ],
      [
        "private class method",
        t.classPrivateMethod(
          "method",
          t.privateName(t.identifier("myPrivateMethod")),
          [],
          t.blockStatement([])
        ),
      ],
    ];

    const nonFunctionNodes: [string, t.Node][] = [
      [
        "variable declaration",
        t.variableDeclaration("const", [
          t.variableDeclarator(t.identifier("a"), t.numericLiteral(1)),
        ]),
      ],
      [
        "string expression",
        t.expressionStatement(t.stringLiteral("Hello, World!")),
      ],
      [
        "class declaration",
        t.classDeclaration(t.identifier("MyClass"), null, t.classBody([])),
      ],
    ];

    it.each(functionNodes)("should return true for %s", (_, node) => {
      expect(astService.isFunction(node)).toBe(true);
    });

    it.each(nonFunctionNodes)("should return false for %s", (_, node) => {
      expect(astService.isFunction(node)).toBe(false);
    });
  });
});
