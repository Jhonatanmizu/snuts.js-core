export type ParsedCommand =
  | {
      type: "help";
    }
  | {
      type: "watch";
      paths: string[];
    }
  | {
      type: "error";
      message: string;
    };

export function usageText(): string {
  return [
    "Usage:",
    "  snuts watch [path]",
    "",
    "Examples:",
    "  npx @snutsjs/core watch .",
    "  npx @snutsjs/core watch src",
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

  return {
    type: "error",
    message: `Unknown command: ${command}`,
  };
}
