import { describe, it, expect, beforeEach } from "@jest/globals";

import { LazyTestDetector } from "./lazyTestLogic";

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

describe("LazyTestDetector", () => {
  const detector = new LazyTestDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect multiple tests in a suite invoking the exact same single SUT method", async () => {
    const code = `
      describe('calculator suite', () => {
        it('adds positive numbers using calculator instance', () => {
          const calc = new Calculator();
          expect(calc.add(1, 2)).toBe(3);
        });

        it('adds negative numbers using calculator instance', () => {
          const calc = new Calculator();
          expect(calc.add(-1, -2)).toBe(-3);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedCount = 2;
    expect(smells).toHaveLength(expectedCount);
    expect(smells[0]?.message).toBe(
      'Lazy test detected: multiple tests invoke the same single method "calc.add".',
    );
    expect(smells[0]?.description).toBe("Lazy Test");
  });

  it("should not flag tests that invoke distinct methods on the SUT", async () => {
    const code = `
      describe('calculator suite', () => {
        it('adds numbers using calculator instance', () => {
          const calc = new Calculator();
          expect(calc.add(1, 2)).toBe(3);
        });

        it('subtracts numbers using calculator instance', () => {
          const calc = new Calculator();
          expect(calc.subtract(5, 2)).toBe(3);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
