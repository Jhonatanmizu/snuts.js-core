import { describe, it, expect, beforeEach } from "@jest/globals";

import { IgnoredTestDetector } from "./ignoredTestLogic";

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

describe("IgnoredTestDetector", () => {
  const detector = new IgnoredTestDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect it.skip, test.skip, describe.skip, and it.todo calls", async () => {
    const code = `
      describe.skip('skipped suite', () => {
        it.skip('skipped test case', () => {
          expect(1).toBe(1);
        });
        test.skip('another skipped test case', () => {
          expect(1).toBe(1);
        });
        it.todo('planned test case for future');
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedCount = 4;
    expect(smells).toHaveLength(expectedCount);
    expect(smells.map((s) => s.message)).toEqual([
      "Ignored test API detected: describe.skip",
      "Ignored test API detected: it.skip",
      "Ignored test API detected: test.skip",
      "Ignored test API detected: it.todo",
    ]);
  });

  it("should detect standalone xit, xtest, and xdescribe aliases", async () => {
    const code = `
      xdescribe('disabled suite', () => {
        xit('disabled spec with xit', () => {
          expect(1).toBe(1);
        });
        xtest('disabled spec with xtest', () => {
          expect(1).toBe(1);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedCount = 3;
    expect(smells).toHaveLength(expectedCount);
    expect(smells.map((s) => s.message)).toEqual([
      "Ignored test API detected: xdescribe",
      "Ignored test API detected: xit",
      "Ignored test API detected: xtest",
    ]);
  });

  it("should not flag active describe and it blocks", async () => {
    const code = `
      describe('active suite', () => {
        it('runs normal verification logic', () => {
          expect(1).toBe(1);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
