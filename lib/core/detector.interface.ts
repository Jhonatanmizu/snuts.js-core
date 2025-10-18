import * as t from "@babel/types";

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
}

export interface Detector {
  detect(ast: t.File, sourceCode: string, file: string): Promise<Smell[]>;
}
