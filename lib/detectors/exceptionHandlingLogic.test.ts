import { describe, it, expect, beforeEach } from "@jest/globals";

import { ExceptionHandlingDetector } from "./exceptionHandlingLogic";

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

describe("ExceptionHandlingDetector", () => {
  const detector = new ExceptionHandlingDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect try-catch statement inside a test case", async () => {
    const code = `
      describe('parser suite', () => {
        it('handles invalid input manually with try-catch', () => {
          try {
            parseInvalid();
          } catch (err) {
            expect(err).toBeDefined();
          }
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe(
      "Manual exception handling inside test case detected: TryStatement",
    );
    expect(smells[0]?.description).toBe("Exception Handling");
  });

  it("should detect direct throw statement inside a test case body", async () => {
    const code = `
      describe('parser suite', () => {
        it('throws an error directly inside test body', () => {
          throw new Error('unexpected failure');
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe(
      "Manual exception handling inside test case detected: ThrowStatement",
    );
  });

  it("should not flag throw statement inside expect(() => { throw ... }).toThrow()", async () => {
    const code = `
      describe('parser suite', () => {
        it('uses framework matcher to verify thrown errors', () => {
          expect(() => {
            throw new Error('expected');
          }).toThrow('expected');
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
