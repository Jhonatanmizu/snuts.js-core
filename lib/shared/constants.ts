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
];
const MAX_COMMENTS_PER_TEST = 5;
export { TEST_FILE_PATTERNS, MAX_COMMENTS_PER_TEST };
