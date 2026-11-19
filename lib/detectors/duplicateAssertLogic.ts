import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { UNABLE_TO_EXTRACT_CODE_SNIPPET } from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

function normalizeAssertionSource(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export class DuplicateAssertDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const callExpressions = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const callExpr of callExpressions) {
        const callback = astService.getTestCallback(callExpr);
        if (!callback || !t.isBlockStatement(callback.body)) {
          continue;
        }

        const seenAssertions = new Set<string>();
        const statements = astService.query(
          callback.body,
          "ExpressionStatement",
        ) as t.ExpressionStatement[];

        for (const stmt of statements) {
          if (!astService.isAssertionStatement(stmt)) {
            continue;
          }

          const start = stmt.start ?? 0;
          const end = stmt.end ?? start;
          const rawCode = sourceCode.slice(start, end);
          const normalized = normalizeAssertionSource(rawCode);
          if (!normalized) {
            continue;
          }

          if (seenAssertions.has(normalized)) {
            const loc = stmt.loc;
            smells.push({
              file,
              start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
              end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
              message: "Duplicate assertion detected inside the same test case.",
              codeBlock: rawCode || UNABLE_TO_EXTRACT_CODE_SNIPPET,
              description: SMELL_DESCRIPTIONS.DuplicateAssert.description,
              explanation: SMELL_DESCRIPTIONS.DuplicateAssert.explanation,
            });
          } else {
            seenAssertions.add(normalized);
          }
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running DuplicateAssertDetector");
    }

    return smells;
  }
}
