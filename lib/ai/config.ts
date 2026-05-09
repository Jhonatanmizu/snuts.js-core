import { AIProviderName } from "./types";

export interface AIConfigInput {
  provider?: AIProviderName;
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ResolvedAIConfig {
  provider: AIProviderName;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_PROVIDER: AIProviderName = "openai";
const DEFAULT_MODELS: Record<AIProviderName, string> = {
  openai: "gpt-4.1-mini",
  google: "gemini-2.0-flash",
  anthropic: "claude-3-5-sonnet-latest",
  deepseek: "deepseek-chat",
  kimi: "moonshot-v1-8k",
};

function readApiKeyFromEnv(provider: AIProviderName): string | undefined {
  if (provider === "openai") return process.env["OPENAI_API_KEY"];
  if (provider === "google")
    return process.env["GOOGLE_API_KEY"] ?? process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  if (provider === "anthropic") return process.env["ANTHROPIC_API_KEY"];
  if (provider === "deepseek") return process.env["DEEPSEEK_API_KEY"];
  return process.env["KIMI_API_KEY"] ?? process.env["MOONSHOT_API_KEY"];
}

function parseProvider(value: string | undefined): AIProviderName {
  if (!value) return DEFAULT_PROVIDER;
  if (
    value === "openai" ||
    value === "google" ||
    value === "anthropic" ||
    value === "deepseek" ||
    value === "kimi"
  ) {
    return value;
  }
  throw new Error(`Unsupported AI provider: ${value}`);
}

export function resolveAIConfig(input: AIConfigInput): ResolvedAIConfig {
  const provider = input.provider ?? parseProvider(process.env["SNUTS_AI_PROVIDER"]);
  const model = input.model ?? process.env["SNUTS_AI_MODEL"] ?? DEFAULT_MODELS[provider];
  const apiKey = input.apiKey ?? readApiKeyFromEnv(provider);
  const temperature = input.temperature ?? Number(process.env["SNUTS_AI_TEMPERATURE"] ?? "0.1");
  const maxTokens = input.maxTokens ?? Number(process.env["SNUTS_AI_MAX_TOKENS"] ?? "1400");

  if (!apiKey) {
    throw new Error(
      `Missing API key for provider '${provider}'. Configure it with the provider key env var or pass --api-key.`,
    );
  }

  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
    throw new Error(`Invalid temperature: ${temperature}. Expected a number between 0 and 2.`);
  }

  if (!Number.isFinite(maxTokens) || maxTokens <= 0) {
    throw new Error(`Invalid maxTokens: ${maxTokens}. Expected a positive number.`);
  }

  return {
    provider,
    model,
    apiKey,
    temperature,
    maxTokens,
  };
}
