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
    expect(smells[0]?.message).toBe("Identical Description test case detected.");
    expect(smells[0]?.file).toBe(filePath);
  });

  it("should not detect test cases with unique descriptions", async () => {
    const code = `
        describe("uniqueTest", () => {
            test("caseA", () => {
                expect(true).toBeTruthy();
            });
            test("caseB", () => {
                expect(true).toBeTruthy();
            });
        });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    expect(smells).toHaveLength(0);
  });

  it("should detect test cases with identical descriptions within nested describe blocks", async () => {
    const code = `
        describe("parentDescribe", () => {
            describe("nestedDescribe", () => {
                test("nestedCase", () => {
                    expect(true).toBeTruthy();
                });
                test("nestedCase", () => {
                    expect(true).toBeTruthy();
                });
            });
        });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    expect(smells).toHaveLength(1);
  });

  it("should detect multiple instances of identical test case descriptions", async () => {
    const code = `
        describe("multipleSmells", () => {
            test("duplicate1", () => {
                expect(true).toBeTruthy();
            });
            test("duplicate1", () => {
                expect(true).toBeTruthy();
            });
            test("duplicate2", () => {
                expect(true).toBeTruthy();
            });
            test("duplicate2", () => {
                expect(true).toBeTruthy();
            });
        });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    expect(smells).toHaveLength(2);
  });
});
