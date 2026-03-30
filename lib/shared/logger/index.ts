import pino from "pino";

/**
 * Minimal logger interface used throughout the library.
 * Matches the subset of pino's API that is actually called internally,
 * so any pino instance satisfies this contract out-of-the-box.
 */
export interface ILogger {
  debug(obj: object, msg?: string): void;
  debug(msg: string): void;
  info(obj: object, msg?: string): void;
  info(msg: string): void;
  warn(obj: object, msg?: string): void;
  warn(msg: string): void;
  error(obj: object, msg?: string): void;
  error(msg: string): void;
}

// ---------------------------------------------------------------------------
// Built-in logger implementations
// ---------------------------------------------------------------------------

/**
 * A no-op logger that silences all output.
 * Drop this in via `setLogger(silentLogger)` to suppress all library logs,
 * which is the recommended starting point for IDE extensions.
 *
 * @example
 * ```ts
 * import { setLogger, silentLogger } from "@snutsjs/core";
 * setLogger(silentLogger);
 * ```
 */
export const silentLogger: ILogger = {
  debug: () => {},

  info: () => {},

  warn: () => {},

  error: () => {},
};

function createDefaultLogger(): ILogger {
  return pino({
    name: "snuts",
    level: process.env["LOG_LEVEL"] ?? "info",
  });
}

// ---------------------------------------------------------------------------
// Active logger + public setter
// ---------------------------------------------------------------------------

let _activeLogger: ILogger = createDefaultLogger();

/**
 * Replace the default pino logger with any {@link ILogger}-compatible implementation.
 *
 * **Call this before using any other part of the library**, ideally at
 * extension / process startup, so that all internal log calls are already
 * routed to your implementation.
 *
 * ---
 *
 * ### VS Code extension – silence logs
 * ```ts
 * import { setLogger, silentLogger } from "@snutsjs/core";
 * setLogger(silentLogger);
 * ```
 *
 * ### VS Code extension – forward to an OutputChannel
 * ```ts
 * import { setLogger } from "@snutsjs/core";
 * import * as vscode from "vscode";
 *
 * const out = vscode.window.createOutputChannel("snuts.js");
 *
 * setLogger({
 *   debug: (obj, msg) => out.appendLine(`[debug] ${msg ?? JSON.stringify(obj)}`),
 *   info:  (obj, msg) => out.appendLine(`[info]  ${msg ?? JSON.stringify(obj)}`),
 *   warn:  (obj, msg) => out.appendLine(`[warn]  ${msg ?? JSON.stringify(obj)}`),
 *   error: (obj, msg) => out.appendLine(`[error] ${msg ?? JSON.stringify(obj)}`),
 * });
 * ```
 *
 * ### ZED / LSP server – use any structured logger
 * ```ts
 * import { setLogger } from "@snutsjs/core";
 * import { myLspLogger } from "./lsp-logger";
 * setLogger(myLspLogger);
 * ```
 */
export function setLogger(customLogger: ILogger): void {
  _activeLogger = customLogger;
}

// ---------------------------------------------------------------------------
// Stable proxy export
// ---------------------------------------------------------------------------

/**
 * The library-wide logger instance.
 *
 * This is a {@link Proxy} that always delegates to whatever logger is
 * currently set via {@link setLogger}.  All internal modules import *this*
 * object, so a single `setLogger()` call at startup is enough to redirect
 * every log statement produced by the library.
 */
export const logger: ILogger = new Proxy({} as ILogger, {
  get(_target, prop: string) {
    // Forward any method call to the currently active logger implementation.
    return (...args: unknown[]) =>
      (_activeLogger as unknown as Record<string, (...a: unknown[]) => unknown>)[prop]?.(...args);
  },
});
