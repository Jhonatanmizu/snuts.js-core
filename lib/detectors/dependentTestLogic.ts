import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { JEST_LIFECYCLE_HOOK_NAME_SET, UNABLE_TO_EXTRACT_CODE_SNIPPET } from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

const MUTATING_OBJECT_METHODS = new Set<string>([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "set",
  "add",
  "delete",
  "clear",
]);

function getDirectSuiteVariables(statements: t.Statement[]): Set<string> {
  const vars = new Set<string>();

  for (const stmt of statements) {
    if (!t.isVariableDeclaration(stmt) || stmt.kind === "const") {
      continue;
    }

    for (const decl of stmt.declarations) {
      if (t.isIdentifier(decl.id)) {
        vars.add(decl.id.name);
      }
    }
  }

  return vars;
}

function collectHookResetVariables(statements: t.Statement[], suiteVars: Set<string>): Set<string> {
  const resetVars = new Set<string>();

  for (const stmt of statements) {
    if (!t.isExpressionStatement(stmt) || !t.isCallExpression(stmt.expression)) {
      continue;
    }

    const call = stmt.expression;
    if (!t.isIdentifier(call.callee) || !JEST_LIFECYCLE_HOOK_NAME_SET.has(call.callee.name)) {
      continue;
    }

    const cb = call.arguments[0];
    if (!cb || (!t.isFunctionExpression(cb) && !t.isArrowFunctionExpression(cb))) {
      continue;
    }

    const assignments = astService.query(
      cb.body,
      "AssignmentExpression",
    ) as t.AssignmentExpression[];
    for (const assign of assignments) {
      if (t.isIdentifier(assign.left) && suiteVars.has(assign.left.name)) {
        resetVars.add(assign.left.name);
      }
    }
  }

  return resetVars;
}

function collectWrittenVariables(body: t.Node, candidateVars: Set<string>): Set<string> {
  const written = new Set<string>();

  const assignments = astService.query(body, "AssignmentExpression") as t.AssignmentExpression[];
  for (const assign of assignments) {
    if (t.isIdentifier(assign.left) && candidateVars.has(assign.left.name)) {
      written.add(assign.left.name);
    }
    if (
      t.isMemberExpression(assign.left) &&
      t.isIdentifier(assign.left.object) &&
      candidateVars.has(assign.left.object.name)
    ) {
      written.add(assign.left.object.name);
    }
  }

  const updates = astService.query(body, "UpdateExpression") as t.UpdateExpression[];
  for (const update of updates) {
    if (t.isIdentifier(update.argument) && candidateVars.has(update.argument.name)) {
      written.add(update.argument.name);
    }
  }

  const calls = astService.query(body, "CallExpression") as t.CallExpression[];
  for (const call of calls) {
    if (
      t.isMemberExpression(call.callee) &&
      t.isIdentifier(call.callee.object) &&
      t.isIdentifier(call.callee.property) &&
      candidateVars.has(call.callee.object.name) &&
      MUTATING_OBJECT_METHODS.has(call.callee.property.name)
    ) {
      written.add(call.callee.object.name);
    }
  }

  return written;
}

function collectReadVariables(body: t.Node, candidateVars: Set<string>): Set<string> {
  const read = new Set<string>();
  const localDeclarations = new Set<string>();

  const declarators = astService.query(body, "VariableDeclarator") as t.VariableDeclarator[];
  for (const decl of declarators) {
    if (t.isIdentifier(decl.id)) {
      localDeclarations.add(decl.id.name);
    }
  }

  function walk(node: t.Node, parent: t.Node | null, parentKey: string | null): void {
    if (t.isIdentifier(node)) {
      const isLeftOfSimpleAssign =
        parent !== null &&
        t.isAssignmentExpression(parent) &&
        parent.operator === "=" &&
        parentKey === "left";
      const isVarId = parent !== null && t.isVariableDeclarator(parent) && parentKey === "id";
      const isPropertyKey =
        parent !== null &&
        t.isMemberExpression(parent) &&
        parentKey === "property" &&
        !parent.computed;

      if (
        !isLeftOfSimpleAssign &&
        !isVarId &&
        !isPropertyKey &&
        !localDeclarations.has(node.name) &&
        candidateVars.has(node.name)
      ) {
        read.add(node.name);
      }
    }

    const keys = t.VISITOR_KEYS[node.type] ?? [];
    for (const key of keys) {
      const child = node[key as keyof typeof node];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (t.isNode(item)) {
            walk(item, node, key);
          }
        }
      } else if (t.isNode(child)) {
        walk(child, node, key);
      }
    }
  }

  walk(body, null, null);
  return read;
}

function analyzeStatementScope(
  statements: t.Statement[],
  sourceCode: string,
  file: string,
  smells: Smell[],
): void {
  const suiteVars = getDirectSuiteVariables(statements);
  const resetInHooks = collectHookResetVariables(statements, suiteVars);
  const unresetVars = new Set<string>(
    [...suiteVars].filter((varName) => !resetInHooks.has(varName)),
  );

  if (unresetVars.size === 0) {
    return;
  }

  const mutatedByPriorTests = new Set<string>();

  for (const stmt of statements) {
    if (!t.isExpressionStatement(stmt) || !t.isCallExpression(stmt.expression)) {
      continue;
    }

    const callExpr = stmt.expression;
    const callback = astService.getTestCallback(callExpr);
    if (!callback) {
      continue;
    }

    const readVars = collectReadVariables(callback.body, unresetVars);
    const writtenVars = collectWrittenVariables(callback.body, unresetVars);

    const dependentVar = [...readVars].find((varName) => mutatedByPriorTests.has(varName));
    if (dependentVar) {
      const loc = callExpr.loc;
      const start = callExpr.start ?? 0;
      const end = callExpr.end ?? start;

      smells.push({
        file,
        start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
        end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
        message: `Dependent test detected: relies on shared state "${dependentVar}" mutated by a previous test.`,
        codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
        description: SMELL_DESCRIPTIONS.DependentTest.description,
        explanation: SMELL_DESCRIPTIONS.DependentTest.explanation,
      });
    }

    for (const writtenVar of writtenVars) {
      mutatedByPriorTests.add(writtenVar);
    }
  }
}

export class DependentTestDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      analyzeStatementScope(ast.program.body, sourceCode, file, smells);

      const callExpressions = astService.query(ast, "CallExpression") as t.CallExpression[];
      for (const callExpr of callExpressions) {
        if (!astService.isDescribe(callExpr)) {
          continue;
        }
        const cb = callExpr.arguments[1];
        if (
          cb &&
          (t.isFunctionExpression(cb) || t.isArrowFunctionExpression(cb)) &&
          t.isBlockStatement(cb.body)
        ) {
          analyzeStatementScope(cb.body.body, sourceCode, file, smells);
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running DependentTestDetector");
    }

    return smells;
  }
}
