import { describe, it, expect, beforeEach } from "@jest/globals";

import { NonFunctionalStatementDetector } from "./nonFunctionalStatementLogic";

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

describe("NonFunctionalStatementDetector", () => {
  const detector = new NonFunctionalStatementDetector();
  const filePath = "empty-block.test.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("reports empty block without comments", async () => {
    const code = `
      function unused() {}
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Empty block without explanatory comments detected.");
  });

  it("does not report empty block with inner comment", async () => {
    const code = `
      function unused() {
        /* intentional */
      }
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("mixed blocks one commented one not", async () => {
    const code = `
      function withComment() {
        /* intentional */
      }
      function withoutComment() {}
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });
});
