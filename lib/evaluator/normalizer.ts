import { CanonicalSmellType, NormalizedSmellInstance } from "./types";

import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

export interface SmellMetadata {
  type: CanonicalSmellType;
  shortCode: string;
  label: string;
  aliases: string[];
}

export const SMELL_CATALOG: readonly SmellMetadata[] = [
  {
    type: "AnonymousTest",
    shortCode: "AT",
    label: "AnonymousTest (AT)",
    aliases: ["AnonymousTest", "AT", "Anonymous Test", "AnonymousTestLogic"],
  },
  {
    type: "OvercommentedTest",
    shortCode: "OT",
    label: "Overcommented (OT)",
    aliases: [
      "OvercommentedTest",
      "Overcommented",
      "OT",
      "Overcommented Test",
      "OvercommentedTestLogic",
    ],
  },
  {
    type: "GeneralFixture",
    shortCode: "GF",
    label: "GeneralFixture (GF)",
    aliases: ["GeneralFixture", "GF", "General Fixture", "GeneralFixtureTestLogic"],
  },
  {
    type: "SensitiveEquality",
    shortCode: "SE",
    label: "SensitiveEquality (SE)",
    aliases: ["SensitiveEquality", "SE", "Sensitive Equality", "SensitiveEqualityLogic"],
  },
  {
    type: "TestWithoutDescription",
    shortCode: "TWD",
    label: "TestWithoutDescription (TWD)",
    aliases: [
      "TestWithoutDescription",
      "TWD",
      "Test Without Description",
      "TestWithoutDescriptionLogic",
    ],
  },
  {
    type: "CommentsOnlyTest",
    shortCode: "COT",
    label: "CommentsOnlyTest (COT)",
    aliases: [
      "CommentsOnlyTest",
      "COT",
      "Comments-Only Test",
      "Comments Only Test",
      "CommentsOnlyTestLogic",
    ],
  },
  {
    type: "TranscriptingTest",
    shortCode: "TT",
    label: "TranscriptingTest (TT)",
    aliases: ["TranscriptingTest", "TT", "Transcripting Test", "TranscriptingTestLogic"],
  },
  {
    type: "ComplexSnapshotTest",
    shortCode: "CST",
    label: "ComplexSnapshotTest (CST)",
    aliases: [
      "ComplexSnapshotTest",
      "CST",
      "Complex Snapshot",
      "Complex Snapshot Test",
      "ComplexSnapshotTestLogic",
    ],
  },
  {
    type: "ConditionalTestLogic",
    shortCode: "CTL",
    label: "ConditionalTestLogic (CTL)",
    aliases: ["ConditionalTestLogic", "CTL", "Conditional Test Logic"],
  },
  {
    type: "IdenticalDescription",
    shortCode: "ID",
    label: "IdenticalDescription (ID)",
    aliases: [
      "IdenticalDescription",
      "ID",
      "Identical Description",
      "IdenticalDescriptionTestLogic",
    ],
  },
  {
    type: "NonFunctionalStatement",
    shortCode: "NFS",
    label: "NonFunctionalStatement (NFS)",
    aliases: [
      "NonFunctionalStatement",
      "NFS",
      "Non-Functional Statement",
      "Non Functional Statement",
      "NonFunctionalStatementLogic",
    ],
  },
  {
    type: "OnlyTest",
    shortCode: "ONLY",
    label: "OnlyTest (ONLY)",
    aliases: ["OnlyTest", "ONLY", "Focused / Isolated Test", "OnlyTestLogic"],
  },
  {
    type: "SubOptimalAssert",
    shortCode: "SOA",
    label: "SubOptimalAssert (SOA)",
    aliases: ["SubOptimalAssert", "SOA", "Suboptimal Assertion", "SubOptimalAssertLogic"],
  },
  {
    type: "VerboseTest",
    shortCode: "VT",
    label: "VerboseTest (VT)",
    aliases: ["VerboseTest", "VT", "Verbose Test", "VerboseTestLogic"],
  },
  {
    type: "VerifyInSetup",
    shortCode: "VIS",
    label: "VerifyInSetup (VIS)",
    aliases: ["VerifyInSetup", "VIS", "Assertion in Setup", "VerifyInSetupLogic"],
  },
] as const;

function sanitizeSmellKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

const ALIAS_TO_CANONICAL = new Map<string, CanonicalSmellType>();
const CANONICAL_TO_METADATA = new Map<string, SmellMetadata>();

for (const meta of SMELL_CATALOG) {
  CANONICAL_TO_METADATA.set(meta.type, meta);
  for (const alias of meta.aliases) {
    ALIAS_TO_CANONICAL.set(sanitizeSmellKey(alias), meta.type);
  }
  const desc = SMELL_DESCRIPTIONS[meta.type]?.description;
  if (desc) {
    ALIAS_TO_CANONICAL.set(sanitizeSmellKey(desc), meta.type);
  }
}

export function normalizeSmellType(rawType: string): string {
  const key = sanitizeSmellKey(rawType);
  return ALIAS_TO_CANONICAL.get(key) ?? rawType.trim();
}

export function getSmellMetadata(type: string): {
  type: string;
  shortCode: string;
  label: string;
} {
  const canonical = normalizeSmellType(type);
  const existing = CANONICAL_TO_METADATA.get(canonical);
  if (existing) {
    return existing;
  }
  return {
    type: canonical,
    shortCode: canonical,
    label: canonical,
  };
}

export function normalizeFilePath(filePath: string): string {
  return filePath
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^(\.\/)+/, "")
    .trim();
}

export function pathsMatch(pathA: string, pathB: string): boolean {
  const normA = normalizeFilePath(pathA);
  const normB = normalizeFilePath(pathB);
  if (normA === normB) {
    return true;
  }
  const strippedA = normA.replace(/^\/+/, "");
  const strippedB = normB.replace(/^\/+/, "");
  if (strippedA === strippedB) {
    return true;
  }
  if (strippedA.endsWith(`/${strippedB}`)) {
    return true;
  }
  if (strippedB.endsWith(`/${strippedA}`)) {
    return true;
  }
  return false;
}

export function resolveCanonicalFileKey(
  filePath: string,
  canonicalFiles: Iterable<string>,
): string {
  const normalized = normalizeFilePath(filePath);
  for (const candidate of canonicalFiles) {
    if (pathsMatch(normalized, candidate)) {
      return candidate;
    }
  }
  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPositiveLine(value: unknown, fallback = 1): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 1 ? Math.trunc(num) : fallback;
}

/**
 * Normalizes tool output into flat `NormalizedSmellInstance[]`.
 * Supports:
 * 1. Grouped SNUTS.js API schema: `{ file, type, smells: [{ startLine, endLine }] }`
 * 2. `@snutsjs/core` `JsonReportGenerator` schema (`ReportEntry[]`): `{ filePath, smellType, description, startLine, endLine }`
 * 3. `@snutsjs/core` raw `Smell[]`: `{ file, start: { line }, end: { line }, description, message }`
 * 4. Flat normalized instances: `{ file, type, startLine, endLine }`
 */
