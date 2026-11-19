import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import {
  SLEEPY_TEST_TIMER_FUNCTION_NAME_SET,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

const GLOBAL_TIMER_OBJECTS = new Set<string>(["global", "globalThis", "window", "timers"]);

function resolveSleepCallName(node: t.CallExpression): string | null {
  const { callee, arguments: args } = node;

  if (t.isIdentifier(callee)) {
    if (SLEEPY_TEST_TIMER_FUNCTION_NAME_SET.has(callee.name)) {
      return callee.name;
    }
    if (
      (callee.name === "sleep" || callee.name === "delay") &&
      args.length === 1 &&
      t.isNumericLiteral(args[0])
    ) {
      return callee.name;
    }
  }

  if (
    t.isMemberExpression(callee) &&
    t.isIdentifier(callee.object) &&
    t.isIdentifier(callee.property) &&
    GLOBAL_TIMER_OBJECTS.has(callee.object.name) &&
    SLEEPY_TEST_TIMER_FUNCTION_NAME_SET.has(callee.property.name)
  ) {
    return `${callee.object.name}.${callee.property.name}`;
  }

  return null;
}

export class SleepyTestDetector implements Detector {
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

        for (const callNode of innerCalls) {
          const timerName = resolveSleepCallName(callNode);
          if (!timerName) {
            continue;
          }

          const loc = callNode.loc;
          const start = callNode.start ?? 0;
          const end = callNode.end ?? start;

          smells.push({
            file,
            start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
            end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
            message: `Sleepy test detected: explicit timer delay (${timerName}).`,
            codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
            description: SMELL_DESCRIPTIONS.SleepyTest.description,
            explanation: SMELL_DESCRIPTIONS.SleepyTest.explanation,
          });
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running SleepyTestDetector");
    }

    return smells;
  }
}
