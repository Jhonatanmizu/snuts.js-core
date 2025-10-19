import fs from "node:fs/promises";
import path from "node:path";

import * as t from "@babel/types";
import { NodePath } from "@babel/traverse";
import { parse } from "@babel/parser";

import { logger } from "@/shared/logger";
import { jestTestAliases, jestSuiteAliases } from "@/shared/aliases";
import * as astPlugins from "@/shared/plugins";
import { traverse } from "@/shared/traverse";
const { configsFlow, configsTypescript } = astPlugins;

export interface ParsedFile {
  ast: t.File;
  code: string;
}

class AstService {
  public traverse: typeof traverse = traverse;

  // constructor() {
  //   this.initialize();
  // }

  // private async initialize() {
  //   this.traverse = traverse;
  // }

  /**
   * Parse a given file path into an AST + source code.
   * Detects parser config based on file extension.
   */
  public async parseFileToAst(filePath: string): Promise<ParsedFile | null> {
    try {
      const code = await fs.readFile(filePath, "utf-8");
      if (!code.trim()) {
        logger.warn({ file: filePath }, "Skipping empty file");
        return null;
      }

      const ast = this.parseToAst(code, filePath);
      return { ast, code };
    } catch (err) {
      logger.error({ err, file: filePath }, "Failed to parse file into AST");
      return null;
    }
  }

  /**
   * Parse code string to AST using heuristics.
   * Falls back between Flow and TypeScript parsers.
   */
  public parseToAst(code: string, filePath?: string): t.File {
    if (!code.trim()) {
      throw new Error("Empty code cannot be parsed");
    }

    const ext = filePath ? path.extname(filePath) : "";

    const config = ext === ".ts" || ext === ".tsx" ? configsTypescript : configsFlow;

    try {
      return parse(code, config);
    } catch (err) {
      logger.warn({ err, file: filePath }, "Primary parser failed, attempting fallback parser");
      return parse(code, ext === ".ts" ? configsFlow : configsTypescript);
    }
  }

  /**
   * Reads the file content (non-parsed).
   */
  public async getSourceCode(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch (err) {
      logger.error({ err, file: filePath }, "Failed to read source file");
      return "";
    }
  }

  // -----------------------
  // Test / Suite Detection
  // -----------------------

  public isTestCase(node: t.Node): boolean {
    if (!t.isCallExpression(node)) return false;

    const callee = node.callee;
    const args = node.arguments;

    const testName = t.isIdentifier(callee)
      ? callee.name
      : t.isMemberExpression(callee) && t.isIdentifier(callee.object)
        ? callee.object.name
        : null;

    return (
      !!testName &&
      jestTestAliases.includes(testName) &&
      args.length > 1 &&
      t.isStringLiteral(args[0]) &&
      this.isFunction(args[1] as t.Node)
    );
  }

  public isDescribe(node: t.Node): boolean {
    if (!t.isCallExpression(node)) return false;

    const callee = node.callee;
    const args = node.arguments;

    const suiteName = t.isIdentifier(callee)
      ? callee.name
      : t.isMemberExpression(callee) && t.isIdentifier(callee.object)
        ? callee.object.name
        : null;

    return (
      !!suiteName &&
      jestSuiteAliases.includes(suiteName) &&
      args.length > 1 &&
      t.isStringLiteral(args[0]) &&
      this.isFunction(args[1] as t.Node)
    );
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

  // -----------------------
  // Traversal Utilities
  // -----------------------

  public isAssert(path: NodePath): boolean {
    let found = false;
    path.traverse({
      CallExpression(inner: NodePath<t.CallExpression>) {
        const callee = inner.node.callee;
        if (t.isMemberExpression(callee) && t.isIdentifier(callee.object, { name: "expect" })) {
          found = true;
          inner.stop();
        }
      },
    });
    return found;
  }

  public itCount(path: NodePath): number {
    return this.countCalls(path, jestTestAliases);
  }

  public describeCount(path: NodePath): number {
    return this.countCalls(path, ["describe"]);
  }

  private countCalls(path: NodePath, names: string[]): number {
    let count = 0;
    path.traverse({
      CallExpression(innerPath) {
        if (t.isIdentifier(innerPath.node.callee) && names.includes(innerPath.node.callee.name)) {
          count++;
        }
      },
    });
    return count;
  }

  // -----------------------
  // Metadata Extraction
  // -----------------------

  public testInfo(path: NodePath<t.CallExpression>) {
    if (!this.isTestCase(path.node)) return null;

    const args = path.node.arguments;
    const name = t.isStringLiteral(args[0]) ? args[0].value : "Unnamed test";
    const funcPath = path.get("arguments.1") as NodePath;

    return {
      name,
      hasAssert: this.isAssert(funcPath),
      itCount: this.itCount(funcPath),
      describeCount: this.describeCount(funcPath),
    };
  }

  // -----------------------
  // Misc Helpers
  // -----------------------

  public hasManyComments(node: t.Node, maxComments: number): boolean {
    const comments = [
      ...(node.leadingComments ?? []),
      ...(node.trailingComments ?? []),
      ...(node.innerComments ?? []),
    ];
    return comments.length > maxComments;
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

export const astService = new AstService();
export default astService;
