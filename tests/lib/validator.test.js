"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("../../src/lib/validator");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
describe('Validator', () => {
    describe('validateDatabaseConfig', () => {
        it('should validate a valid configuration', () => {
            const config = {
                databaseName: 'test.db',
                password: 'secret',
                cipher: 'sqlcipher',
                verbose: false,
            };
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).not.toThrow();
        });
        it('should add .db extension if missing', () => {
            const config = {
                databaseName: 'test',
            };
            (0, validator_1.validateDatabaseConfig)(config);
            expect(config.databaseName).toBe('test.db');
        });
        it('should throw error for empty database name', () => {
            const config = {
                databaseName: '',
            };
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).toThrow(validator_1.ValidationError);
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).toThrow('required and must be a non-empty string');
        });
        it('should throw error for whitespace-only database name', () => {
            const config = {
                databaseName: '   ',
            };
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).toThrow(validator_1.ValidationError);
        });
        it('should throw error for invalid cipher', () => {
            const config = {
                databaseName: 'test.db',
                cipher: 'invalid-cipher',
            };
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).toThrow(validator_1.ValidationError);
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).toThrow('Invalid cipher');
        });
        it('should throw error for short password', () => {
            const config = {
                databaseName: 'test.db',
                password: 'abc',
            };
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).toThrow(validator_1.ValidationError);
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).toThrow('at least 4 characters');
        });
        it('should accept empty password', () => {
            const config = {
                databaseName: 'test.db',
                password: '',
            };
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).not.toThrow();
        });
        it('should throw error for non-existent schema file', () => {
            const config = {
                databaseName: 'test.db',
                schemaPath: '/nonexistent/schema.sql',
            };
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).toThrow(validator_1.ValidationError);
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).toThrow('not found');
        });
        it('should throw error for illegal characters in database name', () => {
            const config = {
                databaseName: 'test<>:.db',
            };
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).toThrow(validator_1.ValidationError);
            expect(() => (0, validator_1.validateDatabaseConfig)(config)).toThrow('illegal characters');
        });
    });
    describe('validateRekeyConfig', () => {
        const tempDbPath = path_1.default.join(__dirname, 'temp-test.db');
        beforeEach(() => {
            fs_1.default.writeFileSync(tempDbPath, '');
        });
        afterEach(() => {
            if (fs_1.default.existsSync(tempDbPath)) {
                fs_1.default.unlinkSync(tempDbPath);
            }
        });
        it('should validate a valid rekey configuration', () => {
            const config = {
                databaseName: tempDbPath,
                currentPassword: 'oldpass',
                newPassword: 'newpass',
                verbose: false,
            };
            expect(() => (0, validator_1.validateRekeyConfig)(config)).not.toThrow();
        });
        it('should throw error for non-existent database', () => {
            const config = {
                databaseName: '/nonexistent/db.db',
                currentPassword: 'oldpass',
                newPassword: 'newpass',
            };
            expect(() => (0, validator_1.validateRekeyConfig)(config)).toThrow(validator_1.ValidationError);
            expect(() => (0, validator_1.validateRekeyConfig)(config)).toThrow('not found');
        });
        it('should throw error for missing current password', () => {
            const config = {
                databaseName: tempDbPath,
                currentPassword: '',
                newPassword: 'newpass',
            };
            expect(() => (0, validator_1.validateRekeyConfig)(config)).toThrow(validator_1.ValidationError);
            expect(() => (0, validator_1.validateRekeyConfig)(config)).toThrow('Current password is required');
        });
        it('should throw error for missing new password', () => {
            const config = {
                databaseName: tempDbPath,
                currentPassword: 'oldpass',
                newPassword: '',
            };
            expect(() => (0, validator_1.validateRekeyConfig)(config)).toThrow(validator_1.ValidationError);
        });
        it('should throw error for short new password', () => {
            const config = {
                databaseName: tempDbPath,
                currentPassword: 'oldpass',
                newPassword: 'abc',
            };
            expect(() => (0, validator_1.validateRekeyConfig)(config)).toThrow(validator_1.ValidationError);
            expect(() => (0, validator_1.validateRekeyConfig)(config)).toThrow('at least 4 characters');
        });
        it('should throw error for invalid new cipher', () => {
            const config = {
                databaseName: tempDbPath,
                currentPassword: 'oldpass',
                newPassword: 'newpass',
                newCipher: 'invalid',
            };
            expect(() => (0, validator_1.validateRekeyConfig)(config)).toThrow(validator_1.ValidationError);
            expect(() => (0, validator_1.validateRekeyConfig)(config)).toThrow('Invalid cipher');
        });
    });
    describe('sanitizeDatabaseName', () => {
        it('should remove path traversal attempts', () => {
            const result = (0, validator_1.sanitizeDatabaseName)('../../malicious.db');
            expect(result).toBe('malicious.db');
        });
        it('should replace unsafe characters with underscores', () => {
            const result = (0, validator_1.sanitizeDatabaseName)('test<>:file.db');
            expect(result).toBe('test___file.db');
        });
        it('should handle normal filenames', () => {
            const result = (0, validator_1.sanitizeDatabaseName)('normal_file-123.db');
            expect(result).toBe('normal_file-123.db');
        });
        it('should extract basename from path', () => {
            const result = (0, validator_1.sanitizeDatabaseName)('/path/to/database.db');
            expect(result).toBe('database.db');
        });
    });
});
//# sourceMappingURL=validator.test.js.map