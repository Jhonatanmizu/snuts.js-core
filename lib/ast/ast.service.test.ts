import { describe, it, expect } from "vitest";
import astService from "./ast.service.ts";
import { AstNodeBuilder } from "../test/builders/astNodeBuilder.ts";
import { Node } from "@babel/types";

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
    const functionNodes = [
      ["function declaration", AstNodeBuilder.functionDeclaration()],
      ["function expression", AstNodeBuilder.functionExpression()],
      ["arrow function", AstNodeBuilder.arrowFunction()],
      ["object method", AstNodeBuilder.objectMethod()],
      ["class method", AstNodeBuilder.classMethod()],
      ["private class method", AstNodeBuilder.classPrivateMethod()],
    ];

    const nonFunctionNodes = [
      ["variable declaration", AstNodeBuilder.variableDeclaration()],
      ["string expression", AstNodeBuilder.expressionStatement()],
      ["class declaration", AstNodeBuilder.classDeclaration()],
    ];

    it.each(functionNodes)("should return true for %s", (...args) => {
      const [_, node] = args as [string, Node];
      expect(astService.isFunction(node)).toBe(true);
    });

    it.each(nonFunctionNodes)("should return false for %s", (...args) => {
      const [_, node] = args as [string, Node];
      expect(astService.isFunction(node)).toBe(false);
    });
  });
});
