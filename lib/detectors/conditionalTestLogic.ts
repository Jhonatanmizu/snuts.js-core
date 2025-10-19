import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";
import { jestTestAliases } from "@/shared/aliases";

export class ConditionalTestLogicDetector implements Detector {
  /**
   * Detects conditional statements (`if`, `switch`) inside test cases.
   */
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const testCaseSelector = `CallExpression[callee.name=/${jestTestAliases.join("|")}/]`;
      const ifSelector = `${testCaseSelector} IfStatement`;
      const switchSelector = `${testCaseSelector} SwitchStatement`;

      const ifNodes = astService.query(ast, ifSelector) as t.IfStatement[];
      const switchNodes = astService.query(ast, switchSelector) as t.SwitchStatement[];

      for (const node of [...ifNodes, ...switchNodes]) {
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
          message: `Conditional logic inside test case detected: ${node.type}`,
          codeBlock,
        });
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running ConditionalTestLogicDetector");
    }

    return smells;
  }
}