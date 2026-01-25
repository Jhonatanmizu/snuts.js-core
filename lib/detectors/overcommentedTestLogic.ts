import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";
import { MAX_COMMENTS_PER_TEST } from "@/shared/constants";
import { jestTestAliases } from "@/shared/aliases";

export class OvercommentedTestLogicDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];
    const testCaseSelector = `ExpressionStatement:has(CallExpression[callee.name=/${jestTestAliases.join("|")}/])`;
    const testStatements = astService.query(ast, testCaseSelector) as t.ExpressionStatement[];

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
            "// Unable to extract code snippet",
        });
      }
    }
    return smells;
  }
}
