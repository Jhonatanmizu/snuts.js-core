import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import {
  ASSERT_OBJECT_IDENTIFIER_NAME,
  EXPECT_CALLEE_IDENTIFIER_NAME,
  MAGIC_NUMBER_EXEMPT_VALUES,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

const EQUALITY_MATCHER_NAMES = new Set<string>([
  "toBe",
  "toEqual",
  "toStrictEqual",
  "toBeCloseTo",
  "toBeGreaterThan",
  "toBeGreaterThanOrEqual",
  "toBeLessThan",
  "toBeLessThanOrEqual",
  "equal",
  "strictEqual",
  "deepEqual",
  "deepStrictEqual",
]);

function extractMagicNumericValue(node: t.Node | null | undefined): number | null {
  if (!node) {
    return null;
  }

  if (t.isNumericLiteral(node)) {
    return MAGIC_NUMBER_EXEMPT_VALUES.has(node.value) ? null : node.value;
  }

  if (
    t.isUnaryExpression(node) &&
    (node.operator === "-" || node.operator === "+") &&
    t.isNumericLiteral(node.argument)
  ) {
    const val = node.operator === "-" ? -node.argument.value : node.argument.value;
    return MAGIC_NUMBER_EXEMPT_VALUES.has(val) ? null : val;
  }

  return null;
}

function isExpectChainCall(node: t.CallExpression): boolean {
  const { callee } = node;
  if (!t.isMemberExpression(callee) || !t.isIdentifier(callee.property)) {
    return false;
  }
  if (!EQUALITY_MATCHER_NAMES.has(callee.property.name)) {
    return false;
  }

  const target = callee.object;
  if (
    t.isCallExpression(target) &&
    t.isIdentifier(target.callee, { name: EXPECT_CALLEE_IDENTIFIER_NAME })
  ) {
    return true;
  }

  if (
    t.isMemberExpression(target) &&
    t.isCallExpression(target.object) &&
    t.isIdentifier(target.object.callee, { name: EXPECT_CALLEE_IDENTIFIER_NAME })
  ) {
    return true;
  }

  return false;
}

function isAssertEqualityCall(node: t.CallExpression): boolean {
  const { callee } = node;
  return (
    t.isMemberExpression(callee) &&
    t.isIdentifier(callee.object, { name: ASSERT_OBJECT_IDENTIFIER_NAME }) &&
    t.isIdentifier(callee.property) &&
    EQUALITY_MATCHER_NAMES.has(callee.property.name)
  );
}

export class MagicNumberTestDetector implements Detector {
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
          let magicValue: number | null = null;

          if (isExpectChainCall(callNode)) {
            magicValue = extractMagicNumericValue(callNode.arguments[0]);
          } else if (isAssertEqualityCall(callNode)) {
            magicValue =
              extractMagicNumericValue(callNode.arguments[1]) ??
              extractMagicNumericValue(callNode.arguments[0]);
          }

          if (magicValue === null) {
            continue;
          }

          const loc = callNode.loc;
          const start = callNode.start ?? 0;
          const end = callNode.end ?? start;

          smells.push({
            file,
            start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
            end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
            message: `Magic number detected in assertion: ${magicValue}`,
            codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
            description: SMELL_DESCRIPTIONS.MagicNumberTest.description,
            explanation: SMELL_DESCRIPTIONS.MagicNumberTest.explanation,
          });
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running MagicNumberTestDetector");
    }

    return smells;
  }
}
