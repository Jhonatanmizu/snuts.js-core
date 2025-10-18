import fs from "node:fs";

import * as t from "@babel/types";
import traverse, { NodePath } from "@babel/traverse";

import astService from "@/ast/ast.service";

type TestInfo = {
  name: string;
  hasAssert: boolean;
  itCount: number;
  describeCount: number;
};

interface ConditionalTestLogicSmell {
  testInfo: TestInfo | null;
  codeBlock: string;
  startLine: number;
  endLine: number;
}

const detectConditionalTestLogic = (
  ast: t.File,
  sourceCode: string,
): ConditionalTestLogicSmell[] => {
  const smells: ConditionalTestLogicSmell[] = [];
  const ifStatements = new Set<t.IfStatement>();

  // First pass: find all if statements inside test cases
  traverse(ast, {
    CallExpression(path) {
      if (astService.isTestCase(path.node)) {
        const testInfo = astService.testInfo(path as NodePath<t.CallExpression>);
        path.traverse({
          IfStatement(ifPath) {
            const ifNode = ifPath.node;
            if (!ifNode.loc || !ifNode.start || !ifNode.end) return;
            ifStatements.add(ifNode);

            const codeBlock = sourceCode.slice(ifNode.start, ifNode.end);

            smells.push({
              testInfo,
              codeBlock,
              startLine: ifNode.loc.start.line,
              endLine: ifNode.loc.end.line,
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
        const codeBlock = sourceCode.slice(ifNode.start, ifNode.end);
        smells.push({
          testInfo: null,
          codeBlock,
          startLine: ifNode.loc.start.line,
          endLine: ifNode.loc.end.line,
        });
      }
    },
  });

  return smells;
};

export const detectConditionalTestLogicInFile = (filePath: string): ConditionalTestLogicSmell[] => {
  try {
    const code = fs.readFileSync(filePath, "utf-8");
    const ast = astService.parseToAst(code);
    if (!ast) {
      return [];
    }
    return detectConditionalTestLogic(ast, code);
  } catch (error) {
    console.error(`[detectConditionalTestLogicInFile] Failed to analyze file: ${filePath}`, error);
    return [];
  }
};

export default detectConditionalTestLogic;
