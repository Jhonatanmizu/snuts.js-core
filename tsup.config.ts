import { defineConfig } from "tsup";

export default defineConfig([
  {
    // ── ESM – all entries, including the CLI bin ─────────────────────────────
    // The CLI uses `import.meta.url` which is an ESM-only feature, so it must
    // only be compiled to ESM format.
    tsconfig: "tsconfig.build.json",
    entry: {
      "bin/cli": "lib/bin/cli.ts",
      index: "lib/index.ts",
      "detectors/index": "lib/detectors/index.ts",
      "runtime/watch": "lib/runtime/watch.ts",
    },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true, // clean once, on the ESM pass
    outDir: "dist",
    target: "es2022",
  },
  {
    // ── CJS – library entries only (no CLI bin) ───────────────────────────────
    // The CLI is excluded here because `import.meta` is unavailable in CJS.
    // CJS support is required for VS Code extensions, which run in a CommonJS
    // extension host and cannot statically `require()` an ESM-only package.
    tsconfig: "tsconfig.build.json",
    entry: {
      index: "lib/index.ts",
      "detectors/index": "lib/detectors/index.ts",
      "runtime/watch": "lib/runtime/watch.ts",
    },
    format: ["cjs"],
    dts: true, // produces .d.cts files alongside the ESM .d.ts files
    sourcemap: true,
    clean: false, // do NOT wipe the ESM output produced by the first config
    outDir: "dist",
    target: "es2022",
  },
]);
