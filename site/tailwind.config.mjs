/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        snuts: {
          canvas: "var(--snuts-canvas)",
          espresso: "var(--snuts-espresso)",
          card: "var(--snuts-card)",
          "card-hover": "var(--snuts-card-hover)",
          well: "var(--snuts-well)",
          border: "var(--snuts-border)",
          accent: "var(--snuts-accent)",
          "accent-hover": "var(--snuts-accent-hover)",
          rose: "var(--snuts-rose)",
          chestnut: "var(--snuts-chestnut)",
          heading: "var(--snuts-heading)",
          text: "var(--snuts-text)",
          muted: "var(--snuts-muted)",
          meta: "var(--snuts-meta)",
          ok: "var(--snuts-ok)",
          warn: "var(--snuts-warn)",
          err: "var(--snuts-err)",
          "accent-12": "var(--snuts-accent-12)",
          "accent-14": "var(--snuts-accent-14)",
          "accent-35": "var(--snuts-accent-35)",
          "ok-12": "var(--snuts-ok-12)",
          "warn-14": "var(--snuts-warn-14)",
          "err-14": "var(--snuts-err-14)",
          "chestnut-10": "var(--snuts-chestnut-10)",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      fontFamily: {
        display: ["var(--snuts-font-display)", "sans-serif"],
        body: ["var(--snuts-font-body)", "sans-serif"],
        mono: ["var(--snuts-font-mono)", "monospace"],
      },
      borderRadius: {
        card: "var(--snuts-r-card)",
        code: "var(--snuts-r-code)",
        btn: "var(--snuts-r-btn)",
        pill: "var(--snuts-r-pill)",
      },
    },
  },
  plugins: [],
};
