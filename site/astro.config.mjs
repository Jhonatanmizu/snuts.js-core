import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

const site = process.env.ASTRO_SITE ?? "https://jhonatanmizu.github.io";
const base = process.env.ASTRO_BASE ?? "/";

export default defineConfig({
  site,
  base,
  output: "static",
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
