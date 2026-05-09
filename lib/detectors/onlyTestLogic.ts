import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

const UNABLE = "// Unable to extract code snippet";
const FOCUSED_ROOTS = new Set(["it", "test", "describe"]);

export class OnlyTestDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const calls = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const node of calls) {
        const { callee } = node;
        if (!t.isMemberExpression(callee)) continue;
        if (!t.isIdentifier(callee.property) || callee.property.name !== "only") continue;
        if (!t.isIdentifier(callee.object) || !FOCUSED_ROOTS.has(callee.object.name)) continue;

        const loc = node.loc;
        const start = node.start ?? 0;
        const end = node.end ?? start;

        smells.push({
          file,
          start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
          end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
          message: `Focused test API detected: ${callee.object.name}.only`,
          codeBlock: sourceCode.slice(start, end) || UNABLE,
          description: SMELL_DESCRIPTIONS.OnlyTest.description,
          explanation: SMELL_DESCRIPTIONS.OnlyTest.explanation,
        });
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running OnlyTestDetector");
    }

    return smells;
  }
}
