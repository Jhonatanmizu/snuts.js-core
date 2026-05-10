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
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toContain("setup/teardown");
  });

  it("detects expect() inside beforeAll", async () => {
    const code = `
      beforeAll(() => {
        expect(db.isConnected()).toBe(true);
      });
      it('x', () => { expect(1).toBe(1); });
    `;
    const ast = astService.parseToAst(code, filePath);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toContain("setup/teardown");
  });

  it("detects expect() inside afterEach", async () => {
    const code = `
      afterEach(() => {
        expect(cleanup()).toBe(true);
      });
      it('x', () => { expect(1).toBe(1); });
    `;
    const ast = astService.parseToAst(code, filePath);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
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
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("mixed hooks only one smell", async () => {
    const code = `
      let result;
      beforeEach(() => {
        expect(setup()).toBe(true);
      });
      afterAll(() => {
        result = null;
      });
      it('x', () => { expect(1).toBe(1); });
    `;
    const ast = astService.parseToAst(code, filePath);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });
});
