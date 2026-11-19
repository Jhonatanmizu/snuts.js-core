import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import {
  ASSERT_OBJECT_IDENTIFIER_NAME,
  EXPECT_CALLEE_IDENTIFIER_NAME,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

function hasAssertionInTestBody(body: t.Node): boolean {
  const statements = astService.query(body, "ExpressionStatement") as t.ExpressionStatement[];
  if (statements.some((stmt) => astService.isAssertionStatement(stmt))) {
    return true;
  }

  const callExpressions = astService.query(body, "CallExpression") as t.CallExpression[];
  for (const call of callExpressions) {
    const { callee } = call;
    if (
      t.isIdentifier(callee) &&
      (callee.name === EXPECT_CALLEE_IDENTIFIER_NAME ||
        callee.name === ASSERT_OBJECT_IDENTIFIER_NAME ||
        callee.name.startsWith("assert") ||
        callee.name.startsWith("expect"))
    ) {
      return true;
    }

    if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
      const propName = callee.property.name;
      if (
        propName === "should" ||
        propName.startsWith("to") ||
        propName.startsWith("assert") ||
        propName.startsWith("expect")
      ) {
        return true;
      }

      if (
        t.isIdentifier(callee.object) &&
        (callee.object.name === ASSERT_OBJECT_IDENTIFIER_NAME ||
          callee.object.name === EXPECT_CALLEE_IDENTIFIER_NAME)
      ) {
        return true;
      }
    }
  }

  return false;
}

function isBodyNonEmpty(body: t.Node): boolean {
  if (t.isBlockStatement(body)) {
    return body.body.some((stmt) => !t.isEmptyStatement(stmt));
  }
  return true;
}

export class UnknownTestDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const callExpressions = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const callExpr of callExpressions) {
        const callback = astService.getTestCallback(callExpr);
        if (!callback) {
          continue;
        }

        if (!isBodyNonEmpty(callback.body)) {
          continue;
        }

        if (hasAssertionInTestBody(callback.body)) {
          continue;
        }

        const loc = callExpr.loc;
        const start = callExpr.start ?? 0;
        const end = callExpr.end ?? start;

        smells.push({
          file,
          start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
          end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
          message: "Unknown test detected: test case contains no assertions.",
          codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
          description: SMELL_DESCRIPTIONS.UnknownTest.description,
          explanation: SMELL_DESCRIPTIONS.UnknownTest.explanation,
        });
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running UnknownTestDetector");
    }

    return smells;
  }
}
