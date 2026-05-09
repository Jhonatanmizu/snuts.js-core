import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

const UNABLE = "// Unable to extract code snippet";

function isConsoleMethodStatement(
  node: t.Statement,
  method: "log" | "error" | "warn" | "info",
): boolean {
  return (
    t.isExpressionStatement(node) &&
    t.isCallExpression(node.expression) &&
    t.isMemberExpression(node.expression.callee) &&
    t.isIdentifier(node.expression.callee.object, { name: "console" }) &&
    t.isIdentifier(node.expression.callee.property, { name: method })
  );
}

function usesConsoleInStatements(body: t.Statement[]): boolean {
  return body.some(
    (stmt) =>
      isConsoleMethodStatement(stmt, "log") ||
      isConsoleMethodStatement(stmt, "error") ||
      isConsoleMethodStatement(stmt, "warn") ||
      isConsoleMethodStatement(stmt, "info"),
  );
}

function expressionUsesConsole(expr: t.Expression): boolean {
  if (!t.isCallExpression(expr)) return false;
  if (!t.isMemberExpression(expr.callee)) return false;
  return (
    t.isIdentifier(expr.callee.object, { name: "console" }) &&
    t.isIdentifier(expr.callee.property) &&
    ["log", "error", "warn", "info"].includes(expr.callee.property.name)
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
          codeBlock: sourceCode.slice(start, end) || UNABLE,
          description: SMELL_DESCRIPTIONS.TranscriptingTest.description,
          explanation: SMELL_DESCRIPTIONS.TranscriptingTest.explanation,
        });
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running TranscriptingTestDetector");
    }

    return smells;
  }
}
