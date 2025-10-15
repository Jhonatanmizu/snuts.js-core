import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      "**/examples/**",
      "/src/common/examples",
      "/public",
      "**/public/**",
      "**/examples/**",
    ],
  },
});
