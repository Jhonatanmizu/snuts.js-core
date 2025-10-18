import { describe, it, expect } from "vitest";

import { ConditionalTestLogicDetector } from "./conditionalTestLogic";

import astService from "@/ast/ast.service";

describe("ConditionalTestLogicDetector", () => {
  const detector = new ConditionalTestLogicDetector();
  const filePath = "test-file.ts";

  it("should detect conditional logic inside a test case", async () => {
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
    expect(smells[0]?.message).toBe("Conditional test logic detected");
    expect(smells[0]?.file).toBe(filePath);
    expect(smells[0]?.start.line).toBe(4);
    expect(smells[0]?.codeBlock).toContain("if (true)");
  });

  it("should detect conditional logic outside a test case but inside a describe block", async () => {
    const code = `
      describe('my suite', () => {
        if (true) {
          it('my test', () => {
            expect(true).toBe(true);
          });
        }
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Conditional logic outside of test case detected");
    expect(smells[0]?.file).toBe(filePath);
    expect(smells[0]?.start.line).toBe(3);
    expect(smells[0]?.codeBlock).toContain("if (true)");
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

    expect(smells).toHaveLength(0);
  });

  it("should handle multiple conditional logic blocks", async () => {
    const code = `
      describe('my suite', () => {
        if (false) {
          // outside test case
        }
        it('my test', () => {
          if (true) {
            expect(true).toBe(true);
          }
        });
        if (1 === 1) {
          // outside test case
        }
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(3);
    expect(smells.filter((s) => s.message === "Conditional test logic detected")).toHaveLength(1);
    expect(
      smells.filter((s) => s.message === "Conditional logic outside of test case detected"),
    ).toHaveLength(2);
  });

  it("should handle nested conditional logic", async () => {
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

    expect(smells).toHaveLength(2);
    expect(smells[0]?.message).toBe("Conditional test logic detected");
    expect(smells[1]?.message).toBe("Conditional test logic detected");
  });
});
