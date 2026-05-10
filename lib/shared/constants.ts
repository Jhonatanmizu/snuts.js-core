// -----------------------------------------------------------------------------
// Glob / watcher
// -----------------------------------------------------------------------------

const TEST_FILE_PATTERNS = [
  "**/*.test.js",
  "**/*.tests.js",
  "**/*.spec.js",
  "**/*.specs.js",
  "**/*test_*.js",
  "**/*test-*.js",
  "**/*Spec*.js",
  "**/*.test.ts",
  "**/*.tests.ts",
  "**/*.spec.ts",
  "**/*.specs.ts",
  "**/*test_*.ts",
  "**/*test-*.ts",
  "**/*Spec*.ts",
  "**/*.test.jsx",
  "**/*.spec.jsx",
  "**/*.test.tsx",
  "**/*.spec.tsx",
];

/** Over-commented detector: counts distinct comment positions tied to the test AST node */
const MAX_COMMENTS_PER_TEST = 5;

// -----------------------------------------------------------------------------
// Parsing / snippets
// -----------------------------------------------------------------------------

/** Fallback when source offsets are missing from AST nodes */
const UNABLE_TO_EXTRACT_CODE_SNIPPET = "// Unable to extract code snippet";

// -----------------------------------------------------------------------------
// Jest-style API names (shared by AST helpers and detectors)
// -----------------------------------------------------------------------------

const JEST_TEST_ALIASES = ["it", "test"] as const;

const JEST_SUITE_ALIASES = ["describe"] as const;

/** Lifecycle hooks used by `beforeEach`-style matchers and Verify-in-setup detection */
const JEST_LIFECYCLE_HOOK_NAMES = ["beforeAll", "beforeEach", "afterAll", "afterEach"] as const;

/**
 * Hooks that declare shared fixture vars for {@link GeneralFixtureTestLogicDetector}
 * (`after*` hooks intentionally excluded — v1 parity).
 */
const GENERAL_FIXTURE_SETUP_HOOK_NAMES = ["beforeAll", "beforeEach"] as const;

/** `it.only`, `test.only`, `describe.only`, etc. */
const FOCUSED_TEST_API_ROOT_NAMES = [...JEST_TEST_ALIASES, ...JEST_SUITE_ALIASES] as const;

/** Pre-built sets for frequent `.has(name)` lookups */
const JEST_LIFECYCLE_HOOK_NAME_SET = new Set<string>(JEST_LIFECYCLE_HOOK_NAMES);

const GENERAL_FIXTURE_SETUP_HOOK_NAME_SET = new Set<string>(GENERAL_FIXTURE_SETUP_HOOK_NAMES);

const FOCUSED_TEST_API_ROOT_NAME_SET = new Set<string>(FOCUSED_TEST_API_ROOT_NAMES);

const JEST_TEST_ALIAS_NAME_SET = new Set<string>(JEST_TEST_ALIASES);

const JEST_SUITE_ALIAS_NAME_SET = new Set<string>(JEST_SUITE_ALIASES);

// -----------------------------------------------------------------------------
// Detector thresholds / tunables (v1-aligned where noted)
// -----------------------------------------------------------------------------

/** Anonymous test: descriptions with at most this many words are flagged */
const ANONYMOUS_TEST_MAX_DESCRIPTION_WORD_COUNT = 2;

/**
 * Verbose block (v1 `verboseTest.js`): block bodies strictly above this statement count.
 */
const VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD = 13;

/** Complex snapshot quasi span (v1 `complexSnapshot.js`) */
const COMPLEX_SNAPSHOT_MAX_QUASI_LINE_SPAN = 50;

// -----------------------------------------------------------------------------
// Sensitive equality (v1 `sensitiveEquality.js`)
// -----------------------------------------------------------------------------

const JEST_SENSITIVE_EQUALITY_MATCHER_NAMES = [
  "toEqual",
  "toStrictEqual",
  "toBe",
  "toMatchObject",
] as const;

const JASMINE_SENSITIVE_EQUALITY_MATCHER_NAMES = ["toEqual", "toBe", "toMatch"] as const;

const JEST_SENSITIVE_EQUALITY_MATCHER_NAME_SET = new Set<string>(
  JEST_SENSITIVE_EQUALITY_MATCHER_NAMES,
);

const JASMINE_SENSITIVE_EQUALITY_MATCHER_NAME_SET = new Set<string>(
  JASMINE_SENSITIVE_EQUALITY_MATCHER_NAMES,
);

// -----------------------------------------------------------------------------
// Transcripting test (console in test body — v1 `transcriptingTest.js`)
// -----------------------------------------------------------------------------

const TRANSCRIPT_CONSOLE_METHOD_NAMES = ["log", "error", "warn", "info"] as const;

const TRANSCRIPT_CONSOLE_METHOD_NAME_SET = new Set<string>(TRANSCRIPT_CONSOLE_METHOD_NAMES);

// -----------------------------------------------------------------------------
// Assertion detection (`ast.service`)
// -----------------------------------------------------------------------------

const EXPECT_CALLEE_IDENTIFIER_NAME = "expect";

const ASSERT_OBJECT_IDENTIFIER_NAME = "assert";

export {
  TEST_FILE_PATTERNS,
  MAX_COMMENTS_PER_TEST,
  UNABLE_TO_EXTRACT_CODE_SNIPPET,
  JEST_TEST_ALIASES,
  JEST_SUITE_ALIASES,
  JEST_LIFECYCLE_HOOK_NAMES,
  JEST_LIFECYCLE_HOOK_NAME_SET,
  GENERAL_FIXTURE_SETUP_HOOK_NAMES,
  GENERAL_FIXTURE_SETUP_HOOK_NAME_SET,
  FOCUSED_TEST_API_ROOT_NAMES,
  FOCUSED_TEST_API_ROOT_NAME_SET,
  JEST_TEST_ALIAS_NAME_SET,
  JEST_SUITE_ALIAS_NAME_SET,
  ANONYMOUS_TEST_MAX_DESCRIPTION_WORD_COUNT,
  VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD,
  COMPLEX_SNAPSHOT_MAX_QUASI_LINE_SPAN,
  JEST_SENSITIVE_EQUALITY_MATCHER_NAMES,
  JASMINE_SENSITIVE_EQUALITY_MATCHER_NAMES,
  JEST_SENSITIVE_EQUALITY_MATCHER_NAME_SET,
  JASMINE_SENSITIVE_EQUALITY_MATCHER_NAME_SET,
  TRANSCRIPT_CONSOLE_METHOD_NAMES,
  TRANSCRIPT_CONSOLE_METHOD_NAME_SET,
  EXPECT_CALLEE_IDENTIFIER_NAME,
  ASSERT_OBJECT_IDENTIFIER_NAME,
};
