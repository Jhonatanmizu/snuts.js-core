import { describe, it, expect } from "vitest";

import detectConditionalTestLogic from "./conditionalTestLogic";

import astService from "@/ast/ast.service";

describe("detectConditionalTestLogic", () => {
  it("should return an empty array when there are no if statements", () => {
    const code = `it('should do something', () => {
      expect(true).toBe(true);
    });`;
    const ast = astService.parseToAst(code);
    const smells = detectConditionalTestLogic(ast, code);
    expect(smells).toEqual([]);
  });

  it("should detect a single if statement and return testInfo", () => {
    const code = `it('should do something', () => {
      if (true) {
        expect(true).toBe(true);
      }
    });`;
    const ast = astService.parseToAst(code);
    const smells = detectConditionalTestLogic(ast, code);
    expect(smells).toHaveLength(1);
    expect(smells[0]?.startLine).toBe(2);
    expect(smells[0]?.endLine).toBe(4);
    expect(smells[0]?.testInfo?.name).toBe("should do something");
    expect(smells[0]?.codeBlock).toContain("if (true)");
  });

  it("should detect multiple if statements", () => {
    const code = `it('should do something', () => {
      if (true) {
        expect(true).toBe(true);
      }
      if (false) {
        expect(false).toBe(false);
      }
    });`;
    const ast = astService.parseToAst(code);
    const smells = detectConditionalTestLogic(ast, code);
    expect(smells).toHaveLength(2);
    expect(smells[0]?.startLine).toBe(2);
    expect(smells[0]?.endLine).toBe(4);
    expect(smells[1]?.startLine).toBe(5);
    expect(smells[1]?.endLine).toBe(7);
    expect(smells[0]?.testInfo?.name).toBe("should do something");
    expect(smells[1]?.testInfo?.name).toBe("should do something");
  });

  it("should detect nested if statements", () => {
    const code = `it('should do something', () => {
      if (true) {
        if (false) {
          expect(true).toBe(true);
        }
      }
    });`;
    const ast = astService.parseToAst(code);
    const smells = detectConditionalTestLogic(ast, code);
    expect(smells).toHaveLength(2);
    expect(smells[0]?.startLine).toBe(2);
    expect(smells[0]?.endLine).toBe(6);
    expect(smells[1]?.startLine).toBe(3);
    expect(smells[1]?.endLine).toBe(5);
    expect(smells[0]?.testInfo?.name).toBe("should do something");
    expect(smells[1]?.testInfo?.name).toBe("should do something");
  });

  it("should return null for testInfo if not inside a test case", () => {
    const code = `
      if (true) {
        console.log('hello');
      }
    `;
    const ast = astService.parseToAst(code);
    const smells = detectConditionalTestLogic(ast, code);
    expect(smells).toHaveLength(1);
    expect(smells[0]?.testInfo).toBeNull();
  });
});
