import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";

export class ConditionalTestLogicDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const { default: traverse } = await import("@babel/traverse");

    const smells: Smell[] = [];
    const ifStatements = new Set<t.IfStatement>();

    // First pass: find all if statements inside test cases
    traverse(ast, {
      CallExpression(path) {
        if (astService.isTestCase(path.node)) {
          path.traverse({
            IfStatement(ifPath) {
              const ifNode = ifPath.node;
              if (!ifNode.loc || !ifNode.start || !ifNode.end) return;
              ifStatements.add(ifNode);

              smells.push({
                file,
                ...ifNode.loc,
                message: "Conditional test logic detected",
                codeBlock: sourceCode.substring(ifNode.start, ifNode.end),
              });
            },
          });
        }
      },
    });

    // Second pass: find all if statements not already found (i.e., outside test cases)
    traverse(ast, {
      IfStatement(path) {
        if (!ifStatements.has(path.node)) {
          const ifNode = path.node;
          if (!ifNode.loc || !ifNode.start || !ifNode.end) return;

          smells.push({
            file,
            ...ifNode.loc,
            message: "Conditional logic outside of test case detected",
            codeBlock: sourceCode.substring(ifNode.start, ifNode.end),
          });
        }
      },
    });

    return smells;
  }
}
