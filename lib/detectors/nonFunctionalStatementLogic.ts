import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { UNABLE_TO_EXTRACT_CODE_SNIPPET } from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

export class NonFunctionalStatementDetector implements Detector {
  /**
   * Flags empty block statements with no comments (aligned with SNUTS.js v1).
   */
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const blocks = astService.query(ast, "BlockStatement") as t.BlockStatement[];

      for (const block of blocks) {
        if (block.body.length !== 0) continue;

        const hasComment =
          (block.leadingComments?.length ?? 0) > 0 ||
          (block.trailingComments?.length ?? 0) > 0 ||
          (block.innerComments?.length ?? 0) > 0;

        if (hasComment) continue;

        const loc = block.loc;
        const start = block.start ?? 0;
        const end = block.end ?? start;

        smells.push({
          file,
          start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
          end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
          message: "Empty block without explanatory comments detected.",
          codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
          description: SMELL_DESCRIPTIONS.NonFunctionalStatement.description,
          explanation: SMELL_DESCRIPTIONS.NonFunctionalStatement.explanation,
          severity: SMELL_DESCRIPTIONS.NonFunctionalStatement.severity,
        });
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running NonFunctionalStatementDetector");
    }

    return smells;
  }
}
