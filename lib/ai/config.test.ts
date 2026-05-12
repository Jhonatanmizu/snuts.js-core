import { resolveAIConfig } from "./config";

describe("resolveAIConfig", () => {
  const previousEnv = process.env;

  beforeEach(() => {
    process.env = { ...previousEnv };
    delete process.env["SNUTS_AI_PROVIDER"];
    delete process.env["SNUTS_AI_MODEL"];
    delete process.env["OPENAI_API_KEY"];
    delete process.env["GOOGLE_API_KEY"];
    delete process.env["ANTHROPIC_API_KEY"];
    delete process.env["DEEPSEEK_API_KEY"];
    delete process.env["KIMI_API_KEY"];
  });

  afterAll(() => {
    process.env = previousEnv;
  });

  it("resolves openai config from env defaults", () => {
    process.env["OPENAI_API_KEY"] = "openai-key";
    const config = resolveAIConfig({ provider: "openai" });
    expect(config.provider).toBe("openai");
    expect(config.model).toBe("gpt-4.1-mini");
    expect(config.apiKey).toBe("openai-key");
  });

  it("uses explicit input values over env", () => {
    process.env["OPENAI_API_KEY"] = "env-key";
    const config = resolveAIConfig({
      provider: "openai",
      apiKey: "explicit-key",
      model: "gpt-4.1",
      temperature: 0.4,
      maxTokens: 700,
    });
    expect(config.apiKey).toBe("explicit-key");
    expect(config.model).toBe("gpt-4.1");
    expect(config.temperature).toBe(0.4);
    expect(config.maxTokens).toBe(700);
  });

  it("throws when provider key is missing", () => {
    expect(() => resolveAIConfig({ provider: "anthropic" })).toThrow(
      "Missing API key for provider 'anthropic'",
    );
  });
});
