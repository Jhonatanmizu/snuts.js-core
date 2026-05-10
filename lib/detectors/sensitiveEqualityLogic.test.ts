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

  it("detects toEqual with toString argument", async () => {
    const code = `expect(a).toEqual(b.toString());`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Sensitive equality involving string conversion detected.");
  });

  it("detects toStrictEqual with toString argument", async () => {
    const code = `expect(a).toStrictEqual(b.toString());`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Sensitive equality involving string conversion detected.");
  });

  it("detects toMatchObject with toString argument", async () => {
    const code = `expect(a).toMatchObject(b.toString());`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Sensitive equality involving string conversion detected.");
  });

  it("detects binary expression with toString call", async () => {
    const code = `const result = a.toString() === b;`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Sensitive equality involving string conversion detected.");
  });

  it("does not flag clean toBe assertion", async () => {
    const code = `expect(1).toBe(1);`;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("counts mixed flagged and clean assertions correctly", async () => {
    const code = `
      expect(a).toEqual(b.toString());
      expect(x).toStrictEqual(y.toString());
      expect(1).toBe(1);
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 2;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });
});
