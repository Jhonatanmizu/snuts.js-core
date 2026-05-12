import * as t from "@babel/types";

export type SmellSeverity = "low" | "medium" | "high";

export interface Smell {
  file: string;
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
  message: string;
  codeBlock: string;
  description: string;
  explanation: string;
  severity: SmellSeverity;
}

export interface Detector {
  detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]>;
}
