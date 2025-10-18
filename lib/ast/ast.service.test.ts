import { describe, it, expect } from "vitest";
import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { AstNodeBuilder } from "@/test/builders/astNodeBuilder";

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
      const [, node] = args as [string, t.Node];
      expect(astService.isFunction(node)).toBe(true);
    });

    it.each(nonFunctionNodes)("should return false for %s", (...args) => {
      const [, node] = args as [string, t.Node];
      expect(astService.isFunction(node)).toBe(false);
    });
  });

  describe("hasManyComments()", () => {
    it("should return true if node has more than maxComments comments", () => {
      const node = AstNodeBuilder.functionDeclaration("withComments");
      node.leadingComments = [
        { type: "CommentLine", value: " Comment 1" },
        { type: "CommentLine", value: " Comment 2" },
        { type: "CommentLine", value: " Comment 3" },
      ];

      expect(astService.hasManyComments(node, 2)).toBe(true);
    });

    it("should return false if node has comments equal to or less than maxComments", () => {
      const node = AstNodeBuilder.functionDeclaration("withFewComments");
      node.leadingComments = [{ type: "CommentLine", value: " Comment 1" }];

      expect(astService.hasManyComments(node, 2)).toBe(false);
    });

    it("should return false for nodes without comments", () => {
      const node = AstNodeBuilder.functionDeclaration("noComments");
      expect(astService.hasManyComments(node, 0)).toBe(false);
    });
  });

  describe("isTestCase()", () => {
    const testCases = [
      "it('should do something', () => {});",
      "test('should do something', () => {});",
      "it.skip('should do something', () => {});",
      "it.only('should do something', () => {});",
      "test.skip('should do something', () => {});",
      "test.only('should do something', () => {});",
    ];

    it.each(testCases)("should return true for test case '%s'", (code) => {
      const testNode = astService.getTestNodeAst(code);
      expect(testNode).toBeDefined();
      expect(astService.isTestCase(testNode!)).toBe(true);
    });

    it("should return false for a non-test case node", () => {
      const code = `const a = 1;`;
      const ast = astService.parseToAst(code);
      const variableNode = ast.program.body[0];

      expect(astService.isTestCase(variableNode!)).toBe(false);
    });

    it("should return false for null node", () => {
      expect(astService.isTestCase(null as unknown as t.Node)).toBe(false);
    });
  });

  describe("isHook()", () => {
    const hookCases = [
      "beforeEach(() => {});",
      "beforeAll(() => {});",
      "afterEach(() => {});",
      "afterAll(() => {});",
    ];

    it.each(hookCases)("should return true for hook '%s'", (code) => {
      const ast = astService.parseToAst(code);
      const hookNode = ast.program.body[0];
      expect(astService.isHook(hookNode!)).toBe(true);
    });

    it("should return false for a non-hook node", () => {
      const code = `const a = 1;`;
      const ast = astService.parseToAst(code);
      const node = ast.program.body[0];
      expect(astService.isHook(node!)).toBe(false);
    });
  });

  describe("isDescribe()", () => {
    const describeCases = [
      "describe('my suite', () => {});",
      "describe.skip('my suite', () => {});",
      "describe.only('my suite', () => {});",
    ];

    it.each(describeCases)("should return true for describe block '%s'", (code) => {
      const describeNode = astService.getDescribeNodeAst(code);
      expect(describeNode).toBeDefined();
      expect(astService.isDescribe(describeNode!)).toBe(true);
    });

    it("should return false for a non-describe block", () => {
      const code = `const a = 1;`;
      const ast = astService.parseToAst(code);
      const node = ast.program.body[0];
      expect(astService.isDescribe(node!)).toBe(false);
    });
  });
});
