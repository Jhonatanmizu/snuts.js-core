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

const ONE_ARG_ASSERT_METHODS = new Set<string>([
  "ok",
  "isTrue",
  "isFalse",
  "isNull",
  "isNotNull",
  "isDefined",
  "isUndefined",
]);

const TWO_ARG_ASSERT_METHODS = new Set<string>([
  "equal",
  "notEqual",
  "strictEqual",
  "notStrictEqual",
  "deepEqual",
  "notDeepEqual",
  "deepStrictEqual",
  "notDeepStrictEqual",
  "match",
  "doesNotMatch",
  "throws",
  "doesNotThrow",
  "rejects",
  "doesNotReject",
  "include",
  "notInclude",
  "instanceOf",
  "notInstanceOf",
]);

interface CollectedAssertion {
  node: t.CallExpression;
  kind: "assert" | "expect";
  hasMessage: boolean;
}

function findRootExpectCall(node: t.CallExpression): t.CallExpression | null {
  const { callee } = node;
  if (!t.isMemberExpression(callee)) {
    return null;
  }

  const target = callee.object;
  if (
    t.isCallExpression(target) &&
    t.isIdentifier(target.callee, { name: EXPECT_CALLEE_IDENTIFIER_NAME })
  ) {
    return target;
  }

  if (t.isMemberExpression(target)) {
    const inner = target.object;
    if (
      t.isCallExpression(inner) &&
      t.isIdentifier(inner.callee, { name: EXPECT_CALLEE_IDENTIFIER_NAME })
    ) {
      return inner;
    }
  }

  return null;
}

function isStringMessageNode(node: t.Node | null | undefined): boolean {
  if (!node) {
    return false;
  }
  if (t.isStringLiteral(node)) {
    return node.value.trim().length > 0;
  }
  return t.isTemplateLiteral(node);
}

function inspectAssertCall(node: t.CallExpression): CollectedAssertion | null {
  const { callee, arguments: args } = node;

  if (t.isIdentifier(callee, { name: ASSERT_OBJECT_IDENTIFIER_NAME })) {
    return {
      node,
      kind: "assert",
      hasMessage: args.length >= 2 && isStringMessageNode(args[1]),
    };
  }

  if (
    t.isMemberExpression(callee) &&
    t.isIdentifier(callee.object, { name: ASSERT_OBJECT_IDENTIFIER_NAME }) &&
    t.isIdentifier(callee.property)
  ) {
    const methodName = callee.property.name;
    if (ONE_ARG_ASSERT_METHODS.has(methodName)) {
      return {
        node,
        kind: "assert",
        hasMessage: args.length >= 2 && isStringMessageNode(args[1]),
      };
    }

    if (TWO_ARG_ASSERT_METHODS.has(methodName)) {
      return {
        node,
        kind: "assert",
        hasMessage: args.length >= 3 && isStringMessageNode(args[2]),
      };
    }

    return {
      node,
      kind: "assert",
      hasMessage: args.length >= 2 && isStringMessageNode(args[args.length - 1]),
    };
  }

  return null;
}

function collectTestAssertions(body: t.Node): CollectedAssertion[] {
  const callNodes = astService.query(body, "CallExpression") as t.CallExpression[];
  const assertions: CollectedAssertion[] = [];
  const seenExpectRoots = new Set<t.CallExpression>();

  for (const callNode of callNodes) {
    const assertInfo = inspectAssertCall(callNode);
    if (assertInfo) {
      assertions.push(assertInfo);
      continue;
    }

    const expectRoot = findRootExpectCall(callNode);
    if (expectRoot && !seenExpectRoots.has(expectRoot)) {
      seenExpectRoots.add(expectRoot);
      const hasMessage =
        expectRoot.arguments.length >= 2 && isStringMessageNode(expectRoot.arguments[1]);
      assertions.push({
        node: callNode,
        kind: "expect",
        hasMessage,
      });
    }
  }

  return assertions;
}

export class AssertionRouletteDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const callExpressions = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const callExpr of callExpressions) {
        const callback = astService.getTestCallback(callExpr);
        if (!callback) {
          continue;
        }

        const assertions = collectTestAssertions(callback.body);
        if (assertions.length < 2) {
          continue;
        }

        const usesMessageCapableApi = assertions.some(
          (item) => item.kind === "assert" || item.hasMessage,
        );
        if (!usesMessageCapableApi) {
          continue;
        }

        for (const assertion of assertions) {
          if (assertion.hasMessage) {
            continue;
          }

          const start = assertion.node.start ?? 0;
          const end = assertion.node.end ?? start;
          const loc = assertion.node.loc;
          const codeBlock = sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET;

          smells.push({
            file,
            start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
            end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
            message:
              "Assertion roulette detected: multiple assertions without explanatory message.",
            codeBlock,
            description: SMELL_DESCRIPTIONS.AssertionRoulette.description,
            explanation: SMELL_DESCRIPTIONS.AssertionRoulette.explanation,
          });
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running AssertionRouletteDetector");
    }

    return smells;
  }
}
