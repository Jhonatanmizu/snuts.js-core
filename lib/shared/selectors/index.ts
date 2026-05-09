import { JEST_TEST_ALIASES } from "../constants";

/**
 * Matches `it('…', …)` / `test('…', …)` when the callee is a simple identifier.
 * Does not match `it.each`/`it.concurrent` callee shapes.
 */
function buildJestTestCalleeEsquerySelector(
  testRoots: readonly string[] = JEST_TEST_ALIASES,
): string {
  return `CallExpression[callee.name=/${testRoots.join("|")}/]`;
}

const ESQUERY_JEST_TEST_CALLEE_SELECTOR = buildJestTestCalleeEsquerySelector();

function buildJestTestExpressionStatementHasEsquerySelector(): string {
  return `ExpressionStatement:has(${buildJestTestCalleeEsquerySelector()})`;
}

const ESQUERY_JEST_TEST_IN_EXPRESSION_STMT_SELECTOR =
  buildJestTestExpressionStatementHasEsquerySelector();

const COMPLEX_SNAPSHOT_INLINE_ESQUERY_SELECTOR =
  "ExpressionStatement:has(CallExpression[callee.property.name='toMatchInlineSnapshot'])";

const COMPLEX_SNAPSHOT_EXTERNAL_ESQUERY_SELECTOR =
  "ExpressionStatement:has(AssignmentExpression[left.type='MemberExpression'][left.property.type='TemplateLiteral'])";

export {
  buildJestTestCalleeEsquerySelector,
  ESQUERY_JEST_TEST_CALLEE_SELECTOR,
  ESQUERY_JEST_TEST_IN_EXPRESSION_STMT_SELECTOR,
  COMPLEX_SNAPSHOT_INLINE_ESQUERY_SELECTOR,
  COMPLEX_SNAPSHOT_EXTERNAL_ESQUERY_SELECTOR,
};
