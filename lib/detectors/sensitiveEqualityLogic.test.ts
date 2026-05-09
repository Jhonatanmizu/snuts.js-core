import { describe, it, expect, beforeEach } from "@jest/globals";

import { SensitiveEqualityDetector } from "./sensitiveEqualityLogic";

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

describe("SensitiveEqualityDetector", () => {
  const detector = new SensitiveEqualityDetector();
  const filePath = "sensitive.test.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("detects matcher using toString() as argument", async () => {
    const code = `expect(a).toEqual(b.toString());`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells.length).toBeGreaterThanOrEqual(1);
    expect(smells[0]?.message).toContain("Sensitive equality");
  });

  it("does not flag expect(1).toBe(1)", async () => {
    const code = `expect(1).toBe(1);`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
