import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import {
  RESOURCE_OPTIMISM_ACTION_METHOD_SET,
  RESOURCE_OPTIMISM_GUARD_METHOD_SET,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

const FS_OBJECT_NAMES = new Set<string>(["fs", "fsPromises"]);

function extractFsMethodName(node: t.CallExpression): string | null {
  const { callee } = node;

  if (
    t.isMemberExpression(callee) &&
    t.isIdentifier(callee.object) &&
    t.isIdentifier(callee.property) &&
    FS_OBJECT_NAMES.has(callee.object.name)
  ) {
    return callee.property.name;
  }

  if (
    t.isMemberExpression(callee) &&
    t.isMemberExpression(callee.object) &&
    t.isIdentifier(callee.object.object) &&
    t.isIdentifier(callee.object.property, { name: "promises" }) &&
    t.isIdentifier(callee.property) &&
    FS_OBJECT_NAMES.has(callee.object.object.name)
  ) {
    return callee.property.name;
  }

  return null;
}

export class ResourceOptimismDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const callExpressions = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const callExpr of callExpressions) {
        const callback = astService.getTestCallback(callExpr);
        if (!callback) {
          continue;
        }

        const innerCalls = astService.query(callback.body, "CallExpression") as t.CallExpression[];
        let hasSeenGuard = false;

        for (const callNode of innerCalls) {
          const methodName = extractFsMethodName(callNode);
          if (!methodName) {
            continue;
          }

          if (RESOURCE_OPTIMISM_GUARD_METHOD_SET.has(methodName)) {
            hasSeenGuard = true;
            continue;
          }

          if (RESOURCE_OPTIMISM_ACTION_METHOD_SET.has(methodName) && !hasSeenGuard) {
            const loc = callNode.loc;
            const start = callNode.start ?? 0;
            const end = callNode.end ?? start;

            smells.push({
              file,
              start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
              end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
              message: `Resource optimism detected: unguarded file operation "${methodName}".`,
              codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
              description: SMELL_DESCRIPTIONS.ResourceOptimism.description,
              explanation: SMELL_DESCRIPTIONS.ResourceOptimism.explanation,
            });
          }
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running ResourceOptimismDetector");
    }

    return smells;
  }
}
