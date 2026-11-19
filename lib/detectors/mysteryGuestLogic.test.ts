import { describe, it, expect, beforeEach } from "@jest/globals";

import { MysteryGuestDetector } from "./mysteryGuestLogic";

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

describe("MysteryGuestDetector", () => {
  const detector = new MysteryGuestDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect direct file system and network calls inside a test case", async () => {
    const code = `
      describe('integration suite', () => {
        it('loads configuration from file and remote endpoint', async () => {
          const raw = fs.readFileSync('/etc/app.json', 'utf-8');
          const res = await fetch('https://api.example.com/status');
          expect(raw).toBeDefined();
          expect(res).toBeDefined();
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedCount = 2;
    expect(smells).toHaveLength(expectedCount);
    expect(smells[0]?.message).toBe(
      "External resource access inside test case detected: fs.readFileSync",
    );
    expect(smells[1]?.message).toBe("External resource access inside test case detected: fetch");
    expect(smells[0]?.description).toBe("Mystery Guest");
  });

  it("should detect localStorage and axios access inside a test case", async () => {
    const code = `
      describe('storage suite', () => {
        it('reads token from localStorage and calls axios', async () => {
          const token = localStorage.getItem('auth_token');
          const response = await axios.get('/users');
          expect(token).toBeDefined();
          expect(response).toBeDefined();
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedCount = 2;
    expect(smells).toHaveLength(expectedCount);
  });

  it("should not flag pure unit tests without external resource calls", async () => {
    const code = `
      describe('pure suite', () => {
        it('computes value using in-memory objects', () => {
          const user = { name: 'Alice' };
          expect(user.name).toBe('Alice');
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
