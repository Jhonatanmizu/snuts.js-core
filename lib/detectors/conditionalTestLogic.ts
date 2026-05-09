import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";
import {
  ESQUERY_JEST_TEST_CALLEE_SELECTOR,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

export class ConditionalTestLogicDetector implements Detector {
  /**
   * Detects conditional statements (`if`, `switch`) inside test cases.
   */
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const ifSelector = `${ESQUERY_JEST_TEST_CALLEE_SELECTOR} IfStatement`;
      const switchSelector = `${ESQUERY_JEST_TEST_CALLEE_SELECTOR} SwitchStatement`;

      const ifNodes = astService.query(ast, ifSelector) as t.IfStatement[];
      const switchNodes = astService.query(ast, switchSelector) as t.SwitchStatement[];

      for (const node of [...ifNodes, ...switchNodes]) {
        const start = node.start ?? 0;
        const end = node.end ?? start;
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
    } catch (err) {
      logger.error({ err, file }, "Error while running ConditionalTestLogicDetector");
    }

    return smells;
  }
}
