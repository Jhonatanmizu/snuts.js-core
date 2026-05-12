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

  it("detects it.only focused test", async () => {
    const code = `it.only('focused', () => { expect(1).toBe(1); });`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toContain("it.only");
  });

  it("detects test.only focused test", async () => {
    const code = `test.only('focused test', () => { expect(2).toBe(2); });`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toContain("test.only");
  });

  it("detects describe.only focused block", async () => {
    const code = `describe.only('focused suite', () => { it('inner', () => { expect(1).toBe(1); }); });`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toContain("describe.only");
  });

  it("does not flag normal it()", async () => {
    const code = `it('normal test', () => { expect(1).toBe(1); });`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("counts only focused tests in mixed snippet", async () => {
    const code = `
      it.only('focused it', () => { expect(1).toBe(1); });
      test.only('focused test', () => { expect(2).toBe(2); });
      it('clean test', () => { expect(3).toBe(3); });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 2;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });
});
