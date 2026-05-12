import { AIProvider } from "@/ai/provider.interface";
import { LangChainProvider } from "@/ai/providers/langchain-provider";

export interface AIProviderRegistry {
  getProvider(): AIProvider;
}

export class LangChainProviderRegistry implements AIProviderRegistry {
  private readonly provider: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = provider ?? new LangChainProvider();
  }

  getProvider(): AIProvider {
    return this.provider;
  }
}
