import { describe, it, expect, beforeEach } from "@jest/globals";

import { VerboseTestDetector } from "./verboseTestLogic";

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

describe("VerboseTestDetector", () => {
  const detector = new VerboseTestDetector();
  const filePath = "verbose.test.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("flags blocks with more than 13 statements", async () => {
    const statements = Array.from({ length: 14 }, (_, i) => `const v${i} = ${i};`).join("\n");
    const code = `
      describe('big', () => {
        it('long', () => {
          ${statements}
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells.length).toBeGreaterThanOrEqual(1);
    expect(smells[0]?.message).toContain("Verbose block");
  });

  it("ignores small blocks", async () => {
    const code = `
      it('short', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells.filter((s) => s.message.includes("Verbose"))).toHaveLength(0);
  });
});
