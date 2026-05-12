import { AIProviderName } from "./types";

export interface ProviderGenerateRequest {
  provider: AIProviderName;
  model: string;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface ProviderGenerateResponse {
  content: string;
}

export interface AIProvider {
  generate(request: ProviderGenerateRequest): Promise<ProviderGenerateResponse>;
}
