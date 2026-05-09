import { describe, it, expect, beforeEach } from "@jest/globals";

import { TranscriptingTestDetector } from "./transcriptingTestLogic";

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

describe("TranscriptingTestDetector", () => {
  const detector = new TranscriptingTestDetector();
  const filePath = "transcript.test.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("detects console.log inside a test body", async () => {
    const code = `
      it('logs', () => {
        console.log('debug');
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toContain("Console output");
  });

  it("allows tests without console usage", async () => {
    const code = `
      it('clean', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
