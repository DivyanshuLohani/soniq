import winston from 'winston';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Ensure logs directory exists if file logging is enabled
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch {
    // Ignore in read-only environments (e.g. Vercel serverless)
  }
}

// Custom log levels and colors
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

winston.addColors(customLevels.colors);

// Console Formatter: [Timestamp] [LEVEL] [soniq] Message {metadata}
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [soniq]: ${message}${metaString}`;
  })
);

// Production / File Formatter: Structured JSON
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: logLevel,
    format: isProduction ? jsonFormat : consoleFormat,
  }),
];

// Add file transports if running in a non-serverless persistent environment
if (fs.existsSync(logDir)) {
  try {
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        level: logLevel,
        format: jsonFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );
  } catch (err) {
    // Continue with console if filesystem writes are restricted
  }
}

export const logger = winston.createLogger({
  levels: customLevels.levels,
  level: logLevel,
  defaultMeta: { service: 'soniq-backend' },
  transports,
  exitOnError: false,
});

/**
 * Express HTTP Request Logger Middleware
 * Logs incoming request method, URL, status code, latency, and client IP
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();

  res.on('finish', () => {
    const duration = +(performance.now() - startTime).toFixed(1);
    const statusCode = res.statusCode;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || null;

    const logPayload = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      durationMs: duration,
      clientIp,
      ...(userId ? { userId } : {}),
    };

    if (statusCode >= 500) {
      logger.error(`HTTP ${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`, logPayload);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`, logPayload);
    } else {
      logger.http(`HTTP ${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`, logPayload);
    }
  });

  next();
};

export default logger;
