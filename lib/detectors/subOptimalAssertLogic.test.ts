import { describe, it, expect, beforeEach } from "@jest/globals";

import { SubOptimalAssertDetector } from "./subOptimalAssertLogic";

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

describe("SubOptimalAssertDetector", () => {
  const detector = new SubOptimalAssertDetector();
  const filePath = "suboptimal.test.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("flags expect(undefined).toBe(undefined) with correct message", async () => {
    const code = `expect(undefined).toBe(undefined);`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Suboptimal assertion pattern detected.");
  });

  it("flags dot-length pattern expect(arr.length).toBe(0)", async () => {
    const code = `expect(arr.length).toBe(0);`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Suboptimal assertion pattern detected.");
  });

  it("flags expect(x).not.toBe(undefined) pattern", async () => {
    const code = `expect(x).not.toBe(undefined);`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Suboptimal assertion pattern detected.");
  });

  it("flags binary expression inside expect call", async () => {
    const code = `expect(a > b);`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Suboptimal assertion pattern detected.");
  });

  it("does not flag clean expect(1).toBe(1)", async () => {
    const code = `expect(1).toBe(1);`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("counts all three flagged patterns mixed with clean assertion", async () => {
    const code = `
      expect(arr.length).toBe(0);
      expect(x).not.toBe(undefined);
      expect(a > b);
      expect(1).toBe(1);
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedNumberOfSmells = 3;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });
});
