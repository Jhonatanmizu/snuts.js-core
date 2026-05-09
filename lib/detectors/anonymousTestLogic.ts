import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";
import {
  ANONYMOUS_TEST_MAX_DESCRIPTION_WORD_COUNT,
  ESQUERY_JEST_TEST_CALLEE_SELECTOR,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

export class AnonymousTestLogicDetector implements Detector {
  /**
   * Detects anonymous test cases (those with an empty or missing description).
   */
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const testCaseNodes = astService.query(
        ast,
        ESQUERY_JEST_TEST_CALLEE_SELECTOR,
      ) as t.CallExpression[];

      for (const node of testCaseNodes) {
        if (
          node.arguments.length > 0 &&
          t.isStringLiteral(node.arguments[0]) &&
          node.arguments[0].value.trim().split(/\s+/).filter(Boolean).length <=
            ANONYMOUS_TEST_MAX_DESCRIPTION_WORD_COUNT
        ) {
          const start = node.start ?? 0;
          const end = node.end ?? start;
          const loc = node.loc;

          const startLine = loc?.start.line ?? 0;
          const endLine = loc?.end.line ?? 0;

          const codeBlock = sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET;

          smells.push({
            file,
            start: { line: startLine, column: loc?.start.column ?? 0 },
            end: { line: endLine, column: loc?.end.column ?? 0 },
            message: `Anonymous test case detected.`,
            codeBlock,
            description: SMELL_DESCRIPTIONS.AnonymousTest.description,
            explanation: SMELL_DESCRIPTIONS.AnonymousTest.explanation,
          });
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running AnonymousTestLogicDetector");
    }

    return smells;
  }
}
