import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";
import {
  ESQUERY_JEST_TEST_IN_EXPRESSION_STMT_SELECTOR,
  MAX_COMMENTS_PER_TEST,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

export class OvercommentedTestLogicDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];
    const testStatements = astService.query(
      ast,
      ESQUERY_JEST_TEST_IN_EXPRESSION_STMT_SELECTOR,
    ) as t.ExpressionStatement[];

    if (!testStatements.length) return [];

    for (const testStatement of testStatements) {
      const commentCount = astService.countComments(testStatement);

      if (commentCount > MAX_COMMENTS_PER_TEST) {
        smells.push({
          file: file,
          start: {
            line: testStatement.loc!.start.line,
            column: testStatement.loc!.start.column,
          },
          end: {
            line: testStatement.loc!.end.line,
            column: testStatement.loc!.end.column,
          },
          message: `Test has too many comments (${commentCount}). The maximum allowed is ${MAX_COMMENTS_PER_TEST}.`,
          codeBlock:
            sourceCode.substring(testStatement.start!, testStatement.end!) ||
            UNABLE_TO_EXTRACT_CODE_SNIPPET,
          description: SMELL_DESCRIPTIONS.OvercommentedTest.description,
          explanation: SMELL_DESCRIPTIONS.OvercommentedTest.explanation,
        });
      }
    }
    return smells;
  }
}
