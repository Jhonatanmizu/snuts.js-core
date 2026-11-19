import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import {
  MYSTERY_GUEST_IDENTIFIER_NAME_SET,
  MYSTERY_GUEST_OBJECT_NAME_SET,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

const MOCK_HELPER_METHOD_NAMES = new Set<string>([
  "spyOn",
  "mock",
  "doMock",
  "unmock",
  "fn",
  "mockImplementation",
  "mockReturnValue",
  "mockResolvedValue",
  "mockRejectedValue",
]);

function resolveExternalResourceTarget(node: t.CallExpression | t.NewExpression): string | null {
  const { callee } = node;

  if (t.isIdentifier(callee) && MYSTERY_GUEST_IDENTIFIER_NAME_SET.has(callee.name)) {
    return callee.name;
  }

  if (
    t.isMemberExpression(callee) &&
    t.isIdentifier(callee.object) &&
    t.isIdentifier(callee.property)
  ) {
    if (MOCK_HELPER_METHOD_NAMES.has(callee.property.name)) {
      return null;
    }

    if (MYSTERY_GUEST_OBJECT_NAME_SET.has(callee.object.name)) {
      return `${callee.object.name}.${callee.property.name}`;
    }
  }

  if (
    t.isMemberExpression(callee) &&
    t.isMemberExpression(callee.object) &&
    t.isIdentifier(callee.object.object) &&
    t.isIdentifier(callee.object.property, { name: "promises" }) &&
    t.isIdentifier(callee.property) &&
    MYSTERY_GUEST_OBJECT_NAME_SET.has(callee.object.object.name)
  ) {
    return `${callee.object.object.name}.promises.${callee.property.name}`;
  }

  return null;
}

export class MysteryGuestDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const callExpressions = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const callExpr of callExpressions) {
        const callback = astService.getTestCallback(callExpr);
        if (!callback) {
          continue;
        }

        const invocations = astService.query(callback.body, "CallExpression, NewExpression") as (
          | t.CallExpression
          | t.NewExpression
        )[];

        for (const invocation of invocations) {
          const resourceName = resolveExternalResourceTarget(invocation);
          if (!resourceName) {
            continue;
          }

          const loc = invocation.loc;
          const start = invocation.start ?? 0;
          const end = invocation.end ?? start;

          smells.push({
            file,
            start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
            end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
            message: `External resource access inside test case detected: ${resourceName}`,
            codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
            description: SMELL_DESCRIPTIONS.MysteryGuest.description,
            explanation: SMELL_DESCRIPTIONS.MysteryGuest.explanation,
          });
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running MysteryGuestDetector");
    }

    return smells;
  }
}
