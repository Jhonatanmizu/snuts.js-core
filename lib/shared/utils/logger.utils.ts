export class LoggerUtils {
  /**
   * Clears the visible terminal output.
   *
   * Only runs when stdout is attached to an interactive TTY (i.e. a real
   * terminal). This guard prevents the ANSI clear-screen escape sequence from
   * corrupting IDE output channels, language-server logs, or any other
   * non-terminal stdout consumer.
   */
  public static clearVisibleConsole(): void {
    if (process.stdout.isTTY) {
      process.stdout.write("\x1Bc");
    }
  }
}
