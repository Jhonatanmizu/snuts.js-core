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

/** Fallback when source offsets are missing from AST nodes */
const UNABLE_TO_EXTRACT_CODE_SNIPPET = "// Unable to extract code snippet";

const JEST_TEST_ALIASES = ["it", "test"] as const;

const JEST_SUITE_ALIASES = ["describe"] as const;

const IGNORED_TEST_STANDALONE_ALIASES = ["xit", "xtest", "xdescribe"] as const;

const IGNORED_TEST_MEMBER_PROPERTY_NAMES = ["skip", "todo"] as const;

const IGNORED_TEST_STANDALONE_NAME_SET = new Set<string>(IGNORED_TEST_STANDALONE_ALIASES);

const IGNORED_TEST_MEMBER_PROPERTY_NAME_SET = new Set<string>(IGNORED_TEST_MEMBER_PROPERTY_NAMES);

const MAGIC_NUMBER_EXEMPT_VALUES = new Set<number>([0, 1, -1]);

const MYSTERY_GUEST_IDENTIFIER_NAMES = [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "localStorage",
  "sessionStorage",
  "indexedDB",
] as const;

const MYSTERY_GUEST_OBJECT_NAMES = [
  "fs",
  "fsPromises",
  "http",
  "https",
  "net",
  "dgram",
  "dns",
  "child_process",
  "axios",
  "localStorage",
  "sessionStorage",
] as const;

const MYSTERY_GUEST_IDENTIFIER_NAME_SET = new Set<string>(MYSTERY_GUEST_IDENTIFIER_NAMES);

const MYSTERY_GUEST_OBJECT_NAME_SET = new Set<string>(MYSTERY_GUEST_OBJECT_NAMES);

const RESOURCE_OPTIMISM_GUARD_METHODS = [
  "existsSync",
  "exists",
  "accessSync",
  "access",
  "statSync",
  "stat",
  "lstatSync",
  "lstat",
] as const;

const RESOURCE_OPTIMISM_ACTION_METHODS = [
  "readFileSync",
  "readFile",
  "writeFileSync",
  "writeFile",
  "appendFileSync",
  "appendFile",
  "unlinkSync",
  "unlink",
  "rmSync",
  "rm",
  "rmdirSync",
  "rmdir",
  "readdirSync",
  "readdir",
  "copyFileSync",
  "copyFile",
  "renameSync",
  "rename",
  "chmodSync",
  "chmod",
  "openSync",
  "open",
  "createReadStream",
  "createWriteStream",
] as const;

const RESOURCE_OPTIMISM_GUARD_METHOD_SET = new Set<string>(RESOURCE_OPTIMISM_GUARD_METHODS);

const RESOURCE_OPTIMISM_ACTION_METHOD_SET = new Set<string>(RESOURCE_OPTIMISM_ACTION_METHODS);

const SLEEPY_TEST_TIMER_FUNCTION_NAMES = ["setTimeout", "setInterval"] as const;

const SLEEPY_TEST_TIMER_FUNCTION_NAME_SET = new Set<string>(SLEEPY_TEST_TIMER_FUNCTION_NAMES);

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

/** Anonymous test: descriptions with at most this many words are flagged */
const ANONYMOUS_TEST_MAX_DESCRIPTION_WORD_COUNT = 2;

/**
 * Verbose block (v1 `verboseTest.js`): block bodies strictly above this statement count.
 */
const VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD = 13;

/** Complex snapshot quasi span (v1 `complexSnapshot.js`) */
const COMPLEX_SNAPSHOT_MAX_QUASI_LINE_SPAN = 50;

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

const TRANSCRIPT_CONSOLE_METHOD_NAMES = ["log", "error", "warn", "info"] as const;

const TRANSCRIPT_CONSOLE_METHOD_NAME_SET = new Set<string>(TRANSCRIPT_CONSOLE_METHOD_NAMES);

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
  IGNORED_TEST_STANDALONE_ALIASES,
  IGNORED_TEST_MEMBER_PROPERTY_NAMES,
  IGNORED_TEST_STANDALONE_NAME_SET,
  IGNORED_TEST_MEMBER_PROPERTY_NAME_SET,
  MAGIC_NUMBER_EXEMPT_VALUES,
  MYSTERY_GUEST_IDENTIFIER_NAMES,
  MYSTERY_GUEST_OBJECT_NAMES,
  MYSTERY_GUEST_IDENTIFIER_NAME_SET,
  MYSTERY_GUEST_OBJECT_NAME_SET,
  RESOURCE_OPTIMISM_GUARD_METHODS,
  RESOURCE_OPTIMISM_ACTION_METHODS,
  RESOURCE_OPTIMISM_GUARD_METHOD_SET,
  RESOURCE_OPTIMISM_ACTION_METHOD_SET,
  SLEEPY_TEST_TIMER_FUNCTION_NAMES,
  SLEEPY_TEST_TIMER_FUNCTION_NAME_SET,
};
