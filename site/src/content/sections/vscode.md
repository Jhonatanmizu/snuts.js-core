---
sectionType: "vscode"
desktopBadge: "Official VS Code Extension · snuts-js"
mobileBadge: "Official extension · snuts-js"
desktopHeading: "Real-time test smell diagnostics right in VS Code"
mobileKicker: "VS CODE EXTENSION"
mobileHeading: "Diagnostics in your editor"
features:
  - desktopTitle: "Live Analysis & Hover Explanations"
    desktopDesc: "Instant squiggles on open, edit and save with category codes and remediation tips."
    mobileTitle: "Live squiggles & hover explanations"
    mobileDesc: "Instant diagnostics on open, edit and save."
    showOnMobile: true
  - desktopTitle: "One-Click Quick Fix (Cmd + .)"
    desktopDesc: "Refactor a single smell or the entire test file, inspected side-by-side in the Diff Editor."
    mobileTitle: "One-click Quick Fix (Cmd + .)"
    mobileDesc: "Refactor a smell and inspect the diff before applying."
    showOnMobile: true
  - desktopTitle: "Explorer Batch Actions"
    desktopDesc: "Right-click any folder to run Analyze in Batch, Refactor in Batch, or export CSV and JSON reports."
    mobileTitle: "Explorer batch actions"
    mobileDesc: "Right-click a folder to analyze or refactor in batch."
    showOnMobile: true
  - desktopTitle: "Secure AI Setup"
    desktopDesc: "Store API keys safely in VS Code SecretStorage via SNUTS.js: Configure AI Provider."
    mobileTitle: "Secure AI Setup"
    mobileDesc: "Store API keys safely in VS Code SecretStorage."
    showOnMobile: false
primaryCtaLabel: "Install from Marketplace"
secondaryCtaLabel: "View Extension Repo"
mockup:
  windowTitle: "auth.test.ts — snuts-worklab — Visual Studio Code"
  mobileWindowTitle: "auth.test.ts"
  projectName: "SNUTS-WORKLAB"
  explorerItems:
    - name: "src"
      kind: "folder"
      active: false
    - name: "tests"
      kind: "folder"
      active: false
    - name: "auth.test.ts"
      kind: "file"
      active: true
    - name: "payment.spec.ts"
      kind: "file"
      active: false
    - name: "user.test.ts"
      kind: "file"
      active: false
  editorTabs:
    - name: "auth.test.ts"
      active: true
    - name: "payment.spec.ts"
      active: false
  codeLines:
    - ln: "1"
      tokens:
        - text: "it"
          color: "accent-hover"
        - text: "('login', "
          color: "text"
        - text: "() => {"
          color: "text"
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
    - ln: "3"
      tokens:
        - text: "  if"
          color: "rose"
        - text: " (user.isActive"
          color: "text"
        - text: " ) {"
          color: "text"
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
    - ln: "5"
      tokens:
        - text: "  }"
          color: "text"
    - ln: "6"
      tokens:
        - text: "});"
          color: "text"
  problemsCount: "4"
  problems:
    - dot: "warn"
      msg: "Conditional Test Logic"
      file: "auth.test.ts"
      loc: "3:5"
      showOnMobile: true
    - dot: "warn"
      msg: "Magic Number Test"
      file: "auth.test.ts"
      loc: "4:26"
      showOnMobile: false
    - dot: "accent"
      msg: "Anonymous Test"
      file: "auth.test.ts"
      loc: "1:1"
      showOnMobile: true
    - dot: "err"
      msg: "Transcripting Test"
      file: "auth.test.ts"
      loc: "2:3"
      showOnMobile: false
  contextMenu:
    - icon: "sparkles"
      label: "Analyze in Batch"
      active: true
    - icon: "sparkles"
      label: "Refactor in Batch"
      active: true
    - icon: "download"
      label: "Export CSV Report"
      active: false
    - icon: "download"
      label: "Export JSON Report"
      active: false
  quickFixTitle: "Quick Fix"
  quickFixMenu:
    - icon: "sparkles"
      label: "Fix 'Verbose Test' with SNUTS.js AI"
      active: true
    - icon: "check"
      label: "Fix all auto-fixable smells"
      active: false
    - icon: "check"
      label: "Ignore this smell for this session"
      active: false
---

Official VS Code Extension showcase banner and editor mockup metadata.
