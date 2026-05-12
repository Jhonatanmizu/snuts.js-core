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

      ast = parsed.ast;
      sourceCode = parsed.code;
    } catch (err) {
      logger.error({ err, file }, "Failed to parse file into AST");
      return [];
    }

    const results = await Promise.all(
      this.detectors.map(async (detector) => {
        const name = detector.constructor?.name ?? "AnonymousDetector";
        const t0 = performance.now();
        try {
          const result = await detector.detect(ast, sourceCode, file);
          return Array.isArray(result) ? result : [];
        } catch (err) {
          logger.error({ err, file, detector: name }, "Error running detector");
          return [];
        } finally {
          logger.debug(
            { file, detector: name, elapsedMs: (performance.now() - t0).toFixed(1) },
            "Detector completed",
          );
        }
      }),
    );

    return results.flat();
  }
}
