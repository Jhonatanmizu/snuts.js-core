import { readFile } from "node:fs/promises";

import { Smell } from "@/core/detector.interface";

export interface RefactorContext {
  sourceCode: string;
  smells: Smell[];
}

export class SmellContextBuilder {
  async build(file: string, smells: Smell[], filterDescription?: string): Promise<RefactorContext> {
    const sourceCode = await readFile(file, "utf8");
    const normalizedFilter = filterDescription?.trim().toLowerCase();

    const filteredSmells =
      normalizedFilter && normalizedFilter.length > 0
        ? smells.filter((smell) => smell.description.toLowerCase().includes(normalizedFilter))
        : smells;

    return {
      sourceCode,
      smells: filteredSmells,
    };
  }
}
