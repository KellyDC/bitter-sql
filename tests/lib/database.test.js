"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../../src/lib/database");
const logger_1 = require("../../src/lib/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
(0, logger_1.createLogger)(false);
describe('Database', () => {
    const testDbDir = path_1.default.resolve(__dirname, '../test-databases');
    beforeAll(() => {
        if (!fs_1.default.existsSync(testDbDir)) {
            fs_1.default.mkdirSync(testDbDir, { recursive: true });
        }
    });
    afterAll(() => {
        if (fs_1.default.existsSync(testDbDir)) {
            fs_1.default.readdirSync(testDbDir).forEach((file) => {
                fs_1.default.unlinkSync(path_1.default.join(testDbDir, file));
            });
            fs_1.default.rmdirSync(testDbDir);
        }
    });
    describe('createScaffoldDatabase', () => {
        it('should create a database without encryption', async () => {
            const dbName = path_1.default.join(testDbDir, 'test-plain.db');
            const config = {
                databaseName: dbName,
                verbose: false,
            };
            const result = await (0, database_1.createScaffoldDatabase)(config);
            expect(result.success).toBe(true);
            expect(result.encrypted).toBe(false);
            expect(result.databasePath).toBe(path_1.default.resolve(process.cwd(), dbName));
            expect(fs_1.default.existsSync(result.databasePath)).toBe(true);
        });
        it('should create a database with encryption', async () => {
            const dbName = path_1.default.join(testDbDir, 'test-encrypted.db');
            const config = {
                databaseName: dbName,
                password: 'test-password',
                cipher: 'sqlcipher',
                verbose: false,
            };
            const result = await (0, database_1.createScaffoldDatabase)(config);
            expect(result.success).toBe(true);
            expect(result.encrypted).toBe(true);
            expect(fs_1.default.existsSync(result.databasePath)).toBe(true);
        });
        it('should create database with custom schema', async () => {
            const schemaPath = path_1.default.join(testDbDir, 'custom-schema.sql');
            const dbName = path_1.default.join(testDbDir, 'test-custom.db');
            const customSchema = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT UNIQUE
        );
        INSERT INTO users (username, email) VALUES ('testuser', 'test@example.com');
      `;
            fs_1.default.writeFileSync(schemaPath, customSchema);
            const config = {
                databaseName: dbName,
                schemaPath,
                verbose: false,
            };
            const result = await (0, database_1.createScaffoldDatabase)(config);
            expect(result.success).toBe(true);
            expect(fs_1.default.existsSync(result.databasePath)).toBe(true);
            fs_1.default.unlinkSync(schemaPath);
        });
        it('should fail if database already exists', async () => {
            const dbName = path_1.default.join(testDbDir, 'test-duplicate.db');
            await (0, database_1.createScaffoldDatabase)({
                databaseName: dbName,
                verbose: false,
            });
            const result = await (0, database_1.createScaffoldDatabase)({
                databaseName: dbName,
                verbose: false,
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('already exists');
        });
        it('should handle invalid configuration', async () => {
            const config = {
                databaseName: '',
                verbose: false,
            };
            const result = await (0, database_1.createScaffoldDatabase)(config);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
    describe('rekeyDatabase', () => {
        it('should rekey an encrypted database', async () => {
            const dbName = path_1.default.join(testDbDir, 'test-rekey.db');
            const initialPassword = 'initial-pass';
            const newPassword = 'new-pass';
            await (0, database_1.createScaffoldDatabase)({
                databaseName: dbName,
                password: initialPassword,
                cipher: 'sqlcipher',
                verbose: false,
            });
            const rekeyConfig = {
                databaseName: path_1.default.resolve(process.cwd(), dbName),
                currentPassword: initialPassword,
                newPassword: newPassword,
                verbose: false,
            };
            const result = await (0, database_1.rekeyDatabase)(rekeyConfig);
            expect(result.success).toBe(true);
            expect(result.encrypted).toBe(true);
            const verified = (0, database_1.verifyDatabase)(path_1.default.resolve(process.cwd(), dbName), newPassword);
            expect(verified).toBe(true);
        });
        it('should fail with incorrect current password', async () => {
            const dbName = path_1.default.join(testDbDir, 'test-rekey-fail.db');
            const correctPassword = 'correct-pass';
            await (0, database_1.createScaffoldDatabase)({
                databaseName: dbName,
                password: correctPassword,
                cipher: 'sqlcipher',
                verbose: false,
            });
            const rekeyConfig = {
                databaseName: path_1.default.resolve(process.cwd(), dbName),
                currentPassword: 'wrong-pass',
                newPassword: 'new-pass',
                verbose: false,
            };
            const result = await (0, database_1.rekeyDatabase)(rekeyConfig);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid current password');
        });
        it('should change cipher during rekey', async () => {
            const dbName = path_1.default.join(testDbDir, 'test-rekey-cipher.db');
            const password = 'test-pass';
            await (0, database_1.createScaffoldDatabase)({
                databaseName: dbName,
                password: password,
                cipher: 'sqlcipher',
                verbose: false,
            });
            const rekeyConfig = {
                databaseName: path_1.default.resolve(process.cwd(), dbName),
                currentPassword: password,
                newPassword: password,
                newCipher: 'aes256cbc',
                verbose: false,
            };
            const result = await (0, database_1.rekeyDatabase)(rekeyConfig);
            expect(result.success).toBe(true);
        });
    });
    describe('verifyDatabase', () => {
        it('should verify unencrypted database', async () => {
            const dbName = path_1.default.join(testDbDir, 'test-verify-plain.db');
            const result = await (0, database_1.createScaffoldDatabase)({
                databaseName: dbName,
                verbose: false,
            });
            const verified = (0, database_1.verifyDatabase)(result.databasePath);
            expect(verified).toBe(true);
        });
        it('should verify encrypted database with correct password', async () => {
            const dbName = path_1.default.join(testDbDir, 'test-verify-encrypted.db');
            const password = 'verify-pass';
            const result = await (0, database_1.createScaffoldDatabase)({
                databaseName: dbName,
                password: password,
                cipher: 'sqlcipher',
                verbose: false,
            });
            const verified = (0, database_1.verifyDatabase)(result.databasePath, password);
            expect(verified).toBe(true);
        });
        it('should fail to verify encrypted database with wrong password', async () => {
            const dbName = path_1.default.join(testDbDir, 'test-verify-wrong.db');
            const password = 'correct-pass';
            const result = await (0, database_1.createScaffoldDatabase)({
                databaseName: dbName,
                password: password,
                cipher: 'sqlcipher',
                verbose: false,
            });
            const verified = (0, database_1.verifyDatabase)(result.databasePath, 'wrong-pass');
            expect(verified).toBe(false);
        });
        it('should fail for non-existent database', () => {
            const verified = (0, database_1.verifyDatabase)('/nonexistent/database.db');
            expect(verified).toBe(false);
        });
    });
});
//# sourceMappingURL=database.test.js.map