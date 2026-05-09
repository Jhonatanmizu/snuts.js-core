import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import {
  JASMINE_SENSITIVE_EQUALITY_MATCHER_NAME_SET,
  JEST_SENSITIVE_EQUALITY_MATCHER_NAME_SET,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

function isToStringMemberCall(node: t.Node): boolean {
  return (
    t.isCallExpression(node) &&
    t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.property, { name: "toString" })
  );
}

export class SensitiveEqualityDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const callExpressions = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const pathNode of callExpressions) {
        const { callee, arguments: args, loc } = pathNode;

        if (
          t.isMemberExpression(callee) &&
          t.isIdentifier(callee.property) &&
          (JEST_SENSITIVE_EQUALITY_MATCHER_NAME_SET.has(callee.property.name) ||
            JASMINE_SENSITIVE_EQUALITY_MATCHER_NAME_SET.has(callee.property.name)) &&
          args.length > 0 &&
          isToStringMemberCall(args[0]!)
        ) {
          smells.push(this.makeSmell(pathNode, sourceCode, file, loc));
        }
      }

      const binaries = astService.query(ast, "BinaryExpression") as t.BinaryExpression[];

      for (const pathNode of binaries) {
        const { left, right, loc } = pathNode;
        if (isToStringMemberCall(left) || isToStringMemberCall(right)) {
          smells.push(this.makeSmell(pathNode, sourceCode, file, loc));
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running SensitiveEqualityDetector");
    }

    return smells;
  }

  private makeSmell(
    node: t.Node,
    sourceCode: string,
    file: string,
    loc: t.SourceLocation | null | undefined,
  ): Smell {
    const start = node.start ?? 0;
    const end = node.end ?? start;

    return {
      file,
      start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
      end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
      message: "Sensitive equality involving string conversion detected.",
      codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
      description: SMELL_DESCRIPTIONS.SensitiveEquality.description,
      explanation: SMELL_DESCRIPTIONS.SensitiveEquality.explanation,
    };
  }
}
