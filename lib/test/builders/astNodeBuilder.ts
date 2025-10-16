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
    t.classPrivateMethod("method", t.privateName(t.identifier(name)), [], t.blockStatement([])),

  variableDeclaration: (id = "a", value = 1) =>
    t.variableDeclaration("const", [
      t.variableDeclarator(t.identifier(id), t.numericLiteral(value)),
    ]),

  expressionStatement: (value = "Hello, World!") => t.expressionStatement(t.stringLiteral(value)),

  classDeclaration: (name = "MyClass") =>
    t.classDeclaration(t.identifier(name), null, t.classBody([])),

  identifier: (name = "id") => t.identifier(name),

  numericLiteral: (value = 0) => t.numericLiteral(value),

  stringLiteral: (value = "") => t.stringLiteral(value),

  booleanLiteral: (value = true) => t.booleanLiteral(value),

  nullLiteral: () => t.nullLiteral(),

  arrayExpression: (elements: t.Expression[] = []) => t.arrayExpression(elements),

  objectExpression: (properties: t.ObjectProperty[] = []) => t.objectExpression(properties),

  callExpression: (calleeName = "fn", args: t.CallExpression[] = []) =>
    t.callExpression(t.identifier(calleeName), args),

  memberExpression: (objectName = "obj", propertyName = "prop") =>
    t.memberExpression(t.identifier(objectName), t.identifier(propertyName)),

  assignmentExpression: (leftName = "a", rightValue = 1) =>
    t.assignmentExpression("=", t.identifier(leftName), t.numericLiteral(rightValue)),

  returnStatement: (argument = t.identifier("result")) => t.returnStatement(argument),

  ifStatement: (
    test = t.booleanLiteral(true),
    consequent = t.blockStatement([]),
    alternate = null,
  ) => t.ifStatement(test, consequent, alternate),

  blockStatement: (body: t.Statement[] = []) => t.blockStatement(body),

  forStatement: (
    init = t.variableDeclaration("let", [
      t.variableDeclarator(t.identifier("i"), t.numericLiteral(0)),
    ]),
    test = t.binaryExpression("<", t.identifier("i"), t.numericLiteral(10)),
    update = t.updateExpression("++", t.identifier("i")),
    body = t.blockStatement([]),
  ) => t.forStatement(init, test, update, body),

  whileStatement: (test = t.booleanLiteral(true), body = t.blockStatement([])) =>
    t.whileStatement(test, body),

  importDeclaration: (source = "module", specifiers: t.ImportSpecifier[] = []) =>
    t.importDeclaration(specifiers, t.stringLiteral(source)),

  exportNamedDeclaration: (
    declaration = null,
    specifiers: t.ExportSpecifier[] = [],
    source = null,
  ) => t.exportNamedDeclaration(declaration, specifiers, source && t.stringLiteral(source)),
};
