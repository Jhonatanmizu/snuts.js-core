/**
 * @warning SIDE-EFFECT ENTRY POINT
 *
 * Importing this module **immediately** starts a file watcher on `process.cwd()`.
 * It is intended solely for CLI / standalone runtime use.
 *
 * DO NOT import this module from an IDE extension (VS Code, ZED, etc.).
 * Doing so will silently spawn a chokidar watcher and pollute stdout/stderr
 * as soon as the extension activates.
 *
 * For programmatic use inside IDE extensions, import `DetectorRunner` directly
 * from the root entry point and drive it with the IDE's own file-watcher API:
 *
 * ```ts
 * import { DetectorRunner, detectors, setLogger, silentLogger } from "@snutsjs/core";
 *
 * // Silence the default pino logger so nothing leaks to stdout/stderr
 * setLogger(silentLogger);
 *
 * const runner = new DetectorRunner(
 *   Object.values(detectors).map((D) => new D()),
 * );
 *
 * // VS Code example – use the workspace file-watcher instead of chokidar
 * const watcher = vscode.workspace.createFileSystemWatcher("**\/*.{test,spec}.{ts,js}");
 * watcher.onDidChange(async (uri) => {
 *   const smells = await runner.run(uri.fsPath);
 *   // convert smells → vscode.Diagnostic[] and push to a DiagnosticCollection
 * });
 * ```
 */
import { startWatch } from "./watch-runner";

void startWatch([process.cwd()]);
