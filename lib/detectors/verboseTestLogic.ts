import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

const UNABLE = "// Unable to extract code snippet";

/** Same threshold as SNUTS.js v1 `verboseTest.js`. */
const VERBOSE_STATEMENT_THRESHOLD = 13;

export class VerboseTestDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const blocks = astService.query(ast, "BlockStatement") as t.BlockStatement[];

      for (const block of blocks) {
        if (block.body.length <= VERBOSE_STATEMENT_THRESHOLD) continue;

        const loc = block.loc;
        const start = block.start ?? 0;
        const end = block.end ?? start;

        smells.push({
          file,
          start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
          end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
          message: `Verbose block detected (${block.body.length} statements; threshold ${VERBOSE_STATEMENT_THRESHOLD}).`,
          codeBlock: sourceCode.slice(start, end) || UNABLE,
          description: SMELL_DESCRIPTIONS.VerboseTest.description,
          explanation: SMELL_DESCRIPTIONS.VerboseTest.explanation,
        });
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running VerboseTestDetector");
    }

    return smells;
  }
}
