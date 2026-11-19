import { describe, it, expect, beforeEach } from "@jest/globals";

import { ResourceOptimismDetector } from "./resourceOptimismLogic";

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

describe("ResourceOptimismDetector", () => {
  const detector = new ResourceOptimismDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect unguarded fs.readFileSync inside a test case", async () => {
    const code = `
      describe('file reader suite', () => {
        it('reads configuration file without existence check', () => {
          const content = fs.readFileSync('/tmp/config.json', 'utf-8');
          expect(content).toBeDefined();
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe(
      'Resource optimism detected: unguarded file operation "readFileSync".',
    );
    expect(smells[0]?.description).toBe("Resource Optimism");
  });

  it("should not flag file operations preceded by an existence or stat check", async () => {
    const code = `
      describe('file reader suite', () => {
        it('checks file existence before reading content', () => {
          const exists = fs.existsSync('/tmp/config.json');
          const content = fs.readFileSync('/tmp/config.json', 'utf-8');
          expect(exists).toBe(true);
          expect(content).toBeDefined();
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
