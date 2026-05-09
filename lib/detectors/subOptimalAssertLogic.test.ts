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

  it("flags expect(undefined).toBe(undefined)", async () => {
    const code = `expect(undefined).toBe(undefined);`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
  });

  it("flags expect(x > y) binary inside expect", async () => {
    const code = `expect(a > b);`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
  });

  it("does not flag expect(1).toBe(1)", async () => {
    const code = `expect(1).toBe(1);`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
