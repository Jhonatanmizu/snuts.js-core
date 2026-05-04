export type ReportFormat = "csv" | "json";

export type ParsedCommand =
  | {
      type: "help";
    }
  | {
      type: "watch";
      paths: string[];
    }
  | {
      type: "analyze";
      paths: string[];
      format: ReportFormat;
      output?: string;
    }
  | {
      type: "error";
      message: string;
    };

export function usageText(): string {
  return [
    "Usage:",
    "  snuts watch [path]",
    "  snuts analyze [path] --format <format> [--output <file>]",
    "",
    "Examples:",
    "  npx @snutsjs/core watch .",
    "  npx @snutsjs/core watch src",
    "  npx @snutsjs/core analyze . --format json",
    "  npx @snutsjs/core analyze src --format csv --output report.csv",
  ].join("\n");
}

export function parseCliArgs(argv: string[]): ParsedCommand {
  const [command, ...rest] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    return { type: "help" };
  }

  if (command === "watch") {
    return {
      type: "watch",
      paths: rest.length > 0 ? rest : ["."],
    };
  }

  if (command === "analyze") {
    const paths: string[] = [];
    let format: ReportFormat | undefined;
    let output: string | undefined;

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i];
      if (arg === "--format") {
        if (i + 1 >= rest.length) {
          return { type: "error", message: "Missing value for --format." };
        }
        format = rest[i + 1] as ReportFormat;
        i++;
      } else if (arg === "--output") {
        if (i + 1 >= rest.length) {
          return { type: "error", message: "Missing value for --output." };
        }
        output = rest[i + 1];
        i++;
      } else {
        paths.push(arg!);
      }
    }

    if (!format) {
      return {
        type: "error",
        message: "Missing report format. Use --format <csv|json>.",
      };
    }

    if (format !== "csv" && format !== "json") {
      return {
        type: "error",
        message: `Invalid report format: ${format}. Supported formats are csv and json.`,
      };
    }

    return {
      type: "analyze",
      paths: paths.length > 0 ? paths : ["."],
      format,
      output,
    };
  }

  return {
    type: "error",
    message: `Unknown command: ${command}`,
  };
}
