import { beforeEach, describe, expect, it } from "@jest/globals";

import { DetectorTestWithoutDescriptionLogic } from "./testWithoutDescriptionLogic";

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

describe("TestWithoutDescriptionLogic", () => {
  const filePath = "testFile.js";
  const detector = new DetectorTestWithoutDescriptionLogic();

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect test cases with missing description argument", async () => {
    const code = `
      describe('suite', () => {
        it(() => {
          expect(true).toBe(true);
        });

        test(() => {
          expect(true).toBe(true);
        });

        it('has clear description', () => {
          expect(true).toBe(true);
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 2;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Test case without description detected");
    expect(smells[1]?.message).toBe("Test case without description detected");
    expect(smells[0]?.codeBlock).toContain("it(() =>");
  });

  it("should detect test cases with non-string description", async () => {
    const code = `
      describe('suite', () => {
        it(123, () => {
          expect(true).toBe(true);
        });

        it({}, () => {
          expect(true).toBe(true);
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 2;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Test case without description detected");
    expect(smells[1]?.message).toBe("Test case without description detected");
  });

  it("should detect test cases with empty description", async () => {
    const code = `
      describe('suite', () => {
        it('', () => {
          expect(true).toBe(true);
        });

        it('single', () => {
          expect(true).toBe(true);
        });

        it('two words', () => {
          expect(true).toBe(true);
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;

    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Test case without description detected");
  });

  it("should not report when descriptions are valid", async () => {
    const code = `
      describe('suite', () => {
        it('valid description', () => {
          expect(true).toBe(true);
        });

        test('another valid case', () => {
          expect(true).toBe(true);
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("should ignore non-runnable test aliases without callback", async () => {
    const code = `
      describe('suite', () => {
        test.todo('todo item');
        it.skip('skipped test');
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });
});
