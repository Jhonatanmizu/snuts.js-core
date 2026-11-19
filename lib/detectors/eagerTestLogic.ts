import * as t from "@babel/types";

import astService from "@/ast/ast.service";
import { Detector, Smell } from "@/core/detector.interface";
import { logger } from "@/shared/logger";
import { UNABLE_TO_EXTRACT_CODE_SNIPPET } from "@/shared/constants";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

const IGNORED_OBJECT_NAMES = new Set<string>([
  "expect",
  "assert",
  "console",
  "jest",
  "vi",
  "sinon",
  "Math",
  "JSON",
  "Object",
  "Array",
  "String",
  "Number",
  "Boolean",
  "Promise",
  "Date",
  "RegExp",
  "Error",
  "Map",
  "Set",
  " WeakMap",
  "WeakSet",
  "Symbol",
  "Reflect",
  "Proxy",
  "Intl",
  "process",
  "global",
  "globalThis",
  "window",
  "document",
  "path",
  "fs",
  "fsPromises",
  "os",
  "url",
  "util",
  "http",
  "https",
  "net",
  "child_process",
  "crypto",
  "stream",
  "buffer",
  "Buffer",
  "timers",
  "localStorage",
  "sessionStorage",
]);

const IGNORED_METHOD_NAMES = new Set<string>([
  "toString",
  "valueOf",
  "toJSON",
  "slice",
  "trim",
  "split",
  "join",
  "map",
  "filter",
  "reduce",
  "forEach",
  "find",
  "findIndex",
  "some",
  "every",
  "includes",
  "indexOf",
  "push",
  "pop",
  "shift",
  "unshift",
  "concat",
  "flat",
  "flatMap",
  "sort",
  "reverse",
  "keys",
  "values",
  "entries",
  "has",
  "get",
  "set",
  "delete",
  "clear",
  "then",
  "catch",
  "finally",
  "bind",
  "call",
  "apply",
  "mockClear",
  "mockReset",
  "mockRestore",
  "mockImplementation",
  "mockReturnValue",
  "mockResolvedValue",
  "mockRejectedValue",
]);

export function collectSutVariables(
  ast: t.File,
  excludedVariables = new Set<string>(),
): Set<string> {
  const sutVars = new Set<string>();

  const declarators = astService.query(ast, "VariableDeclarator") as t.VariableDeclarator[];
  for (const decl of declarators) {
    if (!t.isIdentifier(decl.id) || !decl.init || excludedVariables.has(decl.id.name)) {
      continue;
    }
    if (
      t.isNewExpression(decl.init) &&
      t.isIdentifier(decl.init.callee) &&
      !IGNORED_OBJECT_NAMES.has(decl.init.callee.name)
    ) {
      sutVars.add(decl.id.name);
    }
  }

  const assignments = astService.query(ast, "AssignmentExpression") as t.AssignmentExpression[];
  for (const assign of assignments) {
    if (!t.isIdentifier(assign.left) || excludedVariables.has(assign.left.name)) {
      continue;
    }
    if (
      t.isNewExpression(assign.right) &&
      t.isIdentifier(assign.right.callee) &&
      !IGNORED_OBJECT_NAMES.has(assign.right.callee.name)
    ) {
      sutVars.add(assign.left.name);
    }
  }

  return sutVars;
}

export function collectTestSutMethodCalls(
  testBody: t.Node,
  knownSutVars: Set<string>,
): Map<string, Set<string>> {
  const localSutVars = new Set<string>(knownSutVars);

  const localDeclarators = astService.query(
    testBody,
    "VariableDeclarator",
  ) as t.VariableDeclarator[];
  for (const decl of localDeclarators) {
    if (
      t.isIdentifier(decl.id) &&
      decl.init &&
      t.isNewExpression(decl.init) &&
      t.isIdentifier(decl.init.callee) &&
      !IGNORED_OBJECT_NAMES.has(decl.init.callee.name)
    ) {
      localSutVars.add(decl.id.name);
    }
  }

  return collectSutMethodCallsFromSet(testBody, localSutVars);
}

export function collectLocalTestSutMethodCalls(testBody: t.Node): Map<string, Set<string>> {
  const localSutVars = new Set<string>();

  const localDeclarators = astService.query(
    testBody,
    "VariableDeclarator",
  ) as t.VariableDeclarator[];
  for (const decl of localDeclarators) {
    if (
      t.isIdentifier(decl.id) &&
      decl.init &&
      t.isNewExpression(decl.init) &&
      t.isIdentifier(decl.init.callee) &&
      !IGNORED_OBJECT_NAMES.has(decl.init.callee.name)
    ) {
      localSutVars.add(decl.id.name);
    }
  }

  return collectSutMethodCallsFromSet(testBody, localSutVars);
}

function collectSutMethodCallsFromSet(
  testBody: t.Node,
  sutVars: Set<string>,
): Map<string, Set<string>> {
  const methodsByObject = new Map<string, Set<string>>();
  const calls = astService.query(testBody, "CallExpression") as t.CallExpression[];

  for (const call of calls) {
    const { callee } = call;
    if (
      !t.isMemberExpression(callee) ||
      !t.isIdentifier(callee.object) ||
      !t.isIdentifier(callee.property)
    ) {
      continue;
    }

    const objName = callee.object.name;
    const methodName = callee.property.name;

    if (
      IGNORED_OBJECT_NAMES.has(objName) ||
      IGNORED_METHOD_NAMES.has(methodName) ||
      !sutVars.has(objName)
    ) {
      continue;
    }

    const methods = methodsByObject.get(objName) ?? new Set<string>();
    methods.add(methodName);
    methodsByObject.set(objName, methods);
  }

  return methodsByObject;
}

export class EagerTestDetector implements Detector {
  async detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]> {
    const smells: Smell[] = [];

    try {
      const sutVars = collectSutVariables(ast);
      const callExpressions = astService.query(ast, "CallExpression") as t.CallExpression[];

      for (const callExpr of callExpressions) {
        const callback = astService.getTestCallback(callExpr);
        if (!callback) {
          continue;
        }

        const methodsByObject = collectTestSutMethodCalls(callback.body, sutVars);

        for (const [objName, methods] of methodsByObject.entries()) {
          if (methods.size < 2) {
            continue;
          }

          const loc = callExpr.loc;
          const start = callExpr.start ?? 0;
          const end = callExpr.end ?? start;
          const methodList = [...methods].join(", ");

          smells.push({
            file,
            start: { line: loc?.start.line ?? 0, column: loc?.start.column ?? 0 },
            end: { line: loc?.end.line ?? 0, column: loc?.end.column ?? 0 },
            message: `Eager test detected: invokes multiple methods (${methodList}) on "${objName}".`,
            codeBlock: sourceCode.slice(start, end) || UNABLE_TO_EXTRACT_CODE_SNIPPET,
            description: SMELL_DESCRIPTIONS.EagerTest.description,
            explanation: SMELL_DESCRIPTIONS.EagerTest.explanation,
          });
        }
      }
    } catch (err) {
      logger.error({ err, file }, "Error while running EagerTestDetector");
    }

    return smells;
  }
}
