import { Smell } from "@/core/detector.interface";

export type AIProviderName = "openai" | "google" | "anthropic" | "deepseek" | "kimi";

export type RefactorProgressStage =
  | "analyzing"
  | "building_context"
  | "generating_patch"
  | "validating_patch"
  | "applying_patch"
  | "completed";

export interface RefactorProgressEvent {
  stage: RefactorProgressStage;
  message: string;
}

export interface RefactorEdit {
  startLine: number;
  endLine: number;
  replacement: string;
  reason: string;
}

export interface RefactorPatch {
  summary: string;
  edits: RefactorEdit[];
}

export interface RefactorDiagnostics {
  smellsDetected: number;
  smellsUsedInPrompt: number;
  provider: AIProviderName;
  model: string;
}

export interface RollbackToken {
  file: string;
  createdAt: string;
  originalContent: string;
  updatedContent: string;
}

export interface RefactorRequest {
  file: string;
  apply: boolean;
  provider: AIProviderName;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  smellDescriptionFilter?: string;
  onProgress?: (event: RefactorProgressEvent) => void;
}

export interface RefactorResult {
  file: string;
  apply: boolean;
  summary: string;
  smells: Smell[];
  patch: RefactorPatch;
  diagnostics: RefactorDiagnostics;
  updatedContent: string;
  rollbackToken?: RollbackToken;
}
