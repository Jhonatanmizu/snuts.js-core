import { describe, it, expect, beforeEach } from "@jest/globals";

import { DependentTestDetector } from "./dependentTestLogic";

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

describe("DependentTestDetector", () => {
  const detector = new DependentTestDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect a test that reads shared mutable state written by a preceding test", async () => {
    const code = `
      describe('order workflow suite', () => {
        let createdOrderId: string;

        it('creates a new order and stores its identifier', () => {
          createdOrderId = createOrder();
          expect(createdOrderId).toBeDefined();
        });

        it('fetches order details using identifier from previous test', () => {
          const order = getOrder(createdOrderId);
          expect(order.id).toBe(createdOrderId);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe(
      'Dependent test detected: relies on shared state "createdOrderId" mutated by a previous test.',
    );
    expect(smells[0]?.description).toBe("Dependent Test");
  });

  it("should not flag shared state that is reset inside beforeEach", async () => {
    const code = `
      describe('order workflow suite', () => {
        let counter: number;

        beforeEach(() => {
          counter = 0;
        });

        it('increments counter in first test case', () => {
          counter = counter + 1;
          expect(counter).toBe(1);
        });

        it('reads fresh counter in second test case', () => {
          expect(counter).toBe(0);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(0);
  });
});
