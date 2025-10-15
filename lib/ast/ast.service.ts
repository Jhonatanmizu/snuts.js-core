import * as t from "@babel/types";
import traverse from "@babel/traverse";
import { parse } from "@babel/parser";
import * as astPlugins from "../shared/plugins";
import fs from "node:fs";
import { jestSuiteAliases, jestTestAliases } from "../shared/aliases";
const { configsFlow, configsTypescript } = astPlugins;

class AstService {
  public parseToAst(code: string): t.File {
    try {
      return parse(code, configsFlow);
    } catch (error) {
      return parse(code, configsTypescript);
    }
  }

  public parseFileToAst(filePath: string): t.File | null {
    try {
      const code = fs.readFileSync(filePath, "utf-8");
      return this.parseToAst(code);
    } catch (error) {
      console.error("Error reading or parsing file:", error);
      return null;
    }
  }

  public isSetupMethod(node: t.Node): boolean {
    return (
      t.isExpressionStatement(node) &&
      t.isCallExpression(node.expression) &&
      t.isIdentifier(node.expression.callee) &&
      node.expression.callee.name === "beforeEach"
    );
  }

  public isAssert(node: t.Node): boolean {
    let hasAssert = false;
    traverse(
      node,
      {
        CallExpression(path) {
          const callee = path.node.callee;
          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            callee.object.name === "expect"
          ) {
            hasAssert = true;
            path.stop();
          }
        },
      },
      undefined,
      node
    );

    return hasAssert;
  }

  public itCount(node: t.Node): number {
    let count = 0;
    traverse(
      node,
      {
        CallExpression(path) {
          if (
            t.isIdentifier(path.node.callee) &&
            jestTestAliases.includes(path.node.callee.name)
          ) {
            count += 1;
          }
        },
      },
      undefined,
      node
    );
    return count;
  }

  public getTestNodeAst(code: string): t.Node | null {
    const ast = this.parseToAst(code);
    let testNode = null;
    traverse(ast, {
      CallExpression(path) {
        if (
          t.isIdentifier(path.node.callee) &&
          jestSuiteAliases.includes(path.node.callee.name)
        ) {
          path.traverse({
            CallExpression(describePath) {
              if (
                t.isIdentifier(describePath.node.callee) &&
                jestTestAliases.includes(describePath.node.callee.name)
              ) {
                testNode = describePath;
              }
            },
          });
        } else if (
          t.isIdentifier(path.node.callee) &&
          jestSuiteAliases.includes(path.node.callee.name)
        ) {
          testNode = path;
        }
      },
    });

    return testNode;
  }

  public hasManyComments(node: t.Node, maxComments: number): boolean {
    const comments = node.leadingComments || node.trailingComments || [];
    return comments.length > maxComments;
  }

  public isTestCase(node: t.Node): boolean {
    return (
      t.isExpressionStatement(node) &&
      t.isCallExpression(node.expression) &&
      t.isIdentifier(node.expression.callee) &&
      jestSuiteAliases.includes(node.expression.callee.name)
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
