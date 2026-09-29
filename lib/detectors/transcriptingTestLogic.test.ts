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

  it("detects console.log inside test body", async () => {
    const code = `
      it('logs something', () => {
        console.log('debug');
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toContain("Console output");
  });

  it("detects console.error inside test body", async () => {
    const code = `
      it('errors something', () => {
        console.error('something went wrong');
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toContain("Console output");
  });

  it("detects console.warn inside test body", async () => {
    const code = `
      it('warns about something', () => {
        console.warn('watch out');
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toContain("Console output");
  });

  it("flags test case once with multiple console calls", async () => {
    const code = `
      it('multiple console calls', () => {
        console.log('first');
        console.error('second');
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toContain("Console output");
  });

  it("allows tests without console usage", async () => {
    const code = `
      it('clean test case', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("detects only console test in mixed snippet", async () => {
    const code = `
      it('uses console log', () => {
        console.log('debug info');
        expect(1).toBe(1);
      });

      it('clean test case', () => {
        expect(2).toBe(2);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toContain("Console output");
  });
});
