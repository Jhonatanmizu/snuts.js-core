import { describe, it, expect, beforeEach } from "@jest/globals";

import { AssertionRouletteDetector } from "./assertionRouletteLogic";

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

describe("AssertionRouletteDetector", () => {
  const detector = new AssertionRouletteDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect multiple assert calls missing explanatory messages", async () => {
    const code = `
      describe('calculator suite', () => {
        it('verifies addition and subtraction results', () => {
          assert.strictEqual(add(1, 2), 3);
          assert.strictEqual(sub(5, 2), 3);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedSmells = 2;
    expect(smells).toHaveLength(expectedSmells);
    expect(smells[0]?.description).toBe("Assertion Roulette");
  });

  it("should detect unexplained expect calls when mixed with explained expect calls", async () => {
    const code = `
      describe('calculator suite', () => {
        it('verifies addition and multiplication results', () => {
          expect(add(1, 2), 'addition should equal 3').toBe(3);
          expect(mul(2, 3)).toBe(6);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.codeBlock).toContain("expect(mul(2, 3)).toBe(6)");
  });

  it("should not flag a test when all multiple assertions include messages", async () => {
    const code = `
      describe('calculator suite', () => {
        it('verifies addition and subtraction with messages', () => {
          assert.strictEqual(add(1, 2), 3, 'addition failed');
          assert.strictEqual(sub(5, 2), 3, 'subtraction failed');
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });

  it("should not flag a test with only a single assertion", async () => {
    const code = `
      describe('calculator suite', () => {
        it('verifies single addition operation', () => {
          assert.strictEqual(add(1, 2), 3);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
