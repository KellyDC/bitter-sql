"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const CLI_PATH = path_1.default.join(__dirname, '../../dist/cli.js');
const TEST_DB_DIR = path_1.default.join(__dirname, '../e2e-test-dbs');
test_1.test.describe('CLI E2E Tests', () => {
    test_1.test.beforeAll(() => {
        if (!fs_1.default.existsSync(TEST_DB_DIR)) {
            fs_1.default.mkdirSync(TEST_DB_DIR, { recursive: true });
        }
    });
    test_1.test.afterAll(() => {
        if (fs_1.default.existsSync(TEST_DB_DIR)) {
            fs_1.default.readdirSync(TEST_DB_DIR).forEach((file) => {
                fs_1.default.unlinkSync(path_1.default.join(TEST_DB_DIR, file));
            });
            fs_1.default.rmdirSync(TEST_DB_DIR);
        }
    });
    (0, test_1.test)('should display help', async () => {
        const result = await runCLI(['--help']);
        (0, test_1.expect)(result.stdout).toContain('bitter-sql');
        (0, test_1.expect)(result.stdout).toContain('create');
        (0, test_1.expect)(result.stdout).toContain('rekey');
        (0, test_1.expect)(result.exitCode).toBe(0);
    });
    (0, test_1.test)('should display version', async () => {
        const result = await runCLI(['--version']);
        (0, test_1.expect)(result.stdout).toContain('1.0.0');
        (0, test_1.expect)(result.exitCode).toBe(0);
    });
    (0, test_1.test)('should create database without encryption', async () => {
        const dbName = path_1.default.join(TEST_DB_DIR, 'test-cli-plain.db');
        const result = await runCLI(['create', '-n', dbName]);
        (0, test_1.expect)(result.stdout).toContain('created successfully');
        (0, test_1.expect)(result.exitCode).toBe(0);
        (0, test_1.expect)(fs_1.default.existsSync(dbName)).toBe(true);
    });
    (0, test_1.test)('should create database with encryption', async () => {
        const dbName = path_1.default.join(TEST_DB_DIR, 'test-cli-encrypted.db');
        const result = await runCLI([
            'create',
            '-n', dbName,
            '-p', 'test-password',
            '-c', 'sqlcipher'
        ]);
        (0, test_1.expect)(result.stdout).toContain('created successfully');
        (0, test_1.expect)(result.stdout).toContain('Encrypted');
        (0, test_1.expect)(result.exitCode).toBe(0);
        (0, test_1.expect)(fs_1.default.existsSync(dbName)).toBe(true);
    });
    (0, test_1.test)('should create database with verbose logging', async () => {
        const dbName = path_1.default.join(TEST_DB_DIR, 'test-cli-verbose.db');
        const result = await runCLI(['create', '-n', dbName, '-v']);
        (0, test_1.expect)(result.stdout).toContain('created successfully');
        (0, test_1.expect)(result.exitCode).toBe(0);
    });
    (0, test_1.test)('should fail when database already exists', async () => {
        const dbName = path_1.default.join(TEST_DB_DIR, 'test-cli-duplicate.db');
        await runCLI(['create', '-n', dbName]);
        const result = await runCLI(['create', '-n', dbName]);
        (0, test_1.expect)(result.stdout).toContain('Failed');
        (0, test_1.expect)(result.stdout).toContain('already exists');
        (0, test_1.expect)(result.exitCode).toBe(1);
    });
    (0, test_1.test)('should fail without required database name', async () => {
        const result = await runCLI(['create']);
        (0, test_1.expect)(result.stdout).toContain('Error');
        (0, test_1.expect)(result.exitCode).toBe(1);
    });
    (0, test_1.test)('should show error for invalid cipher', async () => {
        const dbName = path_1.default.join(TEST_DB_DIR, 'test-cli-invalid-cipher.db');
        const result = await runCLI([
            'create',
            '-n', dbName,
            '-c', 'invalid-cipher'
        ]);
        (0, test_1.expect)(result.stderr).toContain('Invalid values');
        (0, test_1.expect)(result.exitCode).toBe(1);
    });
});
async function runCLI(args) {
    return new Promise((resolve) => {
        const child = (0, child_process_1.spawn)('node', [CLI_PATH, ...args], {
            env: { ...process.env, NODE_ENV: 'test' },
        });
        let stdout = '';
        let stderr = '';
        child.stdout?.on('data', (data) => {
            stdout += data.toString();
        });
        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });
        child.on('close', (code) => {
            resolve({
                stdout,
                stderr,
                exitCode: code || 0,
            });
        });
        child.on('error', (error) => {
            resolve({
                stdout,
                stderr: error.message,
                exitCode: 1,
            });
        });
    });
}
//# sourceMappingURL=cli.test.js.map