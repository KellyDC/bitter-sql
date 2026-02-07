import { createLogger, getLogger, setVerbose } from '../../src/lib/logger';
import fs from 'fs';
import path from 'path';

describe('Logger', () => {
  const logDir = 'logs';

  afterEach(() => {
    // Clean up log directory after each test
    if (fs.existsSync(logDir)) {
      fs.readdirSync(logDir).forEach((file) => {
        fs.unlinkSync(path.join(logDir, file));
      });
      fs.rmdirSync(logDir);
    }
  });

  describe('createLogger', () => {
    it('should create a logger with default settings', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
      expect(logger.level).toBe('info');
    });

    it('should create a logger with verbose mode', () => {
      const logger = createLogger(true);
      expect(logger).toBeDefined();
      expect(logger.level).toBe('debug');
    });

    it('should create log directory when verbose is enabled', () => {
      createLogger(true);
      expect(fs.existsSync(logDir)).toBe(true);
    });

    it('should not create log files when verbose is disabled', () => {
      createLogger(false);
      // Log directory might exist but no files should be created initially
      if (fs.existsSync(logDir)) {
        const files = fs.readdirSync(logDir);
        expect(files.length).toBe(0);
      }
    });
  });

  describe('getLogger', () => {
    it('should return existing logger instance', () => {
      const logger1 = createLogger();
      const logger2 = getLogger();
      expect(logger1).toBe(logger2);
    });

    it('should create logger if not exists', () => {
      const logger = getLogger();
      expect(logger).toBeDefined();
    });
  });

  describe('setVerbose', () => {
    it('should update logger verbosity', () => {
      const logger = createLogger(false);
      expect(logger.level).toBe('info');

      setVerbose(true);
      // Check that at least one transport has debug level
      const hasDebugTransport = logger.transports.some((t) => t.level === 'debug');
      expect(hasDebugTransport).toBe(true);
    });

    it('should handle setting verbose to false', () => {
      const logger = createLogger(true);
      setVerbose(false);
      
      const hasInfoTransport = logger.transports.some((t) => t.level === 'info');
      expect(hasInfoTransport).toBe(true);
    });
  });

  describe('logging functionality', () => {
    it('should log messages without errors', () => {
      const logger = createLogger();
      
      expect(() => {
        logger.info('Test info message');
        logger.error('Test error message');
        logger.debug('Test debug message');
      }).not.toThrow();
    });

    it('should handle logging with metadata', () => {
      const logger = createLogger(true);
      
      expect(() => {
        logger.info('Test message', { key: 'value', count: 42 });
      }).not.toThrow();
    });
  });
});
