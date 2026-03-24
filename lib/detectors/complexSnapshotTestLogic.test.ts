import { describe, it, expect } from "@jest/globals";

import { ComplexSnapshotTestLogicDetector } from "./complexSnapshotTestLogic";

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

/** Generates a template literal body with the given number of newlines */
function snapshotBody(lines: number): string {
  return Array.from({ length: lines }, (_, i) => `  line${i + 1}: "value"`).join("\n");
}

describe("ComplexSnapshotTestLogicDetector", () => {
  const detector = new ComplexSnapshotTestLogicDetector();
  const filePath = "test-file.ts";

  describe("inline snapshots", () => {
    it("should detect an inline snapshot exceeding 50 lines", async () => {
      const body = snapshotBody(51);
      const code = `
it('my test', () => {
  expect(result).toMatchInlineSnapshot(\`
${body}
  \`);
});
      `.trim();

      const ast = astService.parseToAst(code);
      const smells = await detector.detect(ast, code, filePath);

      expect(smells).toHaveLength(1);
      expect(smells[0]?.message).toContain("inline");
      expect(smells[0]?.message).toContain("50 lines");
      expect(smells[0]?.file).toBe(filePath);
      expect(smells[0]?.codeBlock).toContain("toMatchInlineSnapshot");
    });

    it("should not detect an inline snapshot at exactly 50 lines", async () => {
      const body = snapshotBody(49);
      const code = `
it('my test', () => {
  expect(result).toMatchInlineSnapshot(\`
${body}
  \`);
});
      `.trim();

      const ast = astService.parseToAst(code);
      const smells = await detector.detect(ast, code, filePath);

      expect(smells).toHaveLength(0);
    });

    it("should not detect a simple inline snapshot", async () => {
      const code = `
it('my test', () => {
  expect(result).toMatchInlineSnapshot(\`{ "value": 1 }\`);
});
      `.trim();

      const ast = astService.parseToAst(code);
      const smells = await detector.detect(ast, code, filePath);

      expect(smells).toHaveLength(0);
    });

    it("should not detect toMatchSnapshot (non-inline) calls", async () => {
      const code = `
it('my test', () => {
  expect(result).toMatchSnapshot();
});
      `.trim();

      const ast = astService.parseToAst(code);
      const smells = await detector.detect(ast, code, filePath);

      expect(smells).toHaveLength(0);
    });
  });

  describe("external snapshots", () => {
    it("should detect an external snapshot exceeding 50 lines", async () => {
      const body = snapshotBody(51);
      const code = `exports[\`my test 1\`] = \`\n${body}\n\`;`;

      const ast = astService.parseToAst(code);
      const smells = await detector.detect(ast, code, filePath);

      expect(smells).toHaveLength(1);
      expect(smells[0]?.message).toContain("external");
      expect(smells[0]?.message).toContain("50 lines");
      expect(smells[0]?.file).toBe(filePath);
    });

    it("should not detect an external snapshot at exactly 50 lines", async () => {
      const body = snapshotBody(49);
      const code = `exports[\`my test 1\`] = \`\n${body}\n\`;`;

      const ast = astService.parseToAst(code);
      const smells = await detector.detect(ast, code, filePath);

      expect(smells).toHaveLength(0);
    });

    it("should not detect a short external snapshot", async () => {
      const code = `exports[\`my test 1\`] = \`{ value: 1 }\`;`;

      const ast = astService.parseToAst(code);
      const smells = await detector.detect(ast, code, filePath);

      expect(smells).toHaveLength(0);
    });

    it("should not flag exports using a string literal key (not TemplateLiteral)", async () => {
      const body = snapshotBody(51);
      const code = `exports["my test 1"] = \`\n${body}\n\`;`;

      const ast = astService.parseToAst(code);
      const smells = await detector.detect(ast, code, filePath);

      expect(smells).toHaveLength(0);
    });
  });

  describe("mixed scenarios", () => {
    it("should detect only the complex snapshots in a file with multiple snapshots", async () => {
      const shortBody = snapshotBody(5);
      const longBody = snapshotBody(51);
      const code = `
exports[\`short test\`] = \`\n${shortBody}\n\`;
exports[\`long test\`] = \`\n${longBody}\n\`;
      `.trim();

      const ast = astService.parseToAst(code);
      const smells = await detector.detect(ast, code, filePath);

      expect(smells).toHaveLength(1);
      expect(smells[0]?.codeBlock).toContain("long test");
    });

    it("should detect both complex inline and external snapshots in the same file", async () => {
      const longBody = snapshotBody(51);
      const code = `
exports[\`snap 1\`] = \`\n${longBody}\n\`;
it('test', () => {
  expect(result).toMatchInlineSnapshot(\`\n${longBody}\n  \`);
});
      `.trim();

      const ast = astService.parseToAst(code);
      const smells = await detector.detect(ast, code, filePath);

      expect(smells).toHaveLength(2);
    });

    it("should return empty array when no snapshot calls are present", async () => {
      const code = `
it('my test', () => {
  expect(value).toBe(42);
});
      `.trim();

      const ast = astService.parseToAst(code);
      const smells = await detector.detect(ast, code, filePath);

      expect(smells).toHaveLength(0);
    });

    it("should catch errors and log them without throwing", async () => {
      const ast = astService.parseToAst("it('t', () => {})");
      jest.spyOn(astService, "query").mockImplementationOnce(() => {
        throw new Error("query failure");
      });

      await expect(detector.detect(ast, "", filePath)).resolves.toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
