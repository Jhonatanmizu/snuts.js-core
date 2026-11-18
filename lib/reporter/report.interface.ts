import { Smell } from "@/core/detector.interface";

export interface ReportEntry {
  smellType: string;
  filePath: string;
  startLine: number;
  endLine: number;
  message: string;
  description: string;
}

export interface ReportGenerator {
  generate(smells: Smell[]): string;
}
