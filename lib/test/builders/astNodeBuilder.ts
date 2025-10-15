import * as t from "@babel/types";

export const AstNodeBuilder = {
  functionDeclaration: (name = "func") =>
    t.functionDeclaration(t.identifier(name), [], t.blockStatement([])),

  functionExpression: (name = "funcExpr") =>
    t.functionExpression(t.identifier(name), [], t.blockStatement([])),

  arrowFunction: () => t.arrowFunctionExpression([], t.blockStatement([])),

  objectMethod: (name = "method") =>
    t.objectMethod("method", t.identifier(name), [], t.blockStatement([])),

  classMethod: (name = "classMethod") =>
    t.classMethod("method", t.identifier(name), [], t.blockStatement([])),

  classPrivateMethod: (name = "privateMethod") =>
    t.classPrivateMethod(
      "method",
      t.privateName(t.identifier(name)),
      [],
      t.blockStatement([])
    ),

  variableDeclaration: (id = "a", value = 1) =>
    t.variableDeclaration("const", [
      t.variableDeclarator(t.identifier(id), t.numericLiteral(value)),
    ]),

  expressionStatement: (value = "Hello, World!") =>
    t.expressionStatement(t.stringLiteral(value)),

  classDeclaration: (name = "MyClass") =>
    t.classDeclaration(t.identifier(name), null, t.classBody([])),
};
