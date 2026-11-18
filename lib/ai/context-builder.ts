import { readFile } from "node:fs/promises";

import { Smell } from "@/core/detector.interface";

export interface RefactorContext {
  sourceCode: string;
  smells: Smell[];
}

export function filterSmellsByDescription(smells: Smell[], filterDescription?: string): Smell[] {
  const normalizedFilter = filterDescription?.trim().toLowerCase();
  if (!normalizedFilter || normalizedFilter.length === 0) {
    return smells;
  }

  return smells.filter((smell) => smell.description.toLowerCase().includes(normalizedFilter));
}

export class SmellContextBuilder {
  async build(file: string, smells: Smell[], filterDescription?: string): Promise<RefactorContext> {
    const sourceCode = await readFile(file, "utf8");
    const filteredSmells = filterSmellsByDescription(smells, filterDescription);

    return {
      sourceCode,
      smells: filteredSmells,
    };
  }
}
