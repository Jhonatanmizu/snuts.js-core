import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

import {
  AIProvider,
  ProviderGenerateRequest,
  ProviderGenerateResponse,
} from "@/ai/provider.interface";

export class LangChainProvider implements AIProvider {
  async generate(request: ProviderGenerateRequest): Promise<ProviderGenerateResponse> {
    const model = this.createModel(request);
    const chain = model.pipe(new StringOutputParser());

    const content = await chain.invoke([
      new SystemMessage(request.systemPrompt),
      new HumanMessage(request.userPrompt),
    ]);

    return { content };
  }

  private createModel(request: ProviderGenerateRequest) {
    if (request.provider === "google") {
      return new ChatGoogleGenerativeAI({
        model: request.model,
        apiKey: request.apiKey,
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
      });
    }

    if (request.provider === "anthropic") {
      return new ChatAnthropic({
        model: request.model,
        apiKey: request.apiKey,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      });
    }

    if (request.provider === "deepseek") {
      return new ChatOpenAI({
        model: request.model,
        apiKey: request.apiKey,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        configuration: {
          baseURL: process.env["DEEPSEEK_BASE_URL"] ?? "https://api.deepseek.com/v1",
        },
      });
    }

    if (request.provider === "kimi") {
      return new ChatOpenAI({
        model: request.model,
        apiKey: request.apiKey,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        configuration: {
          baseURL: process.env["KIMI_BASE_URL"] ?? "https://api.moonshot.ai/v1",
        },
      });
    }

    return new ChatOpenAI({
      model: request.model,
      apiKey: request.apiKey,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });
  }
}
