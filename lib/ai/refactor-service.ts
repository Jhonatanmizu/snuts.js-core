import { writeFile } from "node:fs/promises";

import { filterSmellsByDescription, SmellContextBuilder } from "@/ai/context-builder";
import { parseRefactorPatch, applyEdits } from "@/ai/patch-utils";
import { AIProviderRegistry } from "@/ai/providers/registry";
import { PromptComposer } from "@/ai/prompt-composer";
import {
  BatchFileFailure,
  BatchRefactorRequest,
  BatchRefactorResult,
  RefactorRequest,
  RefactorResult,
  RollbackToken,
} from "@/ai/types";
import { DetectorRunner } from "@/core/detector-runner";
import { Detector } from "@/core/detector.interface";
import { resolveTestFiles } from "@/reporter/project-analyzer";

const DEFAULT_BATCH_CONCURRENCY = 3;

function normalizeConcurrency(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value < 1) {
    return DEFAULT_BATCH_CONCURRENCY;
  }

  return Math.trunc(value);
}

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

  async refactorBatch(request: BatchRefactorRequest): Promise<BatchRefactorResult> {
    const discoveredFiles = await resolveTestFiles(request.paths);
    const preAnalysis = await Promise.all(
      discoveredFiles.map(async (file) => {
        const smells = await this.detectorRunner.run(file);
        const matching = filterSmellsByDescription(smells, request.smellDescriptionFilter);
        return { file, hasSmells: matching.length > 0 };
      }),
    );

    const filesToRefactor = preAnalysis.filter((item) => item.hasSmells).map((item) => item.file);

    const totalFiles = filesToRefactor.length;
    const concurrency = normalizeConcurrency(request.concurrency);
    const results: RefactorResult[] = [];
    const failures: BatchFileFailure[] = [];
    let nextIndex = 0;
    let completedFiles = 0;

    const runWorker = async (): Promise<void> => {
      while (nextIndex < totalFiles) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        const targetFile = filesToRefactor[currentIndex];
        if (!targetFile) {
          continue;
        }

        try {
          const result = await this.refactorFile({
            file: targetFile,
            apply: request.apply,
            provider: request.provider,
            model: request.model,
            apiKey: request.apiKey,
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            smellDescriptionFilter: request.smellDescriptionFilter,
            onProgress: (event) => {
              request.onProgress?.({
                file: targetFile,
                completedFiles,
                totalFiles,
                stage: event.stage,
                message: event.message,
              });
            },
          });
          results.push(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push({ file: targetFile, error: message });
        } finally {
          completedFiles += 1;
          request.onProgress?.({
            file: targetFile,
            completedFiles,
            totalFiles,
            stage: "completed",
            message: `Processed ${completedFiles}/${totalFiles}: ${targetFile}`,
          });
        }
      }
    };

    const workerCount = Math.min(concurrency, Math.max(totalFiles, 1));
    await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

    const filesRefactored = results.filter((res) => res.patch.edits.length > 0).length;
    const filesUnchanged = results.length - filesRefactored;

    return {
      totalFilesDiscovered: discoveredFiles.length,
      filesWithSmells: totalFiles,
      filesRefactored,
      filesUnchanged,
      filesFailed: failures.length,
      results,
      failures,
    };
  }

  async rollback(token: RollbackToken): Promise<void> {
    await writeFile(token.file, token.originalContent, "utf8");
  }
}
