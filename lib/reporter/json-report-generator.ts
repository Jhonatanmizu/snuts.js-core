import { ReportGenerator, ReportEntry } from "./report.interface";

import { Smell } from "@/core/detector.interface";

export class JsonReportGenerator implements ReportGenerator {
  generate(smells: Smell[]): string {
    const reportEntries: ReportEntry[] = smells.map((smell) => ({
      smellType: smell.message,
      filePath: smell.file,
      startLine: smell.start.line,
      endLine: smell.end.line,
      message: smell.message,
      description: smell.description,
    }));

    return JSON.stringify(reportEntries, null, 2);
  }
}
