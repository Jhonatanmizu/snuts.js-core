---
sectionType: "hero"
desktopEyebrow: "AST-Powered · 28 Detectors · Multi-LLM Refactoring"
mobileEyebrow: "28 TEST SMELL DETECTORS"
desktopH1Line1: "Sniff out test smells."
desktopH1Line2: "Ship cleaner test suites."
mobileH1: "Find the smells hiding in your test suite."
desktopSubhead: "Static AST analysis for JavaScript & TypeScript tests. Detect 28 test smells via CLI, library API, or VS Code—and refactor them automatically with your preferred AI provider."
mobileSubhead: "AST-based analysis for JavaScript & TypeScript tests — no execution, no config, no noise."
installCommand: "npm install @snutsjs/core"
installChip: "npx"
desktopPrimaryCta:
  label: "Get Started"
  href: "#cli-sdk"
desktopSecondaryCta:
  label: "Install VS Code Extension"
  href: "#vscode"
mobilePrimaryCta:
  label: "Get Started Free"
  href: "#cli-sdk"
mobileSecondaryCta:
  label: "View on GitHub"
  href: "https://github.com/Jhonatanmizu/snuts.js-core"
trustStrip:
  - "GPL-3.0 Open Source"
  - "Node >=18"
  - "Jest & Vitest"
  - "Zero-Config AST"
desktopCodeWindow:
  fileName: "auth.test.ts"
  detectedBadge: "3 smells detected"
  beforeTag: "BEFORE"
  beforeHint: "4 smells inline"
  beforeCountBadge: "4 diagnostics"
  beforeLines:
    - ln: "1"
      tokens:
        - text: "it"
          color: "accent-hover"
        - text: "('login', "
          color: "text"
        - text: "() => {"
          color: "text"
      diagnostic:
        label: "Anonymous Test"
        variant: "warn"
    - ln: "2"
      tokens:
        - text: "  console"
          color: "accent-hover"
        - text: ".log("
          color: "text"
        - text: "'testing auth'"
          color: "ok"
        - text: ");"
          color: "text"
      diagnostic:
        label: "Transcripting Test"
        variant: "warn"
    - ln: "3"
      tokens:
        - text: "  if"
          color: "rose"
        - text: " (user.isActive"
          color: "text"
        - text: " ) {"
          color: "text"
      diagnostic:
        label: "Conditional Test Logic"
        variant: "accent"
    - ln: "4"
      tokens:
        - text: "    expect"
          color: "accent-hover"
        - text: "(session.ttl)."
          color: "text"
        - text: "toBe"
          color: "accent-hover"
        - text: "(3600"
          color: "warn"
        - text: ");"
          color: "text"
      diagnostic:
        label: "Magic Number Test"
        variant: "warn"
    - ln: "5"
      tokens:
        - text: "  }"
          color: "text"
    - ln: "6"
      tokens:
        - text: "});"
          color: "text"
  aiToolbar:
    title: "SNUTS AI Refactor"
    model: "gpt-4.1-mini"
    actionLabel: "Apply Patch"
  afterLines:
    - ln: "1"
      tokens:
        - text: "const"
          color: "rose"
        - text: " ONE_HOUR_SECONDS = "
          color: "text"
        - text: "3600"
          color: "warn"
        - text: ";"
          color: "text"
    - ln: "2"
      tokens: []
    - ln: "3"
      tokens:
        - text: "it"
          color: "accent-hover"
        - text: "('grants an hour-long session for active users', "
          color: "text"
        - text: "() => {"
          color: "text"
    - ln: "4"
      tokens:
        - text: "  const"
          color: "rose"
        - text: " session = "
          color: "text"
        - text: "createSession"
          color: "accent-hover"
        - text: "(user);"
          color: "text"
    - ln: "5"
      tokens:
        - text: "  expect"
          color: "accent-hover"
        - text: "(session.ttl)."
          color: "text"
        - text: "toBe"
          color: "accent-hover"
        - text: "(ONE_HOUR_SECONDS);"
          color: "text"
    - ln: "6"
      tokens:
        - text: "});"
          color: "text"
  footerPill: "0 smells remaining"
  footerMeta: "preview mode · --apply to write"
mobileCodeWindow:
  fileName: "payment.spec.ts"
  detectedBadge: "2 smells"
  beforeLabel: "BEFORE"
  beforeLines:
    - "try {"
    - "  await chargeCard(order);"
    - "  await sleep(500);"
    - "  throw err;"
    - "}"
  afterLabel: "AFTER"
  afterLines:
    - "await expect(chargeCard(order))"
    - "  .rejects.toThrow(PaymentError);"
    - "jest.useFakeTimers();"
---

Hero section copy, CTAs, trust strip, and before/after code comparison windows.
