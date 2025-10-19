import { Detector, Smell } from "./detector.interface";

import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";

export class DetectorRunner {
  constructor(private detectors: Detector[]) {}

  /**
   * Runs all detectors against a given file and returns all detected smells.
   */
  async run(file: string): Promise<Smell[]> {
    let ast;
    let sourceCode: string;

    try {
      const parsed = await astService.parseFileToAst(file);
      if (!parsed) {
        logger.warn({ file }, "AST parse returned null/undefined");
        return [];
      }

      ast = parsed;
      sourceCode = await astService.getSourceCode(file);
    } catch (err) {
      logger.error({ err, file }, "Failed to parse file into AST");
      return [];
    }

    const allResults: Smell[][] = [];

    for (const detector of this.detectors) {
      const detectorName = detector.constructor?.name ?? "AnonymousDetector";
      const startTime = performance.now();

      try {
        const result = await detector.detect(ast, sourceCode, file);

        if (Array.isArray(result)) {
          allResults.push(result);
        } else if (result) {
          logger.warn(
            { file, detector: detectorName },
            "Detector returned non-array result; skipping",
          );
        }
      } catch (err) {
        logger.error({ err, file, detector: detectorName }, "Error running detector");
      } finally {
        const elapsed = (performance.now() - startTime).toFixed(1);
        logger.debug({ file, detector: detectorName, elapsedMs: elapsed }, "Detector completed");
      }
    }

    return allResults.flat();
  }
}
