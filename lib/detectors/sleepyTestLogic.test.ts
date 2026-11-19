import { describe, it, expect, beforeEach } from "@jest/globals";

import { SleepyTestDetector } from "./sleepyTestLogic";

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

describe("SleepyTestDetector", () => {
  const detector = new SleepyTestDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect setTimeout and promise-wrapped setTimeout delays inside a test case", async () => {
    const code = `
      describe('async suite', () => {
        it('waits using setTimeout before asserting state', async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          expect(isReady()).toBe(true);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Sleepy test detected: explicit timer delay (setTimeout).");
    expect(smells[0]?.description).toBe("Sleepy Test");
  });

  it("should detect sleep(ms) or globalThis.setTimeout calls inside a test case", async () => {
    const code = `
      describe('async suite', () => {
        it('calls sleep helper and globalThis.setTimeout in test', async () => {
          await sleep(250);
          globalThis.setTimeout(() => {}, 100);
          expect(isReady()).toBe(true);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedCount = 2;
    expect(smells).toHaveLength(expectedCount);
  });

  it("should not flag tests without timer delays", async () => {
    const code = `
      describe('fast suite', () => {
        it('resolves immediately without artificial delay', async () => {
          const value = await Promise.resolve('done');
          expect(value).toBe('done');
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
