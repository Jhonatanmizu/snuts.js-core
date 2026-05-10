import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import {
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
  VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD,
} from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

export class VerboseTestDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const blocks = astService.query(ast, "BlockStatement") as t.BlockStatement[];

      for (const block of blocks) {
        if (block.body.length <= VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD) continue;

        const loc = block.loc;
        const start = block.start ?? 0;
        const end = block.end ?? start;

        smells.push({
          file,
          start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
          end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
          message: `Verbose block detected (${block.body.length} statements; threshold ${VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD}).`,
          codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
          description: SMELL_DESCRIPTIONS.VerboseTest.description,
          explanation: SMELL_DESCRIPTIONS.VerboseTest.explanation,
          severity: SMELL_DESCRIPTIONS.VerboseTest.severity,
        });
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running VerboseTestDetector");
    }

    return smells;
  }
}
