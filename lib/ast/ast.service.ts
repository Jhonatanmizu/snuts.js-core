import fs from "node:fs/promises";
import path from "node:path";

import * as t from "@babel/types";
import { parse } from "@babel/parser";
import esquery from "esquery";

import { logger } from "@/shared/logger";
import {
  ASSERT_OBJECT_IDENTIFIER_NAME,
  EXPECT_CALLEE_IDENTIFIER_NAME,
  JEST_LIFECYCLE_HOOK_NAME_SET,
  JEST_SUITE_ALIAS_NAME_SET,
  JEST_TEST_ALIAS_NAME_SET,
} from "@/shared/constants";
import * as astPlugins from "@/shared/plugins";

const { configsFlow, configsTypescript } = astPlugins;

export interface ParsedFile {
  ast: t.File;
  code: string;
}

export class AstService {
  private readonly cache = new Map<string, ParsedFile>();

  /**
   * Parse a given file path into an AST + source code.
   * Detects parser config based on file extension.
   * Uses an mtime-keyed in-memory cache to avoid re-reading unchanged files.
   */
  public async parseFileToAst(filePath: string): Promise<ParsedFile | null> {
    let cacheKey: string | null = null;
    const stats = await fs.stat(filePath);
    cacheKey = `${filePath}::${stats.mtimeMs}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const code = await fs.readFile(filePath, "utf-8");
      if (!code.trim()) {
        logger.warn({ file: filePath }, "Skipping empty file");
        return null;
      }

      const ast = this.parseToAst(code, filePath);
      const result: ParsedFile = { ast, code };
      if (cacheKey) this.cache.set(cacheKey, result);
      return result;
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

  /**
   * Query the AST using esquery.
   */
  public query(ast: t.Node, selector: string): t.Node[] {
    return esquery(ast as unknown as Parameters<typeof esquery>[0], selector) as t.Node[];
  }

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
      JEST_TEST_ALIAS_NAME_SET.has(testName) &&
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
      JEST_SUITE_ALIAS_NAME_SET.has(suiteName) &&
      args.length > 1 &&
      t.isStringLiteral(args[0]) &&
      this.isFunction(args[1] as t.Node)
    );
  }

  public isHook(node: t.Node): boolean {
    return (
      t.isExpressionStatement(node) &&
      t.isCallExpression(node.expression) &&
      t.isIdentifier(node.expression.callee) &&
      JEST_LIFECYCLE_HOOK_NAME_SET.has(node.expression.callee.name)
    );
  }

  /**
   * Whether this call is a setup/teardown hook with a function callback (Jest/Jasmine style).
   */
  public isSetupHookCall(node: t.CallExpression): boolean {
    if (!t.isIdentifier(node.callee) || !JEST_LIFECYCLE_HOOK_NAME_SET.has(node.callee.name)) {
      return false;
    }
    return node.arguments.length > 0 && this.isHookCallback(node.arguments[0] as t.Node);
  }

  /**
   * Original SNUTS.js treated setup callbacks as classic function or arrow expressions only.
   */
  public isHookCallback(node: t.Node): boolean {
    return t.isArrowFunctionExpression(node) || t.isFunctionExpression(node);
  }

  /**
   * Detects assertion-style expressions inside setup/teardown hooks (expect/assert chains).
   */
  public isAssertionStatement(node: t.Statement): boolean {
    if (!t.isExpressionStatement(node)) return false;
    return this.expressionLooksLikeAssertion(node.expression);
  }

  private expressionLooksLikeAssertion(expr: t.Expression): boolean {
    if (!t.isCallExpression(expr)) return false;
    return this.callExpressionLooksLikeAssertion(expr);
  }

  private callExpressionLooksLikeAssertion(expr: t.CallExpression): boolean {
    const { callee } = expr;
    if (t.isIdentifier(callee)) {
      return callee.name === EXPECT_CALLEE_IDENTIFIER_NAME;
    }
    if (!t.isMemberExpression(callee)) return false;

    if (t.isIdentifier(callee.object) && callee.object.name === ASSERT_OBJECT_IDENTIFIER_NAME) {
      return t.isIdentifier(callee.property);
    }

    if (t.isCallExpression(callee.object)) {
      return this.callExpressionLooksLikeAssertion(callee.object);
    }

    if (t.isMemberExpression(callee.object)) {
      const innerObject = callee.object.object;
      if (t.isCallExpression(innerObject)) {
        return this.callExpressionLooksLikeAssertion(innerObject);
      }
    }

    return false;
  }

  public testInfo(node: t.CallExpression): { name: string } | null {
    if (!this.isTestCase(node)) return null;

    const args = node.arguments;
    const name = t.isStringLiteral(args[0]) ? args[0].value : "Unnamed test";

    return {
      name,
    };
  }

  public hasManyComments(node: t.Node, maxComments: number): boolean {
    const comments = [
      ...(node.leadingComments ?? []),
      ...(node.trailingComments ?? []),
      ...(node.innerComments ?? []),
    ];
    return comments.length > maxComments;
  }

  public countComments(node: t.Node): number {
    const seen = new Set<number>();
    t.traverse(node, {
      enter(node) {
        for (const comment of [
          ...(node.leadingComments ?? []),
          ...(node.trailingComments ?? []),
          ...(node.innerComments ?? []),
        ]) {
          seen.add(comment.start!);
        }
      },
    });
    return seen.size;
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
