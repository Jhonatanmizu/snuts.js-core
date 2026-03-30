import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { jestTestAliases } from "@/shared/aliases";
import { logger } from "@/shared/logger";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

const TEST_CALL_SELECTOR = `CallExpression[callee.name=/${jestTestAliases.join("|")}/]`;

const extractTestName = (callee: t.Expression | t.V8IntrinsicIdentifier): string | null => {
  if (t.isIdentifier(callee)) {
    return callee.name;
  }

  if (t.isMemberExpression(callee) && t.isIdentifier(callee.object)) {
    return callee.object.name;
  }

  return null;
};

const hasRunnableCallback = (
  args: ReadonlyArray<t.Expression | t.SpreadElement | t.ArgumentPlaceholder>,
): boolean => args.some((arg) => t.isFunctionExpression(arg) || t.isArrowFunctionExpression(arg));

const hasValidDescription = (
  descriptionArg: t.Expression | t.SpreadElement | t.ArgumentPlaceholder | undefined,
): boolean => {
  if (!descriptionArg || !t.isStringLiteral(descriptionArg)) {
    return false;
  }

  const words = descriptionArg.value.trim().split(/\s+/).filter(Boolean);
  return words.length > 0;
};

export class DetectorTestWithoutDescriptionLogic implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];
    try {
      const callExpressionNodes = astService.query(ast, TEST_CALL_SELECTOR) as t.CallExpression[];

      for (const callExpressionNode of callExpressionNodes) {
        const testName = extractTestName(callExpressionNode.callee);
        if (!testName || !jestTestAliases.includes(testName)) {
          continue;
        }

        if (!hasRunnableCallback(callExpressionNode.arguments)) {
          continue;
        }

        const descriptionArg = callExpressionNode.arguments[0];
        if (hasValidDescription(descriptionArg)) {
          continue;
        }

        const start = callExpressionNode.start ?? 0;
        const end = callExpressionNode.end ?? start;
        const loc = callExpressionNode.loc;

        const codeBlock = sourceCode.slice(start, end) || "// Unable to extract code snippet";

        smells.push({
          file,
          message: "Test case without description detected",
          start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
          end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
          codeBlock,
          description: SMELL_DESCRIPTIONS.TestWithoutDescription.description,
          explanation: SMELL_DESCRIPTIONS.TestWithoutDescription.explanation,
        });
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running DetectorTestWithoutDescriptionLogic");
    }

    return smells;
  }
}
