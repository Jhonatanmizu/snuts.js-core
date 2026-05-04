import { ReportGenerator } from "./report.interface";

import { Smell } from "@/core/detector.interface";

export class CsvReportGenerator implements ReportGenerator {
  generate(smells: Smell[]): string {
    const headers = "Smell Type,File Path,Start Line,End Line,Message,Description\n";
    const rows = smells
      .map(
        (smell) =>
          `"${smell.message}","${smell.file}",${smell.start.line},${smell.end.line},"${smell.message.replace(/"/g, '""')}","${smell.description.replace(/"/g, '""')}"`, // Escaping quotes for CSV
      )
      .join("\n");

    return headers + rows;
  }
}
