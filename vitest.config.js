import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

import { configDefaults, defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "lib"),
    },
  },
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
