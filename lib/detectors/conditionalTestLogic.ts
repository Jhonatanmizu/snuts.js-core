import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";
import { UNABLE_TO_EXTRACT_CODE_SNIPPET } from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

const CONDITIONAL_SELECTOR = [
  "IfStatement",
  "SwitchStatement",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
  "ConditionalExpression",
].join(", ");

export class ConditionalTestLogicDetector implements Detector {
  /**
   * Detects conditional and loop control-flow constructs (`if`, `switch`, `for`, `for..in`,
   * `for..of`, `while`, `do..while`, and ternary `ConditionalExpression`) inside test cases.
   */
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const callExpressions = astService.query(ast, "CallExpression") as t.CallExpression[];
      const seenOffsets = new Set<string>();

      for (const callExpr of callExpressions) {
        const callback = astService.getTestCallback(callExpr);
        if (!callback) {
          continue;
        }

        const conditionalNodes = astService.query(callback.body, CONDITIONAL_SELECTOR);

        for (const node of conditionalNodes) {
          const start = node.start ?? 0;
          const end = node.end ?? start;
          const offsetKey = `${start}:${end}:${node.type}`;
          if (seenOffsets.has(offsetKey)) {
            continue;
          }
          seenOffsets.add(offsetKey);

          const loc = node.loc;
          const startLine = loc?.start.line ?? 0;
          const endLine = loc?.end.line ?? 0;
          const codeBlock = sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET;

          smells.push({
            file,
            start: { line: startLine, column: loc?.start.column ?? 0 },
            end: { line: endLine, column: loc?.end.column ?? 0 },
            message: `Conditional logic inside test case detected: ${node.type}`,
            codeBlock,
            description: SMELL_DESCRIPTIONS.ConditionalTestLogic.description,
            explanation: SMELL_DESCRIPTIONS.ConditionalTestLogic.explanation,
          });
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running ConditionalTestLogicDetector");
    }

    return smells;
  }
}
