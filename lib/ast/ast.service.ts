import * as t from "@babel/types";
import traverse, { NodePath } from "@babel/traverse";
import { parse } from "@babel/parser";
import fs from "node:fs";
import { jestSuiteAliases, jestTestAliases } from "../shared/aliases";
import * as astPlugins from "../shared/plugins";

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

  public isSetupMethod(node: t.Node): boolean {
    return (
      t.isExpressionStatement(node) &&
      t.isCallExpression(node.expression) &&
      t.isIdentifier(node.expression.callee, { name: "beforeEach" })
    );
  }

  public isAssert(node: t.Node): boolean {
    let found = false;

    traverse(node, {
      CallExpression(path: NodePath<t.CallExpression>) {
        const callee = path.node.callee;
        if (
          t.isMemberExpression(callee) &&
          t.isIdentifier(callee.object, { name: "expect" })
        ) {
          found = true;
          path.stop();
        }
      },
    });

    return found;
  }

  public itCount(node: t.Node): number {
    let count = 0;

    traverse(node, {
      CallExpression(path) {
        if (
          t.isIdentifier(path.node.callee) &&
          jestTestAliases.includes(path.node.callee.name)
        ) {
          count++;
        }
      },
    });

    return count;
  }

  public getTestNodeAst(code: string): t.Node | null {
    const ast = this.parseToAst(code);
    let testNode: t.Node | null = null;

    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        if (t.isIdentifier(callee) && jestTestAliases.includes(callee.name)) {
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
    return (
      t.isIdentifier(callee) &&
      jestTestAliases.includes(callee.name) &&
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
