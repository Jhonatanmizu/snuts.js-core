import { AnonymousTestLogicDetector } from "./anonymousTestLogic";

import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";
import { ANONYMOUS_TEST_MAX_DESCRIPTION_WORD_COUNT } from "@/shared/constants";

jest.mock("@/shared/logger", () => ({
  __esModule: true,
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe("AnonymousTestLogicDetector", () => {
  const detector = new AnonymousTestLogicDetector();
  const filePath = "test.js";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect a test with an empty description", async () => {
    const code = `
      test('', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Anonymous test case detected.");
  });

  it("should detect a test with a whitespace description", async () => {
    const code = `
      it('   ', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Anonymous test case detected.");
  });

  it("should detect a test with a two-word description", async () => {
    const code = `
      test('two words', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe("Anonymous test case detected.");
  });

  it("should not detect a test with a proper description", async () => {
    const code = `
      test('should do something', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("should handle multiple test cases", async () => {
    const code = `
      describe('my suite', () => {
        test('should do something', () => {
          expect(1).toBe(1);
        });

        it('', () => {
            expect(true).toBe(true);
        });

        test(' ', () => {
            expect(false).toBe(false);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 2;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("flags description at exact word count boundary", async () => {
    // Build a description with exactly ANONYMOUS_TEST_MAX_DESCRIPTION_WORD_COUNT words
    const words = Array.from(
      { length: ANONYMOUS_TEST_MAX_DESCRIPTION_WORD_COUNT },
      (_, i) => `word${i}`,
    );
    const description = words.join(" ");
    const code = `
      it('${description}', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("does not flag description one word above boundary", async () => {
    // Build a description with exactly ANONYMOUS_TEST_MAX_DESCRIPTION_WORD_COUNT + 1 words
    const words = Array.from(
      { length: ANONYMOUS_TEST_MAX_DESCRIPTION_WORD_COUNT + 1 },
      (_, i) => `word${i}`,
    );
    const description = words.join(" ");
    const code = `
      it('${description}', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });
});
