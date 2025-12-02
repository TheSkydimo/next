type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta?: unknown) {
  const payload = {
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };
  // 目前先输出到 console，后续可以接入第三方
  // eslint-disable-next-line no-console
  console[level](JSON.stringify(payload));
}

export const logger = {
  info(message: string, meta?: unknown) {
    log("info", message, meta);
  },
  warn(message: string, meta?: unknown) {
    log("warn", message, meta);
  },
  error(message: string, meta?: unknown) {
    log("error", message, meta);
  },
};


