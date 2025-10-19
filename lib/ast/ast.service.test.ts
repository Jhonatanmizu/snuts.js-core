import { describe, it, expect, beforeAll } from "vitest";
import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { AstNodeBuilder } from "@/test/builders/astNodeBuilder";

describe("astService", () => {
  // beforeAll(async () => {

  // });

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

  describe("isTestCase", () => {
    it("should return true for a valid test case", () => {
      const code = `it("is a test", () => {});`;
      const ast = astService.parseToAst(code);
      let isTest = false;
      astService.traverse(ast, {
        CallExpression(path) {
          if (astService.isTestCase(path.node)) {
            isTest = true;
          }
        },
      });
      expect(isTest).toBe(true);
    });

    it("should return false for a non-test case", () => {
      const code = `const a = 1;`;
      const ast = astService.parseToAst(code);
      let isTest = false;
      astService.traverse(ast, {
        CallExpression(path) {
          if (astService.isTestCase(path.node)) {
            isTest = true;
          }
        },
      });
      expect(isTest).toBe(false);
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

  describe("isDescribe", () => {
    it("should return true for a valid describe block", () => {
      const code = `describe("a suite", () => {});`;
      const ast = astService.parseToAst(code);
      let isDescribe = false;
      astService.traverse(ast, {
        CallExpression(path) {
          if (astService.isDescribe(path.node)) {
            isDescribe = true;
          }
        },
      });
      expect(isDescribe).toBe(true);
    });

    it("should return false for a non-describe block", () => {
      const code = `const a = 1;`;
      const ast = astService.parseToAst(code);
      let isDescribe = false;
      astService.traverse(ast, {
        CallExpression(path) {
          if (astService.isDescribe(path.node)) {
            isDescribe = true;
          }
        },
      });
      expect(isDescribe).toBe(false);
    });
  });
});
