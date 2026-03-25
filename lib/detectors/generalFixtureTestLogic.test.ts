import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { GeneralFixtureTestLogicDetector } from "./generalFixtureTestLogic";

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

describe("GeneralFixtureTestLogicDetector", () => {
  const detector = new GeneralFixtureTestLogicDetector();
  const filePath = "test-file.ts";

  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it("should detect an unused setup variable from beforeEach assignment", async () => {
    const code = `
      describe('suite', () => {
        beforeEach(() => {
          fixtureValue = buildFixture();
        });

        it('uses no setup variable', () => {
          expect(true).toBeTruthy();
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe(
      'General fixture detected: setup variable "fixtureValue" is never used in test cases.',
    );
    expect(smells[0]?.file).toBe(filePath);
    const expectedStartLine = 4;
    expect(smells[0]?.start.line).toBe(expectedStartLine);
    expect(smells[0]?.codeBlock).toContain("fixtureValue");
  });

  it("should detect an unused setup variable from beforeAll assignment", async () => {
    const code = `
      describe('suite', () => {
        beforeAll(() => {
          sharedFixture = setupSharedFixture();
        });

        test('does not use shared fixture', () => {
          expect(1 + 1).toBe(2);
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe(
      'General fixture detected: setup variable "sharedFixture" is never used in test cases.',
    );
    expect(smells[0]?.file).toBe(filePath);
    const expectedStartLine = 4;
    expect(smells[0]?.start.line).toBe(expectedStartLine);
    expect(smells[0]?.codeBlock).toContain("sharedFixture");
  });

  it("should detect multiple unused setup variables across hooks", async () => {
    const code = `
      describe('suite', () => {
        beforeEach(() => {
          unusedEach = createData();
        });

        beforeAll(() => {
          unusedAll = createGlobalData();
        });

        it('does not reference setup vars', () => {
          expect(true).toBe(true);
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 2;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toContain("General fixture detected");
    expect(smells[1]?.message).toContain("General fixture detected");
  });

  it("should not detect when setup variable is used in a test body", async () => {
    const code = `
      describe('suite', () => {
        beforeEach(() => {
          fixtureValue = buildFixture();
        });

        it('uses setup variable', () => {
          expect(fixtureValue).toBeDefined();
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("should not detect when no setup hooks exist", async () => {
    const code = `
      describe('suite', () => {
        it('plain test', () => {
          const fixtureValue = 1;
          expect(fixtureValue).toBe(1);
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("should not detect when setup variable is used in a nested block inside test callback", async () => {
    const code = `
      describe('suite', () => {
        beforeEach(() => {
          fixtureValue = buildFixture();
        });

        it('uses setup variable deeply', () => {
          if (true) {
            expect(fixtureValue).toBeTruthy();
          }
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 0;
    expect(smells).toHaveLength(expectedNumberOfSmells);
  });

  it("should report only the unused setup variable in mixed usage", async () => {
    const code = `
      describe('suite', () => {
        beforeEach(() => {
          usedFixture = setupUsedFixture();
          unusedFixture = setupUnusedFixture();
        });

        it('uses one setup variable', () => {
          expect(usedFixture).toBeDefined();
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe(
      'General fixture detected: setup variable "unusedFixture" is never used in test cases.',
    );
  });

  it("should detect declaration-based setup variables that are never used", async () => {
    const code = `
      describe('suite', () => {
        beforeEach(() => {
          const fixtureValue = buildFixture();
          expect(fixtureValue).toBeTruthy();
        });

        it('does not use setup declaration', () => {
          expect(true).toBeTruthy();
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);

    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe(
      'General fixture detected: setup variable "fixtureValue" is never used in test cases.',
    );
    expect(smells[0]?.codeBlock).toContain("fixtureValue");
  });

  it("should not count non-test callback references as usage", async () => {
    const code = `
      describe('suite', () => {
        beforeEach(() => {
          fixtureValue = buildFixture();
        });

        beforeAll(() => {
          helper(fixtureValue);
        });

        it('still does not use fixture in test', () => {
          expect(true).toBe(true);
        });
      });
    `;

    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, filePath);
    const expectedNumberOfSmells = 1;
    expect(smells).toHaveLength(expectedNumberOfSmells);
    expect(smells[0]?.message).toBe(
      'General fixture detected: setup variable "fixtureValue" is never used in test cases.',
    );
  });
});
