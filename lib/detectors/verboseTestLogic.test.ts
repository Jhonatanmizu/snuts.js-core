import { describe, it, expect, beforeEach } from "@jest/globals";

import { VerboseTestDetector } from "./verboseTestLogic";

import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";
import { VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD } from "@/shared/constants";

jest.mock("@/shared/logger", () => ({
  __esModule: true,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("VerboseTestDetector", () => {
  const detector = new VerboseTestDetector();
  const filePath = "verbose.test.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("flags a block over the statement threshold", async () => {
    const statements = Array.from(
      { length: VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD + 1 },
      (_, i) => `const v${i} = ${i};`,
    ).join("\n");
    const code = `
      describe('big', () => {
        it('long test', () => {
          ${statements}
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe(
      `Verbose block detected (${VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD + 1} statements; threshold ${VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD}).`,
    );
  });

  it("ignores a block within the statement threshold", async () => {
    const code = `
      it('short test', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("does not flag a block at exactly the threshold", async () => {
    const statements = Array.from(
      { length: VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD },
      (_, i) => `const v${i} = ${i};`,
    ).join("\n");
    const code = `
      it('at threshold test', () => {
        ${statements}
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("counts only the over-threshold block in a mixed snippet", async () => {
    const atThresholdStatements = Array.from(
      { length: VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD },
      (_, i) => `const a${i} = ${i};`,
    ).join("\n");
    const overThresholdStatements = Array.from(
      { length: VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD + 1 },
      (_, i) => `const b${i} = ${i};`,
    ).join("\n");
    const code = `
      describe('mixed suite', () => {
        it('at threshold', () => {
          ${atThresholdStatements}
        });
        it('over threshold', () => {
          ${overThresholdStatements}
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });
});
