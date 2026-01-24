import { AnonymousTestLogicDetector } from "./anonymousTesLogic";

import astService from "@/ast/ast.service";

describe("AnonymousTestLogicDetector", () => {
  let detector: AnonymousTestLogicDetector;

  beforeEach(() => {
    detector = new AnonymousTestLogicDetector();
  });

  it("should detect a test with an empty description", async () => {
    const code = `
      test('', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, "test.js");
    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Anonymous test case detected.");
  });

  it("should detect a test with a whitespace description", async () => {
    const code = `
      it('   ', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, "test.js");
    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Anonymous test case detected.");
  });

  it("should detect a test with a two-word description", async () => {
    const code = `
      test('two words', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, "test.js");
    expect(smells).toHaveLength(1);
    expect(smells[0]?.message).toBe("Anonymous test case detected.");
  });

  it("should not detect a test with a proper description", async () => {
    const code = `
      test('should do something', () => {
        expect(1).toBe(1);
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, "test.js");
    expect(smells).toHaveLength(0);
  });

  it("should handle multiple test cases", async () => {
    const code = `
      describe('my suite', () => {
        test('should do something', () => {
          expect(1).toBe(1);
        });

        it('', () => {
            expect(true).toBe(true);
        });

        test(' ', () => {
            expect(false).toBe(false);
        });
      });
    `;
    const ast = astService.parseToAst(code);
    const smells = await detector.detect(ast, code, "test.js");
    expect(smells).toHaveLength(2);
  });
});
