import * as t from "@babel/types";

import { collectLocalTestSutMethodCalls } from "./eagerTestLogic";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { UNABLE_TO_EXTRACT_CODE_SNIPPET } from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

function analyzeSuiteForLazyTests(
  statements: t.Statement[],
  sourceCode: string,
  file: string,
  smells: Smell[],
): void {
  const methodToTests = new Map<string, t.CallExpression[]>();

  for (const stmt of statements) {
    if (!t.isExpressionStatement(stmt) || !t.isCallExpression(stmt.expression)) {
      continue;
    }

    const callExpr = stmt.expression;
    const callback = astService.getTestCallback(callExpr);
    if (!callback) {
      continue;
    }

    const methodsByObject = collectLocalTestSutMethodCalls(callback.body);
    if (methodsByObject.size !== 1) {
      continue;
    }

    const entry = [...methodsByObject.entries()][0];
    if (!entry) {
      continue;
    }
    const [objName, methods] = entry;
    if (methods.size !== 1) {
      continue;
    }

    const methodName = [...methods][0];
    if (!methodName) {
      continue;
    }

    const key = `${objName}.${methodName}`;
    const list = methodToTests.get(key) ?? [];
    list.push(callExpr);
    methodToTests.set(key, list);
  }

  for (const [targetMethod, testNodes] of methodToTests.entries()) {
    if (testNodes.length < 2) {
      continue;
    }

    for (const testNode of testNodes) {
      const loc = testNode.loc;
      const start = testNode.start ?? 0;
      const end = testNode.end ?? start;

      smells.push({
        file,
        start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
        end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
        message: `Lazy test detected: multiple tests invoke the same single method "${targetMethod}".`,
        codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
        description: SMELL_DESCRIPTIONS.LazyTest.description,
        explanation: SMELL_DESCRIPTIONS.LazyTest.explanation,
      });
    }
  }
}

export class LazyTestDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      analyzeSuiteForLazyTests(ast.program.body, sourceCode, file, smells);

      const callExpressions = astService.query(ast, "CallExpression") as t.CallExpression[];
      for (const callExpr of callExpressions) {
        if (!astService.isDescribe(callExpr)) {
          continue;
        }
        const cb = callExpr.arguments[1];
        if (
          cb &&
          (t.isFunctionExpression(cb) || t.isArrowFunctionExpression(cb)) &&
          t.isBlockStatement(cb.body)
        ) {
          analyzeSuiteForLazyTests(cb.body.body, sourceCode, file, smells);
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running LazyTestDetector");
    }

    return smells;
  }
}
