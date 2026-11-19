import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import {
  FOCUSED_TEST_API_ROOT_NAME_SET,
  IGNORED_TEST_MEMBER_PROPERTY_NAME_SET,
  IGNORED_TEST_STANDALONE_NAME_SET,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

function resolveIgnoredApiLabel(callee: t.Expression | t.V8IntrinsicIdentifier): string | null {
  if (t.isIdentifier(callee) && IGNORED_TEST_STANDALONE_NAME_SET.has(callee.name)) {
    return callee.name;
  }

  if (
    t.isMemberExpression(callee) &&
    t.isIdentifier(callee.object) &&
    t.isIdentifier(callee.property) &&
    FOCUSED_TEST_API_ROOT_NAME_SET.has(callee.object.name) &&
    IGNORED_TEST_MEMBER_PROPERTY_NAME_SET.has(callee.property.name)
  ) {
    return `${callee.object.name}.${callee.property.name}`;
  }

  return null;
}

export class IgnoredTestDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const calls = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const node of calls) {
        const apiLabel = resolveIgnoredApiLabel(node.callee);
        if (!apiLabel) {
          continue;
        }

        const loc = node.loc;
        const start = node.start ?? 0;
        const end = node.end ?? start;

        smells.push({
          file,
          start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
          end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
          message: `Ignored test API detected: ${apiLabel}`,
          codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
          description: SMELL_DESCRIPTIONS.IgnoredTest.description,
          explanation: SMELL_DESCRIPTIONS.IgnoredTest.explanation,
        });
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running IgnoredTestDetector");
    }

    return smells;
  }
}
