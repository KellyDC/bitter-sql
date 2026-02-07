import { createScaffoldDatabase, rekeyDatabase, verifyDatabase } from '../../src/lib/database';
import { DatabaseConfig, RekeyConfig } from '../../src/lib/types';
import { createLogger } from '../../src/lib/logger';
import fs from 'fs';
import path from 'path';

// Initialize logger for tests
createLogger(false);

describe('Database', () => {
  const testDbDir = path.resolve(__dirname, '../test-databases');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDbDir)) {
      fs.readdirSync(testDbDir).forEach((file) => {
        fs.unlinkSync(path.join(testDbDir, file));
      });
      fs.rmdirSync(testDbDir);
    }
  });

  describe('createScaffoldDatabase', () => {
    it('should create a database without encryption', async () => {
      const dbName = path.join(testDbDir, 'test-plain.db');
      const config: DatabaseConfig = {
        databaseName: dbName,
        verbose: false,
      };

      const result = await createScaffoldDatabase(config);

      expect(result.success).toBe(true);
      expect(result.encrypted).toBe(false);
      expect(result.databasePath).toBe(path.resolve(process.cwd(), dbName));
      expect(fs.existsSync(result.databasePath!)).toBe(true);
    });

    it('should create a database with encryption', async () => {
      const dbName = path.join(testDbDir, 'test-encrypted.db');
      const config: DatabaseConfig = {
        databaseName: dbName,
        password: 'test-password',
        cipher: 'sqlcipher',
        verbose: false,
      };

      const result = await createScaffoldDatabase(config);

      expect(result.success).toBe(true);
      expect(result.encrypted).toBe(true);
      expect(fs.existsSync(result.databasePath!)).toBe(true);
    });

    it('should create database with custom schema', async () => {
      const schemaPath = path.join(testDbDir, 'custom-schema.sql');
      const dbName = path.join(testDbDir, 'test-custom.db');

      // Create custom schema file
      const customSchema = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT UNIQUE
        );
        INSERT INTO users (username, email) VALUES ('testuser', 'test@example.com');
      `;
      fs.writeFileSync(schemaPath, customSchema);

      const config: DatabaseConfig = {
        databaseName: dbName,
        schemaPath,
        verbose: false,
      };

      const result = await createScaffoldDatabase(config);

      expect(result.success).toBe(true);
      expect(fs.existsSync(result.databasePath!)).toBe(true);

      // Clean up schema file
      fs.unlinkSync(schemaPath);
    });

    it('should fail if database already exists', async () => {
      const dbName = path.join(testDbDir, 'test-duplicate.db');
      
      // Create initial database
      await createScaffoldDatabase({
        databaseName: dbName,
        verbose: false,
      });

      // Try to create again
      const result = await createScaffoldDatabase({
        databaseName: dbName,
        verbose: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should handle invalid configuration', async () => {
      const config: DatabaseConfig = {
        databaseName: '',
        verbose: false,
      };

      const result = await createScaffoldDatabase(config);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('rekeyDatabase', () => {
    it('should rekey an encrypted database', async () => {
      const dbName = path.join(testDbDir, 'test-rekey.db');
      const initialPassword = 'initial-pass';
      const newPassword = 'new-pass';

      // Create encrypted database
      const createResult = await createScaffoldDatabase({
        databaseName: dbName,
        password: initialPassword,
        cipher: 'sqlcipher',
        verbose: false,
      });

      expect(createResult.success).toBe(true);

      // Rekey the database using the actual created path
      const rekeyConfig: RekeyConfig = {
        databaseName: createResult.databasePath!,
        currentPassword: initialPassword,
        currentCipher: 'sqlcipher',
        newPassword: newPassword,
        verbose: false,
      };

      const result = await rekeyDatabase(rekeyConfig);

      if (!result.success) {
        console.log('Rekey test failed with error:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.encrypted).toBe(true);

      // Verify new password works
      const verified = verifyDatabase(
        result.databasePath!,
        newPassword,
        'sqlcipher'
      );
      expect(verified).toBe(true);
    });

    it('should fail with incorrect current password', async () => {
      const dbName = path.join(testDbDir, 'test-rekey-fail.db');
      const correctPassword = 'correct-pass';

      // Create encrypted database
      await createScaffoldDatabase({
        databaseName: dbName,
        password: correctPassword,
        cipher: 'sqlcipher',
        verbose: false,
      });

      // Try to rekey with wrong password
      const rekeyConfig: RekeyConfig = {
        databaseName: path.resolve(process.cwd(), dbName),
        currentPassword: 'wrong-pass',
        currentCipher: 'sqlcipher',
        newPassword: 'new-pass',
        verbose: false,
      };

      const result = await rekeyDatabase(rekeyConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid current password');
    });

    it('should change cipher during rekey', async () => {
      const dbName = path.join(testDbDir, 'test-rekey-cipher.db');
      const password = 'test-pass';

      // Create encrypted database with one cipher
      const createResult = await createScaffoldDatabase({
        databaseName: dbName,
        password: password,
        cipher: 'sqlcipher',
        verbose: false,
      });

      expect(createResult.success).toBe(true);

      // Rekey with different cipher
      const rekeyConfig: RekeyConfig = {
        databaseName: createResult.databasePath!,
        currentPassword: password,
        currentCipher: 'sqlcipher',
        newPassword: password,
        newCipher: 'aes256cbc',
        verbose: false,
      };

      const result = await rekeyDatabase(rekeyConfig);

      if (!result.success) {
        console.log('Cipher change test failed with error:', result.error);
      }

      expect(result.success).toBe(true);
    });
  });

  describe('verifyDatabase', () => {
    it('should verify unencrypted database', async () => {
      const dbName = path.join(testDbDir, 'test-verify-plain.db');

      const result = await createScaffoldDatabase({
        databaseName: dbName,
        verbose: false,
      });

      const verified = verifyDatabase(result.databasePath!);
      expect(verified).toBe(true);
    });

    it('should verify encrypted database with correct password', async () => {
      const dbName = path.join(testDbDir, 'test-verify-encrypted.db');
      const password = 'verify-pass';

      const result = await createScaffoldDatabase({
        databaseName: dbName,
        password: password,
        cipher: 'sqlcipher',
        verbose: false,
      });

      const verified = verifyDatabase(result.databasePath!, password, 'sqlcipher');
      
      if (!verified) {
        console.log('Verify encrypted test failed for path:',result.databasePath);
      }
      
      expect(verified).toBe(true);
    });

    it('should fail to verify encrypted database with wrong password', async () => {
      const dbName = path.join(testDbDir, 'test-verify-wrong.db');
      const password = 'correct-pass';

      const result = await createScaffoldDatabase({
        databaseName: dbName,
        password: password,
        cipher: 'sqlcipher',
        verbose: false,
      });

      const verified = verifyDatabase(result.databasePath!, 'wrong-pass', 'sqlcipher');
      expect(verified).toBe(false);
    });

    it('should fail for non-existent database', () => {
      const verified = verifyDatabase('/nonexistent/database.db');
      expect(verified).toBe(false);
    });
  });
});