export function normalizeToolInput(raw: unknown): NormalizedSmellInstance[] {
  if (!Array.isArray(raw)) {
    throw new Error("Invalid tool results input: expected a JSON array.");
  }

  const instances: NormalizedSmellInstance[] = [];

  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }

    // 1. Grouped SNUTS.js API format: { file, type, smells: [{ startLine, endLine }] }
    if (typeof item["file"] === "string" && Array.isArray(item["smells"])) {
      const file = normalizeFilePath(item["file"]);
      const groupType = typeof item["type"] === "string" ? normalizeSmellType(item["type"]) : "";

      for (const smellItem of item["smells"]) {
        if (!isRecord(smellItem)) {
          continue;
        }
        const rawSmellType = typeof smellItem["type"] === "string" ? smellItem["type"] : groupType;
        if (!rawSmellType) {
          continue;
        }
        const startLine = toPositiveLine(smellItem["startLine"], 1);
        const endLine = toPositiveLine(smellItem["endLine"], startLine);
        instances.push({
          file,
          type: normalizeSmellType(rawSmellType),
          startLine,
          endLine,
        });
      }
      continue;
    }

    // 2. ReportEntry format from JsonReportGenerator: { filePath, smellType, description, startLine, endLine }
    if (typeof item["filePath"] === "string") {
      const file = normalizeFilePath(item["filePath"]);
      const description = typeof item["description"] === "string" ? item["description"] : "";
      const smellType = typeof item["smellType"] === "string" ? item["smellType"] : "";
      const candidateType =
        (description && ALIAS_TO_CANONICAL.get(sanitizeSmellKey(description))) ??
        (smellType && ALIAS_TO_CANONICAL.get(sanitizeSmellKey(smellType))) ??
        (description || smellType);

      if (!candidateType) {
        continue;
      }

      const startLine = toPositiveLine(item["startLine"], 1);
      const endLine = toPositiveLine(item["endLine"], startLine);
      instances.push({
        file,
        type: normalizeSmellType(candidateType),
        startLine,
        endLine,
      });
      continue;
    }

    // 3. Raw Smell object from Detector: { file, start: { line }, end: { line }, description, message }
    if (typeof item["file"] === "string" && isRecord(item["start"])) {
      const file = normalizeFilePath(item["file"]);
      const description = typeof item["description"] === "string" ? item["description"] : "";
      const message = typeof item["message"] === "string" ? item["message"] : "";
      const candidateType =
        (description && ALIAS_TO_CANONICAL.get(sanitizeSmellKey(description))) ??
        (message && ALIAS_TO_CANONICAL.get(sanitizeSmellKey(message))) ??
        (description || message);

      if (!candidateType) {
        continue;
      }

      const startLine = toPositiveLine(item["start"]["line"], 1);
      const endObj = isRecord(item["end"]) ? item["end"] : undefined;
      const endLine = toPositiveLine(endObj?.["line"], startLine);
      instances.push({
        file,
        type: normalizeSmellType(candidateType),
        startLine,
        endLine,
      });
      continue;
    }

    // 4. Flat { file, type, startLine, endLine }
    if (typeof item["file"] === "string" && typeof item["type"] === "string") {
      const file = normalizeFilePath(item["file"]);
      const startLine = toPositiveLine(item["startLine"], 1);
      const endLine = toPositiveLine(item["endLine"], startLine);
      instances.push({
        file,
        type: normalizeSmellType(item["type"]),
        startLine,
        endLine,
      });
    }
  }

  return instances;
}

export interface NormalizedOracleData {
  instances: NormalizedSmellInstance[];
  oracleFiles: Set<string>;
}

/**
 * Normalizes Ground Truth Oracle JSON into flat `NormalizedSmellInstance[]` + the set of oracle files.
 * Supports:
 * 1. Standard Oracle schema: `[{ file, smells: [{ type, startLine, endLine }] }]`
 * 2. Flat normalized instances: `[{ file, type, startLine, endLine }]`
 */
export function normalizeOracleInput(raw: unknown): NormalizedOracleData {
  if (!Array.isArray(raw)) {
    throw new Error("Invalid oracle input: expected a JSON array.");
  }

  const instances: NormalizedSmellInstance[] = [];
  const oracleFiles = new Set<string>();

  for (const item of raw) {
    if (!isRecord(item) || typeof item["file"] !== "string") {
      continue;
    }

    const file = resolveCanonicalFileKey(item["file"], oracleFiles);
    oracleFiles.add(file);

    if (Array.isArray(item["smells"])) {
      for (const smell of item["smells"]) {
        if (!isRecord(smell) || typeof smell["type"] !== "string") {
          continue;
        }
        const startLine = toPositiveLine(smell["startLine"], 1);
        const endLine = toPositiveLine(smell["endLine"], startLine);
        instances.push({
          file,
          type: normalizeSmellType(smell["type"]),
          startLine,
          endLine,
        });
      }
      continue;
    }

    if (typeof item["type"] === "string") {
      const startLine = toPositiveLine(item["startLine"], 1);
      const endLine = toPositiveLine(item["endLine"], startLine);
      instances.push({
        file,
        type: normalizeSmellType(item["type"]),
        startLine,
        endLine,
      });
    }
  }

  return { instances, oracleFiles };
}
