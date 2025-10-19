import * as t from "@babel/types";
import { NodePath } from "@babel/traverse";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";
import { traverse } from "@/shared/traverse";

export class ConditionalTestLogicDetector implements Detector {
  /**
   * Detects conditional statements (`if`, `switch`) inside test cases.
   */
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      traverse(ast, {
        IfStatement: (path: NodePath<t.IfStatement>) => {
          if (this.isInsideTestCase(path)) {
            const ifNode = path.node;

            const start = ifNode.start ?? 0;
            const end = ifNode.end ?? start;
            const loc = ifNode.loc;

            const startLine = loc?.start.line ?? 0;
            const endLine = loc?.end.line ?? 0;

            const codeBlock = sourceCode.slice(start, end) || "// Unable to extract code snippet";

            smells.push({
              file,
              start: { line: startLine, column: loc?.start.column ?? 0 },
              end: { line: endLine, column: loc?.end.column ?? 0 },
              message: "Conditional logic inside test case detected",
              codeBlock,
            });
          }
        },
        SwitchStatement: (path: NodePath<t.SwitchStatement>) => {
          if (this.isInsideTestCase(path)) {
            const node = path.node;

            const start = node.start ?? 0;
            const end = node.end ?? start;
            const loc = node.loc;

            const startLine = loc?.start.line ?? 0;
            const endLine = loc?.end.line ?? 0;

            const codeBlock = sourceCode.slice(start, end) || "// Unable to extract code snippet";

            smells.push({
              file,
              start: { line: startLine, column: loc?.start.column ?? 0 },
              end: { line: endLine, column: loc?.end.column ?? 0 },
              message: "Conditional logic (switch) inside test case detected",
              codeBlock,
            });
          }
        },
      });
    } catch (err) {
      logger.error({ err, file }, "Error while running ConditionalTestLogicDetector");
    }

    return smells;
  }

  private isInsideTestCase(path: NodePath<t.Node>): boolean {
    return (
      path.findParent(
        (parent) => parent.isCallExpression() && astService.isTestCase(parent.node),
      ) !== null
    );
  }
}
