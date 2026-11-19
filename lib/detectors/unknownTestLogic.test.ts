import { describe, it, expect, beforeEach } from "@jest/globals";

import { UnknownTestDetector } from "./unknownTestLogic";

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

describe("UnknownTestDetector", () => {
  const detector = new UnknownTestDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect a non-empty test case that has no assertions", async () => {
    const code = `
      describe('service suite', () => {
        it('executes service action without asserting outcome', () => {
          const service = new UserService();
          service.registerUser('alice');
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Unknown test detected: test case contains no assertions.");
    expect(smells[0]?.description).toBe("Unknown Test");
  });

  it("should not flag an empty test case (handled by CommentsOnlyTest)", async () => {
    const code = `
      describe('service suite', () => {
        it('has an empty body', () => {});
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });

  it("should not flag a test case containing expect or assert calls", async () => {
    const code = `
      describe('service suite', () => {
        it('registers user and verifies user record', () => {
          const service = new UserService();
          const user = service.registerUser('alice');
          expect(user.name).toBe('alice');
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
