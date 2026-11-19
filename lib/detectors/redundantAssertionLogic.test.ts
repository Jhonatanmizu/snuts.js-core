import { describe, it, expect, beforeEach } from "@jest/globals";

import { RedundantAssertionDetector } from "./redundantAssertionLogic";

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

describe("RedundantAssertionDetector", () => {
  const detector = new RedundantAssertionDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect expect comparing identical literals or identifiers", async () => {
    const code = `
      describe('redundant suite', () => {
        it('asserts identical literal and variable values', () => {
          const count = computeCount();
          expect(true).toBe(true);
          expect(count).toEqual(count);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedCount = 2;
    expect(smells).toHaveLength(expectedCount);
    expect(smells[0]?.description).toBe("Redundant Assertion");
  });

  it("should detect assert.strictEqual with identical operands", async () => {
    const code = `
      describe('redundant assert suite', () => {
        it('asserts identical strings with assert.strictEqual', () => {
          assert.strictEqual('ok', 'ok');
          assert.ok(true);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedCount = 2;
    expect(smells).toHaveLength(expectedCount);
  });

  it("should not flag assertions comparing distinct expressions or variables", async () => {
    const code = `
      describe('valid assertion suite', () => {
        it('compares computed output with expected value', () => {
          const result = add(1, 0);
          expect(result).toBe(1);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
