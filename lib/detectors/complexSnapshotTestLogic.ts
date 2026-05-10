import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";
import {
  COMPLEX_SNAPSHOT_MAX_QUASI_LINE_SPAN,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import {
  COMPLEX_SNAPSHOT_EXTERNAL_ESQUERY_SELECTOR,
  COMPLEX_SNAPSHOT_INLINE_ESQUERY_SELECTOR,
} from "@/shared/selectors";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

function isComplexQuasi(quasis: t.TemplateElement[] | undefined): boolean {
  const quasi = quasis?.[0];
  if (!quasi?.loc) return false;
  return quasi.loc.end.line - quasi.loc.start.line > COMPLEX_SNAPSHOT_MAX_QUASI_LINE_SPAN;
}

function buildSmell(
  node: t.ExpressionStatement,
  sourceCode: string,
  file: string,
  kind: "inline" | "external",
): Smell {
  return {
    file,
    start: { line: node.loc?.start.line ?? 0, column: node.loc?.start.column ?? 0 },
    end: { line: node.loc?.end.line ?? 0, column: node.loc?.end.column ?? 0 },
    message: `Complex ${kind} snapshot detected: snapshot exceeds ${COMPLEX_SNAPSHOT_MAX_QUASI_LINE_SPAN} lines. Consider simplifying the tested output or breaking it into smaller assertions.`,
    codeBlock: sourceCode.slice(node.start ?? 0, node.end ?? 0) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
    description: SMELL_DESCRIPTIONS.ComplexSnapshotTest.description,
    explanation: SMELL_DESCRIPTIONS.ComplexSnapshotTest.explanation,
    severity: SMELL_DESCRIPTIONS.ComplexSnapshotTest.severity,
  };
}

export class ComplexSnapshotTestLogicDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const inlineNodes = astService.query(
        ast,
        COMPLEX_SNAPSHOT_INLINE_ESQUERY_SELECTOR,
      ) as t.ExpressionStatement[];
      const externalNodes = astService.query(
        ast,
        COMPLEX_SNAPSHOT_EXTERNAL_ESQUERY_SELECTOR,
      ) as t.ExpressionStatement[];

      for (const node of inlineNodes) {
        const callExpr = node.expression as t.CallExpression;
        const templateArg = callExpr.arguments[0] as t.TemplateLiteral | undefined;

        if (templateArg?.type === "TemplateLiteral" && isComplexQuasi(templateArg.quasis)) {
          smells.push(buildSmell(node, sourceCode, file, "inline"));
        }
      }

      for (const node of externalNodes) {
        const assignExpr = node.expression as t.AssignmentExpression;
        const right = assignExpr.right as t.TemplateLiteral | undefined;

        if (right?.type === "TemplateLiteral" && isComplexQuasi(right.quasis)) {
          smells.push(buildSmell(node, sourceCode, file, "external"));
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running ComplexSnapshotTestLogicDetector");
    }

    return smells;
  }
}
