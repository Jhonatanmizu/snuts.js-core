import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

import {
  AIProvider,
  ProviderGenerateRequest,
  ProviderGenerateResponse,
} from "@/ai/provider.interface";

function contentToString(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          const text = (item as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("\n");
  }

  return "";
}

export class LangChainProvider implements AIProvider {
  async generate(request: ProviderGenerateRequest): Promise<ProviderGenerateResponse> {
    const model = this.createModel(request);
    const response = await model.invoke([
      new SystemMessage(request.systemPrompt),
      new HumanMessage(request.userPrompt),
    ]);

    return {
      content: contentToString(response.content),
    };
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
