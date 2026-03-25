import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";

interface SetupVariableOccurrence {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  sourceStart: number;
  sourceEnd: number;
}

const SETUP_HOOKS = new Set(["beforeAll", "beforeEach"]);
const UNABLE_TO_EXTRACT_SNIPPET = "// Unable to extract code snippet";

export class GeneralFixtureTestLogicDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];
    const setupVariables = new Map<string, SetupVariableOccurrence[]>();
    const usedVariables = new Set<string>();

    try {
      const callExpressionNodes = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const callExpressionNode of callExpressionNodes) {
        if (isSetupHookCall(callExpressionNode)) {
          const setupCallback = getFunctionArg(callExpressionNode, 0);
          if (!setupCallback || !t.isBlockStatement(setupCallback.body)) {
            continue;
          }

          collectSetupVariables(setupCallback.body, setupVariables);
          continue;
        }

        if (!astService.isTestCase(callExpressionNode)) {
          continue;
        }

        const testCallback = getFunctionArg(callExpressionNode, 1);
        if (!testCallback) {
          continue;
        }

        collectUsedVariables(testCallback.body, setupVariables, usedVariables);
      }

      for (const [variableName, occurrences] of setupVariables.entries()) {
        if (usedVariables.has(variableName)) {
          continue;
        }

        for (const occurrence of occurrences) {
          const codeBlock =
            sourceCode.slice(occurrence.sourceStart, occurrence.sourceEnd) ||
            UNABLE_TO_EXTRACT_SNIPPET;

          smells.push({
            file,
            start: { line: occurrence.startLine, column: occurrence.startColumn },
            end: { line: occurrence.endLine, column: occurrence.endColumn },
            message: `General fixture detected: setup variable "${variableName}" is never used in test cases.`,
            codeBlock,
          });
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running GeneralFixtureTestLogicDetector");
    }

    return smells;
  }
}

function isSetupHookCall(callExpressionNode: t.CallExpression): boolean {
  return (
    t.isIdentifier(callExpressionNode.callee) && SETUP_HOOKS.has(callExpressionNode.callee.name)
  );
}

function getFunctionArg(
  callExpressionNode: t.CallExpression,
  index: number,
): t.FunctionExpression | t.ArrowFunctionExpression | null {
  const arg = callExpressionNode.arguments[index];
  if (!arg || !astService.isFunction(arg)) {
    return null;
  }

  if (t.isFunctionExpression(arg) || t.isArrowFunctionExpression(arg)) {
    return arg;
  }

  return null;
}

function collectSetupVariables(
  setupBody: t.BlockStatement,
  setupVariables: Map<string, SetupVariableOccurrence[]>,
): void {
  const declarators = astService.query(
    setupBody,
    "VariableDeclarator[id.type='Identifier']",
  ) as t.VariableDeclarator[];
  const assignments = astService.query(
    setupBody,
    "AssignmentExpression[left.type='Identifier']",
  ) as t.AssignmentExpression[];

  for (const declarator of declarators) {
    if (!t.isIdentifier(declarator.id)) {
      continue;
    }

    addSetupVariableOccurrence(declarator.id.name, declarator, setupVariables);
  }

  for (const assignment of assignments) {
    if (!t.isIdentifier(assignment.left)) {
      continue;
    }

    addSetupVariableOccurrence(assignment.left.name, assignment.left, setupVariables);
  }
}

function addSetupVariableOccurrence(
  variableName: string,
  node: t.Node,
  setupVariables: Map<string, SetupVariableOccurrence[]>,
): void {
  const start = node.start ?? 0;
  const end = node.end ?? start;
  const loc = node.loc;

  const occurrence: SetupVariableOccurrence = {
    startLine: loc?.start.line ?? 0,
    startColumn: loc?.start.column ?? 0,
    endLine: loc?.end.line ?? 0,
    endColumn: loc?.end.column ?? 0,
    sourceStart: start,
    sourceEnd: end,
  };

  const existingOccurrences = setupVariables.get(variableName) ?? [];
  existingOccurrences.push(occurrence);
  setupVariables.set(variableName, existingOccurrences);
}

function collectUsedVariables(
  testBody: t.BlockStatement | t.Expression,
  setupVariables: Map<string, SetupVariableOccurrence[]>,
  usedVariables: Set<string>,
): void {
  visitNode(testBody, null, null, setupVariables, usedVariables);
}

function visitNode(
  node: t.Node,
  parent: t.Node | null,
  parentKey: string | null,
  setupVariables: Map<string, SetupVariableOccurrence[]>,
  usedVariables: Set<string>,
): void {
  if (t.isIdentifier(node)) {
    const isUsage = isIdentifierUsage(node, parent, parentKey);
    if (isUsage && setupVariables.has(node.name)) {
      usedVariables.add(node.name);
    }
  }

  const visitorKeys = t.VISITOR_KEYS[node.type] ?? [];
  for (const key of visitorKeys) {
    const childNode = node[key as keyof typeof node];
    if (Array.isArray(childNode)) {
      for (const item of childNode) {
        if (t.isNode(item)) {
          visitNode(item, node, key, setupVariables, usedVariables);
        }
      }
      continue;
    }

    if (t.isNode(childNode)) {
      visitNode(childNode, node, key, setupVariables, usedVariables);
    }
  }
}

function isIdentifierUsage(
  identifier: t.Identifier,
  parent: t.Node | null,
  parentKey: string | null,
): boolean {
  if (!parent || !parentKey) {
    return true;
  }

  if (t.isVariableDeclarator(parent) && parentKey === "id") {
    return false;
  }

  if (
    (t.isFunctionDeclaration(parent) ||
      t.isFunctionExpression(parent) ||
      t.isArrowFunctionExpression(parent)) &&
    parentKey === "params"
  ) {
    return false;
  }

  if (t.isClassMethod(parent) && parentKey === "params") {
    return false;
  }

  if (t.isClassPrivateMethod(parent) && parentKey === "params") {
    return false;
  }

  if (t.isObjectMethod(parent) && parentKey === "params") {
    return false;
  }

  if (t.isAssignmentExpression(parent) && parentKey === "left") {
    return false;
  }

  if (t.isObjectProperty(parent) && parentKey === "key" && !parent.computed) {
    return false;
  }

  if (t.isObjectMethod(parent) && parentKey === "key" && !parent.computed) {
    return false;
  }

  if (t.isMemberExpression(parent) && parentKey === "property" && !parent.computed) {
    return false;
  }

  if (t.isLabeledStatement(parent) && parentKey === "label") {
    return false;
  }

  return true;
}
