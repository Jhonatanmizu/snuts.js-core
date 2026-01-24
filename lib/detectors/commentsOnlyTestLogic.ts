import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";
import { jestTestAliases } from "@/shared/aliases";

export class CommentsOnlyLogicTestDetector implements Detector {
  /**
   * Detects test cases that only contain comments or are empty.
   */
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const testCaseSelector = `CallExpression[callee.name=/${jestTestAliases.join("|")}/]`;
      const testCaseNodes = astService.query(ast, testCaseSelector) as t.CallExpression[];

      for (const node of testCaseNodes) {
        if (node.arguments.length > 1 && t.isArrowFunctionExpression(node.arguments[1])) {
          const body = node.arguments[1].body;
          if (t.isBlockStatement(body) && body.body.length === 0) {
            // This checks for an empty block statement, e.g., test('name', () => {})
            // Or a block statement with only comments.
            const start = node.start ?? 0;
            const end = node.end ?? start;
            const loc = node.loc;

            const startLine = loc?.start.line ?? 0;
            const endLine = loc?.end.line ?? 0;
            const codeBlock = sourceCode.slice(start, end) || "// Unable to extract code snippet";

            smells.push({
              file,
              start: { line: startLine, column: loc?.start.column ?? 0 },
              end: { line: endLine, column: loc?.end.column ?? 0 },
              message: `Test case with only comments or empty body detected.`,
              codeBlock,
            });
          }
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running CommentsOnlyLogicDetector");
    }

    return smells;
  }
}
