import { describe, it, expect, beforeEach } from "@jest/globals";

import { ConditionalTestLogicDetector } from "./conditionalTestLogic";

import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";

jest.mock("@/shared/logger", () => ({
  __esModule: true,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("ConditionalTestLogicDetector", () => {
  const detector = new ConditionalTestLogicDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.warn as jest.Mock).mockClear();
  });

  it("should detect if statement inside a test case", async () => {
    const code = `
      describe('my suite', () => {
        it('my test', () => {
          if (true) {
            expect(true).toBe(true);
          }
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Conditional logic inside test case detected: IfStatement");
    expect(smells[0]?.file).toBe(filePath);
    expect(smells[0]?.start.line).toBe(4);
    expect(smells[0]?.codeBlock).toContain("if (true)");
  });

  it("should detect switch statement inside a test case", async () => {
    const code = `
      describe('my suite', () => {
        it('my test', () => {
          switch (true) {
            case true:
              expect(true).toBe(true);
          }
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Conditional logic inside test case detected: SwitchStatement");
    expect(smells[0]?.file).toBe(filePath);
    expect(smells[0]?.start.line).toBe(4);
    expect(smells[0]?.codeBlock).toContain("switch (true)");
  });

  it("should not detect conditional logic outside a test case", async () => {
    const code = `
      if (true) {
        describe('my suite', () => {
          it('my test', () => {
            expect(true).toBe(true);
          });
        });
      }
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("should not detect conditional logic if none exists", async () => {
    const code = `
      describe('my suite', () => {
        it('my test', () => {
          expect(true).toBe(true);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("should handle multiple conditional logic blocks inside a test case", async () => {
    const code = `
      describe('my suite', () => {
        it('my test', () => {
          if (true) {
            expect(true).toBe(true);
          }
          if (false) {
            // another one
          }
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedNumberOfSmells = 2;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Conditional logic inside test case detected: IfStatement");
    expect(smells[1]?.message).toBe("Conditional logic inside test case detected: IfStatement");
  });

  it("should handle nested conditional logic inside a test case", async () => {
    const code = `
      describe('my suite', () => {
        it('my test', () => {
          if (true) {
            if (false) {
              expect(true).toBe(true);
            }
          }
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 2;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Conditional logic inside test case detected: IfStatement");
    expect(smells[1]?.message).toBe("Conditional logic inside test case detected: IfStatement");
  });

  it("should detect for, for-of, for-in, while, and do-while loops inside a test case", async () => {
    const code = `
      describe('loop suite', () => {
        it('should detect loops inside test', () => {
          for (let i = 0; i < 2; i++) {
            expect(i).toBeDefined();
          }
          for (const item of [1, 2]) {
            expect(item).toBeDefined();
          }
          for (const key in { a: 1 }) {
            expect(key).toBeDefined();
          }
          while (false) {
            expect(1).toBe(1);
          }
          do {
            expect(1).toBe(1);
          } while (false);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedCount = 5;
    expect(smells).toHaveLength(expectedCount);
    expect(smells.map((s) => s.message)).toEqual([
      "Conditional logic inside test case detected: ForStatement",
      "Conditional logic inside test case detected: ForOfStatement",
      "Conditional logic inside test case detected: ForInStatement",
      "Conditional logic inside test case detected: WhileStatement",
      "Conditional logic inside test case detected: DoWhileStatement",
    ]);
  });

  it("should detect ternary conditional expressions and member-expression test calls", async () => {
    const code = `
      describe('parameterized suite', () => {
        it.each([1, 2])('checks value %s correctly', (val) => {
          const result = val > 1 ? 'high' : 'low';
          expect(result).toBeDefined();
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe(
      "Conditional logic inside test case detected: ConditionalExpression",
    );
  });
});
