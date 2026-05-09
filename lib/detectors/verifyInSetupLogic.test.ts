import { describe, it, expect, beforeEach } from "@jest/globals";

import { VerifyInSetupDetector } from "./verifyInSetupLogic";

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

describe("VerifyInSetupDetector", () => {
  const detector = new VerifyInSetupDetector();
  const filePath = "setup-assert.test.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("detects expect() inside beforeEach", async () => {
    const code = `
      beforeEach(() => {
        expect(setup()).toBe(true);
      });
      it('x', () => { expect(1).toBe(1); });
    `;
    const ast = astService.parseToAst(code, filePath);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toContain("setup/teardown");
  });

  it("does not flag hooks with only assignment", async () => {
    const code = `
      let x;
      beforeEach(() => {
        x = 1;
      });
      it('x', () => { expect(x).toBe(1); });
    `;
    const ast = astService.parseToAst(code, filePath);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
