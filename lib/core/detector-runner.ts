import { Detector, Smell } from "./detector.interface";

import astService from "@/ast/ast.service";

export class DetectorRunner {
  constructor(private detectors: Detector[]) {}

  async run(file: string): Promise<Smell[]> {
    const ast = astService.parseFileToAst(file);
    if (!ast) {
      return [];
    }

    const sourceCode = astService.getSourceCode(file);
    const results = await Promise.all(
      this.detectors.map(async (detector) => {
        try {
          return await detector.detect(ast, sourceCode, file);
        } catch (error) {
          console.error(`Error running detector on file ${file}:`, error);
          return [];
        }
      }),
    );
    return results.flat();
  }
}
