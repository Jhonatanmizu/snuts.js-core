import { writeFile } from "node:fs/promises";

import { SmellContextBuilder } from "@/ai/context-builder";
import { parseRefactorPatch, applyEdits } from "@/ai/patch-utils";
import { AIProviderRegistry } from "@/ai/providers/registry";
import { PromptComposer } from "@/ai/prompt-composer";
import { RefactorRequest, RefactorResult, RollbackToken } from "@/ai/types";
import { DetectorRunner } from "@/core/detector-runner";
import { Detector } from "@/core/detector.interface";

export class RefactorService {
  private readonly detectorRunner: DetectorRunner;
  private readonly contextBuilder = new SmellContextBuilder();
  private readonly promptComposer = new PromptComposer();

  constructor(
    detectors: Detector[],
    private readonly providerRegistry: AIProviderRegistry,
  ) {
    this.detectorRunner = new DetectorRunner(detectors);
  }

  async refactorFile(request: RefactorRequest): Promise<RefactorResult> {
    request.onProgress?.({ stage: "analyzing", message: `Analyzing ${request.file}` });
    const smells = await this.detectorRunner.run(request.file);

    request.onProgress?.({ stage: "building_context", message: "Building AI context" });
    const context = await this.contextBuilder.build(
      request.file,
      smells,
      request.smellDescriptionFilter,
    );

    request.onProgress?.({ stage: "generating_patch", message: "Generating patch with model" });
    const provider = this.providerRegistry.getProvider();
    const modelResponse = await provider.generate({
      provider: request.provider,
      model: request.model,
      apiKey: request.apiKey,
      temperature: request.temperature ?? 0.1,
      maxTokens: request.maxTokens ?? 1400,
      systemPrompt: this.promptComposer.composeSystemPrompt(),
      userPrompt: this.promptComposer.composeUserPrompt(
        request.file,
        context.sourceCode,
        context.smells,
      ),
    });

    request.onProgress?.({ stage: "validating_patch", message: "Validating model patch" });
    const patch = parseRefactorPatch(modelResponse.content);
    const updatedContent = applyEdits(context.sourceCode, patch.edits);

    let rollbackToken: RollbackToken | undefined;
    if (request.apply) {
      request.onProgress?.({ stage: "applying_patch", message: "Applying patch to file" });
      await writeFile(request.file, updatedContent, "utf8");
      rollbackToken = {
        file: request.file,
        createdAt: new Date().toISOString(),
        originalContent: context.sourceCode,
        updatedContent,
      };
    }

    request.onProgress?.({ stage: "completed", message: "Refactor completed" });
    return {
      file: request.file,
      apply: request.apply,
      summary: patch.summary,
      smells,
      patch,
      diagnostics: {
        smellsDetected: smells.length,
        smellsUsedInPrompt: context.smells.length,
        provider: request.provider,
        model: request.model,
      },
      updatedContent,
      rollbackToken,
    };
  }

  async rollback(token: RollbackToken): Promise<void> {
    await writeFile(token.file, token.originalContent, "utf8");
  }
}
