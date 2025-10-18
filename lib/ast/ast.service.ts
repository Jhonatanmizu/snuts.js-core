import fs from "node:fs";

import * as t from "@babel/types";
import traverse, { NodePath } from "@babel/traverse";
import { parse } from "@babel/parser";

import { jestTestAliases, jestSuiteAliases } from "@/shared/aliases";
import * as astPlugins from "@/shared/plugins";

const { configsFlow, configsTypescript } = astPlugins;

class AstService {
  constructor(private fileReader: typeof fs = fs) {}

  public parseToAst(code: string): t.File {
    if (!code.trim()) {
      throw new Error("Empty code cannot be parsed");
    }
    try {
      return parse(code, configsFlow);
    } catch {
      return parse(code, configsTypescript);
    }
  }

  public parseFileToAst(filePath: string): t.File | null {
    try {
      const code = this.fileReader.readFileSync(filePath, "utf-8");
      return this.parseToAst(code);
    } catch (error) {
      console.error(`[AstService] Failed to parse file: ${filePath}`, error);
      return null;
    }
  }

  public isHook(node: t.Node): boolean {
    const hookNames = ["beforeAll", "beforeEach", "afterAll", "afterEach"];

    return (
      t.isExpressionStatement(node) &&
      t.isCallExpression(node.expression) &&
      t.isIdentifier(node.expression.callee) &&
      hookNames.includes(node.expression.callee.name)
    );
  }

  public isAssert(path: NodePath): boolean {
    let found = false;
    path.traverse({
      CallExpression(path: NodePath<t.CallExpression>) {
        const callee = path.node.callee;
        if (t.isMemberExpression(callee) && t.isIdentifier(callee.object, { name: "expect" })) {
          found = true;
          path.stop();
        }
      },
    });
    return found;
  }

  public testInfo(path: NodePath<t.CallExpression>): {
    name: string;
    hasAssert: boolean;
    itCount: number;
    describeCount: number;
  } | null {
    if (!this.isTestCase(path.node)) return null;

    const args = path.node.arguments;
    const name = (args[0] as t.StringLiteral).value;
    const funcPath = path.get("arguments.1") as NodePath;

    const hasAssert = this.isAssert(funcPath);
    const itCount = this.itCount(funcPath);
    const describeCount = this.describeCount(funcPath);

    return {
      name,
      hasAssert,
      itCount,
      describeCount,
    };
  }

  public itCount(path: NodePath): number {
    let count = 0;
    path.traverse({
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee) && jestTestAliases.includes(path.node.callee.name)) {
          count++;
        }
      },
    });
    return count;
  }

  public describeCount(path: NodePath): number {
    let count = 0;
    path.traverse({
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee, { name: "describe" })) {
          count++;
        }
      },
    });
    return count;
  }

  public isDescribe(node: t.Node): boolean {
    if (!t.isCallExpression(node)) return false;

    const callee = node.callee;
    const args = node.arguments;

    let suiteName: string | null = null;

    if (t.isIdentifier(callee)) {
      suiteName = callee.name;
    } else if (t.isMemberExpression(callee) && t.isIdentifier(callee.object)) {
      suiteName = callee.object.name;
    }

    return (
      suiteName !== null &&
      jestSuiteAliases.includes(suiteName) &&
      args.length > 1 &&
      t.isStringLiteral(args[0]) &&
      this.isFunction(args[1] as t.Node)
    );
  }

  public getDescribeNodeAst(code: string): t.Node | null {
    const ast = this.parseToAst(code);
    let describeNode: t.Node | null = null;

    traverse(ast, {
      CallExpression: (path) => {
        if (this.isDescribe(path.node)) {
          describeNode = path.node;
          path.stop();
        }
      },
    });

    return describeNode;
  }

  public getTestNodeAst(code: string): t.Node | null {
    const ast = this.parseToAst(code);
    let testNode: t.Node | null = null;

    traverse(ast, {
      CallExpression: (path) => {
        if (this.isTestCase(path.node)) {
          testNode = path.node;
          path.stop();
        }
      },
    });

    return testNode;
  }

  public hasManyComments(node: t.Node, maxComments: number): boolean {
    if (!node) return false;
    const comments = [
      ...(node.leadingComments || []),
      ...(node.trailingComments || []),
      ...(node.innerComments || []),
    ];
    return comments.length > maxComments;
  }

  public isTestCase(node: t.Node): boolean {
    if (!t.isCallExpression(node)) return false;

    const callee = node.callee;
    const args = node.arguments;

    let testName: string | null = null;

    if (t.isIdentifier(callee)) {
      testName = callee.name;
    } else if (t.isMemberExpression(callee) && t.isIdentifier(callee.object)) {
      testName = callee.object.name;
    }

    return (
      testName !== null &&
      jestTestAliases.includes(testName) &&
      args.length > 1 &&
      t.isStringLiteral(args[0]) &&
      this.isFunction(args[1] as t.Node)
    );
  }

  public isFunction(node: t.Node): boolean {
    return (
      t.isFunctionDeclaration(node) ||
      t.isFunctionExpression(node) ||
      t.isArrowFunctionExpression(node) ||
      t.isObjectMethod(node) ||
      t.isClassMethod(node) ||
      t.isClassPrivateMethod(node)
    );
  }
}

const astService = new AstService();
export default astService;
