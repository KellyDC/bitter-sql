import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

const CLI_PATH = path.join(__dirname, '../../dist/cli.js');
const TEST_DB_DIR = path.join(__dirname, '../e2e-test-dbs');

test.describe('CLI E2E Tests', () => {
  test.beforeAll(() => {
    // Ensure test database directory exists
    if (!fs.existsSync(TEST_DB_DIR)) {
      fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    }
  });

  test.afterAll(() => {
    // Clean up test databases
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.readdirSync(TEST_DB_DIR).forEach((file) => {
        fs.unlinkSync(path.join(TEST_DB_DIR, file));
      });
      fs.rmdirSync(TEST_DB_DIR);
    }
  });

  test('should display help', async () => {
    const result = await runCLI(['--help']);

    expect(result.stdout).toContain('bitter-sql');
    expect(result.stdout).toContain('create');
    expect(result.stdout).toContain('rekey');
    expect(result.exitCode).toBe(0);
  });

  test('should display version', async () => {
    const result = await runCLI(['--version']);

    expect(result.stdout).toContain('1.0.0');
    expect(result.exitCode).toBe(0);
  });

  test('should create database without encryption', async () => {
    const dbName = path.join(TEST_DB_DIR, 'test-cli-plain.db');
    const result = await runCLI(['create', '-n', dbName]);

    expect(result.stdout).toContain('created successfully');
    expect(result.exitCode).toBe(0);
    expect(fs.existsSync(dbName)).toBe(true);
  });

  test('should create database with encryption', async () => {
    const dbName = path.join(TEST_DB_DIR, 'test-cli-encrypted.db');
    const result = await runCLI(
      ['create', '-n', dbName, '-c', 'sqlcipher'],
      { password: 'test-password' } // Pass password via env
    );

    expect(result.stdout).toContain('created');
    expect(result.stdout).toContain('encrypted');
    expect(result.exitCode).toBe(0);
    expect(fs.existsSync(dbName)).toBe(true);
  });

  test('should create database with verbose logging', async () => {
    const dbName = path.join(TEST_DB_DIR, 'test-cli-verbose.db');
    const result = await runCLI(['create', '-n', dbName, '-v']);

    expect(result.stdout).toContain('created successfully');
    expect(result.exitCode).toBe(0);
  });

  test('should fail when database already exists', async () => {
    const dbName = path.join(TEST_DB_DIR, 'test-cli-duplicate.db');

    // Create first database
    await runCLI(['create', '-n', dbName]);

    // Try to create again
    const result = await runCLI(['create', '-n', dbName]);

    expect(result.stdout).toContain('Failed');
    expect(result.stdout).toContain('already exists');
    expect(result.exitCode).toBe(1);
  });

  test.skip('should require database name for non-interactive mode', async () => {
    // Skipped: without database name, CLI enters interactive mode which
    // requires TTY and will timeout in automated tests.
    // Interactive mode functionality is tested manually.
  });

  test('should show error for invalid cipher', async () => {
    const dbName = path.join(TEST_DB_DIR, 'test-cli-invalid-cipher.db');
    const result = await runCLI([
      'create',
      '-n', dbName,
      '-c', 'invalid-cipher'
    ]);

    expect(result.stderr).toContain('Invalid values');
    expect(result.exitCode).toBe(1);
  });
});

/**
 * Helper function to run CLI commands
 */
async function runCLI(
  args: string[],
  env?: Record<string, string>
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve) => {
    const child: ChildProcess = spawn('node', [CLI_PATH, ...args], {
      env: { ...process.env, NODE_ENV: 'test', ...env },
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
