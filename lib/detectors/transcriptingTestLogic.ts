import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import {
  TRANSCRIPT_CONSOLE_METHOD_NAME_SET,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

function expressionStatementCallsConsole(expr: t.ExpressionStatement): boolean {
  if (!t.isCallExpression(expr.expression)) return false;
  const { callee } = expr.expression;
  if (!t.isMemberExpression(callee)) return false;
  if (!t.isIdentifier(callee.object, { name: "console" }) || !t.isIdentifier(callee.property)) {
    return false;
  }
  return TRANSCRIPT_CONSOLE_METHOD_NAME_SET.has(callee.property.name);
}

function usesConsoleInStatements(body: t.Statement[]): boolean {
  return body.some(
    (stmt) => t.isExpressionStatement(stmt) && expressionStatementCallsConsole(stmt),
  );
}

function expressionUsesConsole(expr: t.Expression): boolean {
  if (!t.isCallExpression(expr)) return false;
  if (!t.isMemberExpression(expr.callee)) return false;
  return (
    t.isIdentifier(expr.callee.object, { name: "console" }) &&
    t.isIdentifier(expr.callee.property) &&
    TRANSCRIPT_CONSOLE_METHOD_NAME_SET.has(expr.callee.property.name)
  );
}

export class TranscriptingTestDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const calls = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const node of calls) {
        if (!astService.isTestCase(node)) continue;

        const fnArg = node.arguments[1];
        if (!fnArg) continue;
        if (!t.isFunctionExpression(fnArg) && !t.isArrowFunctionExpression(fnArg)) continue;

        let found = false;
        if (t.isBlockStatement(fnArg.body)) {
          found = usesConsoleInStatements(fnArg.body.body);
        } else {
          found = expressionUsesConsole(fnArg.body);
        }

        if (!found) continue;

        const loc = node.loc;
        const start = node.start ?? 0;
        const end = node.end ?? start;

        smells.push({
          file,
          start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
          end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
          message: "Console output detected inside a test case.",
          codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
          description: SMELL_DESCRIPTIONS.TranscriptingTest.description,
          explanation: SMELL_DESCRIPTIONS.TranscriptingTest.explanation,
          severity: SMELL_DESCRIPTIONS.TranscriptingTest.severity,
        });
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running TranscriptingTestDetector");
    }

    return smells;
  }
}
