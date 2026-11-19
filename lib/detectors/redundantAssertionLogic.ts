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

const EQUALITY_MATCHER_NAMES = new Set<string>(["toBe", "toEqual", "toStrictEqual"]);

const BOOLEAN_TRUE_MATCHERS = new Set<string>(["toBeTruthy", "isTrue", "ok"]);
const BOOLEAN_FALSE_MATCHERS = new Set<string>(["toBeFalsy", "isFalse"]);
const ASSERT_EQUALITY_METHODS = new Set<string>([
  "equal",
  "strictEqual",
  "deepEqual",
  "deepStrictEqual",
]);

function extractComparableKey(node: t.Node | null | undefined): string | null {
  if (!node) {
    return null;
  }
  if (t.isStringLiteral(node)) {
    return `str:${node.value}`;
  }
  if (t.isNumericLiteral(node)) {
    return `num:${node.value}`;
  }
  if (t.isBooleanLiteral(node)) {
    return `bool:${node.value}`;
  }
  if (t.isNullLiteral(node)) {
    return "null";
  }
  if (t.isIdentifier(node)) {
    return `id:${node.name}`;
  }
  return null;
}

function isRedundantExpectCall(node: t.CallExpression): boolean {
  const { callee, arguments: matcherArgs } = node;
  if (!t.isMemberExpression(callee) || !t.isIdentifier(callee.property)) {
    return false;
  }

  const matcherName = callee.property.name;
  const target = callee.object;
  if (
    !t.isCallExpression(target) ||
    !t.isIdentifier(target.callee, { name: EXPECT_CALLEE_IDENTIFIER_NAME })
  ) {
    return false;
  }

  const actualArg = target.arguments[0];
  if (BOOLEAN_TRUE_MATCHERS.has(matcherName) && t.isBooleanLiteral(actualArg, { value: true })) {
    return true;
  }
  if (BOOLEAN_FALSE_MATCHERS.has(matcherName) && t.isBooleanLiteral(actualArg, { value: false })) {
    return true;
  }

  if (!EQUALITY_MATCHER_NAMES.has(matcherName)) {
    return false;
  }

  const actualKey = extractComparableKey(actualArg);
  const expectedKey = extractComparableKey(matcherArgs[0]);
  return actualKey !== null && actualKey === expectedKey;
}

function isRedundantAssertCall(node: t.CallExpression): boolean {
  const { callee, arguments: args } = node;

  if (t.isIdentifier(callee, { name: ASSERT_OBJECT_IDENTIFIER_NAME })) {
    return t.isBooleanLiteral(args[0], { value: true });
  }

  if (
    t.isMemberExpression(callee) &&
    t.isIdentifier(callee.object, { name: ASSERT_OBJECT_IDENTIFIER_NAME }) &&
    t.isIdentifier(callee.property)
  ) {
    const methodName = callee.property.name;
    if (BOOLEAN_TRUE_MATCHERS.has(methodName) && t.isBooleanLiteral(args[0], { value: true })) {
      return true;
    }
    if (BOOLEAN_FALSE_MATCHERS.has(methodName) && t.isBooleanLiteral(args[0], { value: false })) {
      return true;
    }
    if (ASSERT_EQUALITY_METHODS.has(methodName)) {
      const firstKey = extractComparableKey(args[0]);
      const secondKey = extractComparableKey(args[1]);
      return firstKey !== null && firstKey === secondKey;
    }
  }

  return false;
}

export class RedundantAssertionDetector implements Detector {
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
          if (!isRedundantExpectCall(callNode) && !isRedundantAssertCall(callNode)) {
            continue;
          }

          const loc = callNode.loc;
          const start = callNode.start ?? 0;
          const end = callNode.end ?? start;

          smells.push({
            file,
            start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
            end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
            message: "Redundant assertion with tautological comparison detected.",
            codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
            description: SMELL_DESCRIPTIONS.RedundantAssertion.description,
            explanation: SMELL_DESCRIPTIONS.RedundantAssertion.explanation,
          });
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running RedundantAssertionDetector");
    }

    return smells;
  }
}
