import * as t from "@babel/types";

import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { jestTestAliases } from "@/shared/aliases";
import astService from "@/ast/ast.service";

export class IdenticalDescriptionTestLogicDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const testCaseSelector = `CallExpression[callee.name=/${jestTestAliases.join("|")}/]`;
      const testCaseNodes = astService.query(ast, testCaseSelector) as t.CallExpression[];
      const testDescriptionSet = new Set<string>();
      for (const node of testCaseNodes) {
        if (node.arguments.length > 0 && t.isStringLiteral(node.arguments[0])) {
          const testDescription = node.arguments[0].value.trim();
          const isInTesDescriptionSet = testDescriptionSet.has(testDescription);

          if (isInTesDescriptionSet) {
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
              message: `Identical Description test case detected.`,
              codeBlock,
            });
          }
          testDescriptionSet.add(testDescription);
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running IdenticalDescriptionTestLogicDetector");
    }
    return smells;
  }
}
