import astService from "../ast/ast.service";

import { CommentsOnlyLogicTestDetector } from "./commentsOnlyTestLogic";

describe("CommentsOnlyLogicTestDetector", () => {
  let detector: CommentsOnlyLogicTestDetector;

  beforeEach(() => {
    detector = new CommentsOnlyLogicTestDetector();
  });

  it("should detect a test with only comments", async () => {
    const code = `
      test('should be a smell', () => {
        // This is a comment
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, "test.js");
    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Test case with only comments or empty body detected.");
  });

  it("should detect a test with a commented out assertion", async () => {
    const code = `
      test('should be a smell', () => {
        // expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, "test.js");
    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Test case with only comments or empty body detected.");
  });

  it("should detect an empty test body", async () => {
    const code = `
      test('should be a smell', () => {});
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, "test.js");
    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Test case with only comments or empty body detected.");
  });

  it("should not detect a test with code and comments", async () => {
    const code = `
      test('should not be a smell', () => {
        // This is a comment
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, "test.js");
    expect(smells).toHaveLength(0);
  });

  it("should not detect a regular test case without comments", async () => {
    const code = `
      test('should not be a smell', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, "test.js");
    expect(smells).toHaveLength(0);
  });
});
