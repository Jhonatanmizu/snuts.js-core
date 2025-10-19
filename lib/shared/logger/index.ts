import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  name: "test-smell-watcher",
  level: process.env.LOG_LEVEL || "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
          levelFirst: true,
        },
      }
    : undefined,
});
