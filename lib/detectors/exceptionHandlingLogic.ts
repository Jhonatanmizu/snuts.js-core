import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { EXPECT_CALLEE_IDENTIFIER_NAME, UNABLE_TO_EXTRACT_CODE_SNIPPET } from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

function isInsideExpectAssertionCallback(node: t.Node, testBody: t.Node): boolean {
  const expectCalls = astService.query(testBody, "CallExpression") as t.CallExpression[];
  const nodeStart = node.start ?? -1;
  const nodeEnd = node.end ?? -1;

  for (const call of expectCalls) {
    if (!t.isIdentifier(call.callee, { name: EXPECT_CALLEE_IDENTIFIER_NAME })) {
      continue;
    }
    const arg0 = call.arguments[0];
    if (!arg0 || !astService.isFunction(arg0)) {
      continue;
    }
    const argStart = arg0.start ?? -1;
    const argEnd = arg0.end ?? -1;
    if (nodeStart >= argStart && nodeEnd <= argEnd) {
      return true;
    }
  }

  return false;
}

export class ExceptionHandlingDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const callExpressions = astService.query(ast, "CallExpression") as t.CallExpression[];
      const seenOffsets = new Set<string>();

      for (const callExpr of callExpressions) {
        const callback = astService.getTestCallback(callExpr);
        if (!callback) {
          continue;
        }

        const exceptionNodes = astService.query(callback.body, "TryStatement, ThrowStatement");

        for (const node of exceptionNodes) {
          if (t.isThrowStatement(node) && isInsideExpectAssertionCallback(node, callback.body)) {
            continue;
          }

          const start = node.start ?? 0;
          const end = node.end ?? start;
          const offsetKey = `${start}:${end}:${node.type}`;
          if (seenOffsets.has(offsetKey)) {
            continue;
          }
          seenOffsets.add(offsetKey);

          const loc = node.loc;
          const codeBlock = sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET;

          smells.push({
            file,
            start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
            end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
            message: `Manual exception handling inside test case detected: ${node.type}`,
            codeBlock,
            description: SMELL_DESCRIPTIONS.ExceptionHandling.description,
            explanation: SMELL_DESCRIPTIONS.ExceptionHandling.explanation,
          });
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running ExceptionHandlingDetector");
    }

    return smells;
  }
}
