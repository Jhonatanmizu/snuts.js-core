import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { UNABLE_TO_EXTRACT_CODE_SNIPPET } from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

function isExpectNotBeAssertion(node: t.CallExpression): boolean {
  const { callee } = node;
  if (!t.isMemberExpression(callee)) return false;
  const mid = callee.object;
  if (!t.isMemberExpression(mid)) return false;
  if (!t.isIdentifier(mid.property, { name: "not" })) return false;
  const inner = mid.object;
  if (!t.isCallExpression(inner)) return false;
  if (!t.isIdentifier(inner.callee, { name: "expect" })) return false;
  return true;
}

function isExpectToBeAssertion(node: t.CallExpression): boolean {
  const { callee } = node;
  if (!t.isMemberExpression(callee)) return false;
  if (!t.isIdentifier(callee.property, { name: "toBe" })) return false;
  const obj = callee.object;
  if (!t.isCallExpression(obj)) return false;
  return t.isIdentifier(obj.callee, { name: "expect" });
}

function isUndefinedLike(node: t.CallExpression): boolean {
  if (node.arguments.length !== 1) return false;
  const arg0 = node.arguments[0]!;
  if (t.isUnaryExpression(arg0) && arg0.operator === "void") return true;
  if (t.isNullLiteral(arg0)) return true;
  if (t.isIdentifier(arg0) && /^(undefined|null)$/.test(arg0.name)) return true;
  return false;
}

function isUsingDotLength(node: t.CallExpression): boolean {
  const { callee } = node;
  if (!t.isMemberExpression(callee)) return false;
  const obj = callee.object;
  if (!t.isCallExpression(obj)) return false;
  if (obj.arguments.length !== 1) return false;
  const innerArg = obj.arguments[0];
  if (!innerArg) return false;
  return t.isMemberExpression(innerArg) && t.isIdentifier(innerArg.property, { name: "length" });
}

function isArgBinaryExpression(node: t.CallExpression): boolean {
  return node.arguments.length === 1 && t.isBinaryExpression(node.arguments[0]);
}

export class SubOptimalAssertDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const calls = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const node of calls) {
        const { callee } = node;

        if (
          t.isMemberExpression(callee) &&
          (t.isCallExpression(callee.object) || t.isMemberExpression(callee.object)) &&
          t.isIdentifier(callee.property)
        ) {
          if (isExpectToBeAssertion(node)) {
            if (isUndefinedLike(node) || isUsingDotLength(node)) {
              smells.push(this.emit(node, sourceCode, file));
            }
          } else if (isExpectNotBeAssertion(node)) {
            if (isUndefinedLike(node)) {
              smells.push(this.emit(node, sourceCode, file));
            }
          }
        } else if (t.isIdentifier(callee, { name: "expect" }) && isArgBinaryExpression(node)) {
          smells.push(this.emit(node, sourceCode, file));
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running SubOptimalAssertDetector");
    }

    return smells;
  }

  private emit(node: t.CallExpression, sourceCode: string, file: string): Smell {
    const loc = node.loc;
    const start = node.start ?? 0;
    const end = node.end ?? start;

    return {
      file,
      start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
      end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
      message: "Suboptimal assertion pattern detected.",
      codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
      description: SMELL_DESCRIPTIONS.SubOptimalAssert.description,
      explanation: SMELL_DESCRIPTIONS.SubOptimalAssert.explanation,
      severity: SMELL_DESCRIPTIONS.SubOptimalAssert.severity,
    };
  }
}
