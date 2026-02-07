"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../../src/lib/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
describe('Logger', () => {
    const logDir = 'logs';
    afterEach(() => {
        if (fs_1.default.existsSync(logDir)) {
            fs_1.default.readdirSync(logDir).forEach((file) => {
                fs_1.default.unlinkSync(path_1.default.join(logDir, file));
            });
            fs_1.default.rmdirSync(logDir);
        }
    });
    describe('createLogger', () => {
        it('should create a logger with default settings', () => {
            const logger = (0, logger_1.createLogger)();
            expect(logger).toBeDefined();
            expect(logger.level).toBe('info');
        });
        it('should create a logger with verbose mode', () => {
            const logger = (0, logger_1.createLogger)(true);
            expect(logger).toBeDefined();
            expect(logger.level).toBe('debug');
        });
        it('should create log directory when verbose is enabled', () => {
            (0, logger_1.createLogger)(true);
            expect(fs_1.default.existsSync(logDir)).toBe(true);
        });
        it('should not create log files when verbose is disabled', () => {
            (0, logger_1.createLogger)(false);
            if (fs_1.default.existsSync(logDir)) {
                const files = fs_1.default.readdirSync(logDir);
                expect(files.length).toBe(0);
            }
        });
    });
    describe('getLogger', () => {
        it('should return existing logger instance', () => {
            const logger1 = (0, logger_1.createLogger)();
            const logger2 = (0, logger_1.getLogger)();
            expect(logger1).toBe(logger2);
        });
        it('should create logger if not exists', () => {
            const logger = (0, logger_1.getLogger)();
            expect(logger).toBeDefined();
        });
    });
    describe('setVerbose', () => {
        it('should update logger verbosity', () => {
            const logger = (0, logger_1.createLogger)(false);
            expect(logger.level).toBe('info');
            (0, logger_1.setVerbose)(true);
            const hasDebugTransport = logger.transports.some((t) => t.level === 'debug');
            expect(hasDebugTransport).toBe(true);
        });
        it('should handle setting verbose to false', () => {
            const logger = (0, logger_1.createLogger)(true);
            (0, logger_1.setVerbose)(false);
            const hasInfoTransport = logger.transports.some((t) => t.level === 'info');
            expect(hasInfoTransport).toBe(true);
        });
    });
    describe('logging functionality', () => {
        it('should log messages without errors', () => {
            const logger = (0, logger_1.createLogger)();
            expect(() => {
                logger.info('Test info message');
                logger.error('Test error message');
                logger.debug('Test debug message');
            }).not.toThrow();
        });
        it('should handle logging with metadata', () => {
            const logger = (0, logger_1.createLogger)(true);
            expect(() => {
                logger.info('Test message', { key: 'value', count: 42 });
            }).not.toThrow();
        });
    });
});
//# sourceMappingURL=logger.test.js.map