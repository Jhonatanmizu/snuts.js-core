import { describe, it, expect } from "@jest/globals";

import { OvercommentedTestLogicDetector } from "./overcommentedTestLogic";

import { MAX_COMMENTS_PER_TEST } from "@/shared/constants";
import astService from "@/ast/ast.service";

describe("OvercommentedTestLogicDetector", () => {
  const detector = new OvercommentedTestLogicDetector();
  const filePath = "test-file.ts";

  it("should detect a test with more comments than the threshold", async () => {
    const code = `
      test("overcommented test", () => {
        // comment 1
        // comment 2
        // comment 3
        // comment 4
        // comment 5
        // comment 6
        expect(true).toBe(true);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe(
      `Test has too many comments (6). The maximum allowed is ${MAX_COMMENTS_PER_TEST}.`,
    );
  });

  it("should not detect a test with fewer comments than the threshold", async () => {
    const code = `
      test("clean test", () => {
        // comment 1
        expect(true).toBe(true);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    expect(smells).toHaveLength(0);
  });

  it("should not detect a test with comments equal to the threshold", async () => {
    const code = `
      test("borderline commented test", () => {
        // comment 1
        // comment 2
        // comment 3
        // comment 4
        // comment 5
        expect(true).toBe(true);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    expect(smells).toHaveLength(0);
  });

  it("should detect only the overcommented tests in a file with multiple tests", async () => {
    const code = `
      test("clean test", () => {
        // comment 1
        expect(true).toBe(true);
      });

      test("overcommented test", () => {
        // comment 1
        // comment 2
        // comment 3
        // comment 4
        // comment 5
        // comment 6
        expect(true).toBe(true);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toContain("Test has too many comments (6)");
  });

  it("should not detect a test with no comments", async () => {
    const code = `
      test("no comments test", () => {
        expect(true).toBe(true);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    expect(smells).toHaveLength(0);
  });

  it("should correctly handle leading comments", async () => {
    const code = `
      // comment 1
      // comment 2
      // comment 3
      // comment 4
      // comment 5
      // comment 6
      test("a test with leading comments", () => {
        expect(true).toBe(true);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    expect(smells).toHaveLength(1);
  });
});
