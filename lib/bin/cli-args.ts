import { EvaluationGranularity, EvaluationOutputFormat, LineMatchMode } from "@/evaluator/types";

export type ReportFormat = "csv" | "json";
export type RefactorOutputFormat = "text" | "json";
export type AIProviderName = "openai" | "google" | "anthropic" | "deepseek" | "kimi";

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
      config?: string;
      watch?: boolean;
      smells?: string[];
    }
  | {
      type: "refactor";
      file: string;
      provider: AIProviderName;
      model?: string;
      apiKey?: string;
      apply: boolean;
      output?: string;
      format: RefactorOutputFormat;
      smellDescriptionFilter?: string;
      temperature?: number;
      maxTokens?: number;
    }
  | {
      type: "evaluate";
      oracle: string;
      toolResults?: string;
      targetPaths?: string[];
      granularity: EvaluationGranularity;
      outputFormat: EvaluationOutputFormat;
      lineTolerance: number;
      matchMode: LineMatchMode;
      onlyOracleFiles: boolean;
      output?: string;
      smells?: string[];
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
    "  snuts refactor <file> --provider <provider> [--model <model>] [--apply]",
    "  snuts evaluate --oracle <file> (--tool-results <file> | --target <path>) [--granularity <class|fine-grained>] [--output-format <console|json|csv>] [--line-tolerance <n>]",
    "",
    "Examples:",
    "  npx @snutsjs/core watch .",
    "  npx @snutsjs/core watch src",
    "  npx @snutsjs/core analyze . --format json",
    "  npx @snutsjs/core analyze src --format csv --output report.csv",
    "  npx @snutsjs/core refactor ./my-test.test.ts --provider openai --format json",
    "  npx @snutsjs/core evaluate --tool-results=results.json --oracle=oracle.json --granularity=fine-grained --output-format=console --line-tolerance=1",
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
    let config: string | undefined;
    let watch: boolean | undefined;
    const smells: string[] = [];

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i] ?? "";
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
      } else if (arg === "--config") {
        if (i + 1 >= rest.length) {
          return { type: "error", message: "Missing value for --config." };
        }
        config = rest[i + 1];
        i++;
      } else if (arg === "--watch") {
        watch = true;
      } else if (arg === "--smell") {
        if (i + 1 >= rest.length) {
          return { type: "error", message: "Missing value for --smell." };
        }
        smells.push(rest[i + 1]!);
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
      config,
      watch,
      smells: smells.length > 0 ? smells : undefined,
    };
  }

  if (command === "refactor") {
    let file: string | undefined;
    let provider: AIProviderName | undefined;
    let model: string | undefined;
    let apiKey: string | undefined;
    let apply = false;
    let output: string | undefined;
    let format: RefactorOutputFormat = "text";
    let smellDescriptionFilter: string | undefined;
    let temperature: number | undefined;
    let maxTokens: number | undefined;

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i] ?? "";
      if (arg === "--provider") {
        const value = rest[i + 1];
        if (!value) return { type: "error", message: "Missing value for --provider." };
        provider = value as AIProviderName;
        i++;
        continue;
      }

      if (arg === "--model") {
        const value = rest[i + 1];
        if (!value) return { type: "error", message: "Missing value for --model." };
        model = value;
        i++;
        continue;
      }

      if (arg === "--api-key") {
        const value = rest[i + 1];
        if (!value) return { type: "error", message: "Missing value for --api-key." };
        apiKey = value;
        i++;
        continue;
      }

      if (arg === "--output") {
        const value = rest[i + 1];
        if (!value) return { type: "error", message: "Missing value for --output." };
        output = value;
        i++;
        continue;
      }

      if (arg === "--format") {
        const value = rest[i + 1];
        if (!value) return { type: "error", message: "Missing value for --format." };
        if (value !== "text" && value !== "json") {
          return {
            type: "error",
            message: `Invalid refactor format: ${value}. Supported formats are text and json.`,
          };
        }
        format = value;
        i++;
        continue;
      }

      if (arg === "--smell") {
        const value = rest[i + 1];
        if (!value) return { type: "error", message: "Missing value for --smell." };
        smellDescriptionFilter = value;
        i++;
        continue;
      }

      if (arg === "--temperature") {
        const value = rest[i + 1];
        if (!value) return { type: "error", message: "Missing value for --temperature." };
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
          return { type: "error", message: `Invalid value for --temperature: ${value}` };
        }
        temperature = parsed;
        i++;
        continue;
      }

      if (arg === "--max-tokens") {
        const value = rest[i + 1];
        if (!value) return { type: "error", message: "Missing value for --max-tokens." };
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
          return { type: "error", message: `Invalid value for --max-tokens: ${value}` };
        }
        maxTokens = parsed;
        i++;
        continue;
      }

      if (arg === "--apply") {
        apply = true;
        continue;
      }

      if (arg.startsWith("--")) {
        return { type: "error", message: `Unknown option for refactor command: ${arg}` };
      }

      if (!file) {
        file = arg;
      } else {
        return { type: "error", message: "Refactor command accepts only one file path." };
      }
    }

    if (!file) {
      return {
        type: "error",
        message: "Missing file path. Usage: snuts refactor <file> --provider <provider>.",
      };
    }

    if (!provider) {
      return {
        type: "error",
        message: "Missing provider. Use --provider <openai|google|anthropic|deepseek|kimi>.",
      };
    }

    if (
      provider !== "openai" &&
      provider !== "google" &&
      provider !== "anthropic" &&
      provider !== "deepseek" &&
      provider !== "kimi"
    ) {
      return {
        type: "error",
        message: `Invalid provider: ${provider}. Supported providers are openai, google, anthropic, deepseek, kimi.`,
      };
    }

    return {
      type: "refactor",
      file,
      provider,
      model,
      apiKey,
      apply,
      output,
      format,
      smellDescriptionFilter,
      temperature,
      maxTokens,
    };
  }

  if (command === "evaluate") {
    let oracle: string | undefined;
    let toolResults: string | undefined;
    const targetPaths: string[] = [];
    let granularity: EvaluationGranularity = "fine-grained";
    let outputFormat: EvaluationOutputFormat = "console";
    let lineTolerance = 1;
    let matchMode: LineMatchMode = "start-line";
    let onlyOracleFiles = false;
    let output: string | undefined;
    const smells: string[] = [];

    // Expand --flag=value tokens into ["--flag", "value"]
    const normalizedArgs: string[] = [];
    for (const rawArg of rest) {
      if (rawArg.startsWith("--") && rawArg.includes("=")) {
        const eqIdx = rawArg.indexOf("=");
        normalizedArgs.push(rawArg.slice(0, eqIdx), rawArg.slice(eqIdx + 1));
      } else {
        normalizedArgs.push(rawArg);
      }
    }

    for (let i = 0; i < normalizedArgs.length; i++) {
      const arg = normalizedArgs[i] ?? "";

      if (arg === "--oracle") {
        const value = normalizedArgs[i + 1];
        if (!value) return { type: "error", message: "Missing value for --oracle." };
        oracle = value;
        i++;
        continue;
      }

      if (arg === "--tool-results") {
        const value = normalizedArgs[i + 1];
        if (!value) return { type: "error", message: "Missing value for --tool-results." };
        toolResults = value;
        i++;
        continue;
      }

      if (arg === "--target") {
        const value = normalizedArgs[i + 1];
        if (!value) return { type: "error", message: "Missing value for --target." };
        targetPaths.push(value);
        i++;
        continue;
      }

      if (arg === "--granularity") {
        const value = normalizedArgs[i + 1];
        if (!value) return { type: "error", message: "Missing value for --granularity." };
        if (value !== "class" && value !== "fine-grained") {
          return {
            type: "error",
            message: `Invalid granularity: ${value}. Supported values are class and fine-grained.`,
          };
        }
        granularity = value;
        i++;
        continue;
      }

      if (arg === "--output-format" || arg === "--format") {
        const value = normalizedArgs[i + 1];
        if (!value) return { type: "error", message: `Missing value for ${arg}.` };
        if (value !== "console" && value !== "json" && value !== "csv") {
          return {
            type: "error",
            message: `Invalid output format: ${value}. Supported formats are console, json, and csv.`,
          };
        }
        outputFormat = value;
        i++;
        continue;
      }

      if (arg === "--line-tolerance") {
        const value = normalizedArgs[i + 1];
        if (!value) return { type: "error", message: "Missing value for --line-tolerance." };
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
          return {
            type: "error",
            message: `Invalid value for --line-tolerance: ${value}. Expected a non-negative number.`,
          };
        }
        lineTolerance = parsed;
        i++;
        continue;
      }

      if (arg === "--match-mode") {
        const value = normalizedArgs[i + 1];
        if (!value) return { type: "error", message: "Missing value for --match-mode." };
        if (value !== "start-line" && value !== "range" && value !== "overlap") {
          return {
            type: "error",
            message: `Invalid match mode: ${value}. Supported modes are start-line, range, and overlap.`,
          };
        }
        matchMode = value;
        i++;
        continue;
      }

      if (arg === "--only-oracle-files") {
        onlyOracleFiles = true;
        continue;
      }

      if (arg === "--output") {
        const value = normalizedArgs[i + 1];
        if (!value) return { type: "error", message: "Missing value for --output." };
        output = value;
        i++;
        continue;
      }

      if (arg === "--smell") {
        const value = normalizedArgs[i + 1];
        if (!value) return { type: "error", message: "Missing value for --smell." };
        smells.push(value);
        i++;
        continue;
      }

      if (arg.startsWith("--")) {
        return { type: "error", message: `Unknown option for evaluate command: ${arg}` };
      }

      targetPaths.push(arg);
    }

    if (!oracle) {
      return {
        type: "error",
        message: "Missing oracle path. Use --oracle <path>.",
      };
    }

    if (!toolResults && targetPaths.length === 0) {
      return {
        type: "error",
        message:
          "Missing tool results or target path. Provide --tool-results <path> or --target <dir>.",
      };
    }

    return {
      type: "evaluate",
      oracle,
      toolResults,
      targetPaths: targetPaths.length > 0 ? targetPaths : undefined,
      granularity,
      outputFormat,
      lineTolerance,
      matchMode,
      onlyOracleFiles,
      output,
      smells: smells.length > 0 ? smells : undefined,
    };
  }

  return {
    type: "error",
    message: `Unknown command: ${command}`,
  };
}
