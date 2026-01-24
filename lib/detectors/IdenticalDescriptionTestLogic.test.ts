import { describe, it, expect, beforeEach } from "@jest/globals";

import { IdenticalDescriptionTestLogicDetector } from "./identicalDescriptionTestLogic";

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

describe("IdenticalDescriptionTestLogic", () => {
  const detector = new IdenticalDescriptionTestLogicDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.warn as jest.Mock).mockClear();
  });

  it("should detect test cases with the same description", async () => {
    const code = `
        describe("smelledTest", () =>{
            test("case1", () =>{
            expect(true).toBeTruthy()
            })
            test("case1", () =>{
            expect(true).toBeTruthy()
            })
        })
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    expect(smells).toHaveLength(1);
  });
});
