import { describe, it, expect, beforeEach } from "@jest/globals";

import { EagerTestDetector } from "./eagerTestLogic";

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

describe("EagerTestDetector", () => {
  const detector = new EagerTestDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect a test case calling multiple distinct methods on the same SUT instance", async () => {
    const code = `
      describe('account suite', () => {
        it('deposits, withdraws, and transfers funds in a single test', () => {
          const account = new BankAccount();
          account.deposit(100);
          account.withdraw(40);
          expect(account.getBalance()).toBe(60);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toContain(
      'Eager test detected: invokes multiple methods (deposit, withdraw, getBalance) on "account".',
    );
    expect(smells[0]?.description).toBe("Eager Test");
  });

  it("should not flag a focused test case calling only a single SUT method", async () => {
    const code = `
      describe('account suite', () => {
        it('deposits funds into account', () => {
          const account = new BankAccount();
          const balance = account.deposit(100);
          expect(balance).toBe(100);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
