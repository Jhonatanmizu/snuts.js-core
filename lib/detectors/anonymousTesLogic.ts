import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";
import { jestTestAliases } from "@/shared/aliases";

const MINIMUM_WORDS_THRESHOLD = 2;

export class AnonymousTestLogicDetector implements Detector {
  /**
   * Detects anonymous test cases (those with an empty or missing description).
   */
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const testCaseSelector = `CallExpression[callee.name=/${jestTestAliases.join("|")}/]`;
      const testCaseNodes = astService.query(ast, testCaseSelector) as t.CallExpression[];

      for (const node of testCaseNodes) {
        if (
          node.arguments.length > 0 &&
          t.isStringLiteral(node.arguments[0]) &&
          node.arguments[0].value.trim().split(/\s+/).filter(Boolean).length <=
            MINIMUM_WORDS_THRESHOLD
        ) {
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
            message: `Anonymous test case detected.`,
            codeBlock,
          });
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running AnonymousTestLogicDetector");
    }

    return smells;
  }
}
