import { Params } from "nestjs-pino";
import { stdTimeFunctions } from "pino";

export const loggerConfig: Params = {
  pinoHttp: {
    // Use a custom timestamp format (ISO with timezone)
    timestamp: stdTimeFunctions.isoTime,

    // In development, pretty‑print; in production, output raw JSON
    transport:
      process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
              singleLine: true, // Keep logs on one line
              colorize: true,
              levelFirst: true,
              translateTime: "yyyy-mm-dd HH:MM:ss",
              ignore: "pid,hostname", // Remove clutter
            },
          }
        : undefined,

    // Custom log level – default is 'info' unless set via env
    level: process.env.LOG_LEVEL || "info",

    // Automatically redact sensitive fields from logs
    redact: {
      paths: [
        "req.headers.authorization",
        "req.body.password",
        "req.body.refresh_token",
      ],
      censor: "***REDACTED***",
    },

    // Custom property serializers for cleaner logs
    serializers: {
      req: (req: any) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
      }),
    },
  },
};
