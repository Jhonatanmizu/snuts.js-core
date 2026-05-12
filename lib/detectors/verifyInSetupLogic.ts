import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { UNABLE_TO_EXTRACT_CODE_SNIPPET } from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

export class VerifyInSetupDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const calls = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const node of calls) {
        if (!astService.isSetupHookCall(node)) continue;

        const cb = node.arguments[0];
        if (!cb) continue;
        if (!t.isFunctionExpression(cb) && !t.isArrowFunctionExpression(cb)) continue;
        if (!t.isBlockStatement(cb.body)) continue;

        const hasAssert = cb.body.body.some((stmt: t.Statement) =>
          astService.isAssertionStatement(stmt),
        );
        if (!hasAssert) continue;

        const loc = node.loc;
        const start = node.start ?? 0;
        const end = node.end ?? start;

        smells.push({
          file,
          start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
          end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
          message: "Assertion detected inside a setup/teardown hook.",
          codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
          description: SMELL_DESCRIPTIONS.VerifyInSetup.description,
          explanation: SMELL_DESCRIPTIONS.VerifyInSetup.explanation,
          severity: SMELL_DESCRIPTIONS.VerifyInSetup.severity,
        });
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running VerifyInSetupDetector");
    }

    return smells;
  }
}
