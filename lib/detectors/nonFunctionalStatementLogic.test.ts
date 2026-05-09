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

  it("reports an empty block without comments", async () => {
    const code = `
      function unused() {}
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells.length).toBeGreaterThanOrEqual(1);
    expect(smells[0]?.message).toContain("Empty block");
  });

  it("does not report an empty block that has a leading comment", async () => {
    const code = `
      function unused() {
        /* intentional */
      }
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const emptyWithoutComment = smells.filter((s) => s.codeBlock === "{}");
    expect(emptyWithoutComment).toHaveLength(0);
  });
});
