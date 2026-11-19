import { describe, it, expect, beforeEach } from "@jest/globals";

import { MagicNumberTestDetector } from "./magicNumberTestLogic";

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

describe("MagicNumberTestDetector", () => {
  const detector = new MagicNumberTestDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect magic numeric literal in expect matcher", async () => {
    const code = `
      describe('pricing suite', () => {
        it('calculates total price with tax applied', () => {
          const total = calculateTotal(100);
          expect(total).toBe(115);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Magic number detected in assertion: 115");
    expect(smells[0]?.description).toBe("Magic Number Test");
  });

  it("should detect magic numeric literal in assert.strictEqual call", async () => {
    const code = `
      describe('pricing suite', () => {
        it('calculates discount amount for bulk order', () => {
          const discount = computeDiscount();
          assert.strictEqual(discount, 42);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Magic number detected in assertion: 42");
  });

  it("should not flag named constants or exempt numbers (0, 1, -1)", async () => {
    const code = `
      describe('pricing suite', () => {
        it('uses named constants and zero or one', () => {
          const expectedPrice = 115;
          expect(calculateTotal()).toBe(expectedPrice);
          expect(getCount()).toBe(0);
          expect(getUnit()).toBe(1);
          expect(getMissingIndex()).toBe(-1);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
