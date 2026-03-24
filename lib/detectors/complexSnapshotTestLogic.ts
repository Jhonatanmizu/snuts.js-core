import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";

const MAX_LINES_IN_SNAPSHOT = 50;

const INLINE_SNAPSHOT_SELECTOR =
  "ExpressionStatement:has(CallExpression[callee.property.name='toMatchInlineSnapshot'])";

const EXTERNAL_SNAPSHOT_SELECTOR =
  "ExpressionStatement:has(AssignmentExpression[left.type='MemberExpression'][left.property.type='TemplateLiteral'])";

function isComplexQuasi(quasis: t.TemplateElement[] | undefined): boolean {
  const quasi = quasis?.[0];
  if (!quasi?.loc) return false;
  return quasi.loc.end.line - quasi.loc.start.line > MAX_LINES_IN_SNAPSHOT;
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
    message: `Complex ${kind} snapshot detected: snapshot exceeds ${MAX_LINES_IN_SNAPSHOT} lines. Consider simplifying the tested output or breaking it into smaller assertions.`,
    codeBlock:
      sourceCode.slice(node.start ?? 0, node.end ?? 0) || "// Unable to extract code snippet",
  };
}

export class ComplexSnapshotTestLogicDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const inlineNodes = astService.query(
        ast,
        INLINE_SNAPSHOT_SELECTOR,
      ) as t.ExpressionStatement[];
      const externalNodes = astService.query(
        ast,
        EXTERNAL_SNAPSHOT_SELECTOR,
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
