export class LoggerUtils {
  public static clearVisibleConsole(): void {
    process.stdout.write("\x1Bc");
  }
}
