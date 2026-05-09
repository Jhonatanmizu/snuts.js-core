import { describe, it, expect, beforeEach } from "@jest/globals";

import { OnlyTestDetector } from "./onlyTestLogic";

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

describe("OnlyTestDetector", () => {
  const detector = new OnlyTestDetector();
  const filePath = "only.test.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("detects it.only", async () => {
    const code = `it.only('focused', () => { expect(1).toBe(1); });`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toContain("it.only");
  });

  it("does not flag a normal it()", async () => {
    const code = `it('normal', () => { expect(1).toBe(1); });`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
