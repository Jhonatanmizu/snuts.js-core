import { describe, it, expect, beforeEach } from "@jest/globals";

import { DuplicateAssertDetector } from "./duplicateAssertLogic";

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

describe("DuplicateAssertDetector", () => {
  const detector = new DuplicateAssertDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect identical assertions repeated within the same test case", async () => {
    const code = `
      describe('math suite', () => {
        it('calculates sum of two numbers', () => {
          const sum = 1 + 2;
          expect(sum).toBe(3);
          expect(sum).toBe(3);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.description).toBe("Duplicate Assert");
    expect(smells[0]?.codeBlock).toContain("expect(sum).toBe(3)");
  });

  it("should not flag distinct assertions within the same test case", async () => {
    const code = `
      describe('math suite', () => {
        it('calculates sum and product of two numbers', () => {
          const sum = 1 + 2;
          const product = 1 * 2;
          expect(sum).toBe(3);
          expect(product).toBe(2);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });

  it("should not flag identical assertions across different test cases", async () => {
    const code = `
      describe('math suite', () => {
        it('calculates sum in first scenario', () => {
          expect(add(1, 2)).toBe(3);
        });
        it('calculates sum in second scenario', () => {
          expect(add(1, 2)).toBe(3);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
