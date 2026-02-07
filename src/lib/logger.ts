import winston from 'winston';
import path from 'path';
import fs from 'fs';

/**
 * Logger instance for the application
 */
let logger: winston.Logger;

/**
 * Initialize the logger with optional verbose mode
 * @param verbose - Enable verbose logging
 * @returns Configured winston logger instance
 */
export function createLogger(verbose = false): winston.Logger {
  const logDir = 'logs';

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logLevel = verbose ? 'debug' : 'info';

  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(meta).length > 0 && meta.stack) {
        msg += `\n${meta.stack}`;
      }
      return msg;
    })
  );

  const transports: winston.transport[] = [
    new winston.transports.Console({
      level: logLevel,
      format: consoleFormat,
    }),
  ];

  // Add file transport only in verbose mode
  if (verbose) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: logFormat,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: logFormat,
      })
    );
  }

  logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    exitOnError: false,
  });

  return logger;
}

/**
 * Get the current logger instance
 * @returns Current winston logger instance
 */
export function getLogger(): winston.Logger {
  if (!logger) {
    logger = createLogger();
  }
  return logger;
}

/**
 * Update logger verbosity
 * @param verbose - Enable verbose logging
 */
export function setVerbose(verbose: boolean): void {
  if (logger) {
    const level = verbose ? 'debug' : 'info';
    logger.transports.forEach((transport) => {
      transport.level = level;
    });
  }
}
