import { validateDatabaseConfig, validateRekeyConfig, sanitizeDatabaseName, ValidationError } from '../../src/lib/validator';
import { DatabaseConfig, RekeyConfig } from '../../src/lib/types';
import fs from 'fs';
import path from 'path';

describe('Validator', () => {
  describe('validateDatabaseConfig', () => {
    it('should validate a valid configuration', () => {
      const config: DatabaseConfig = {
        databaseName: 'test.db',
        password: 'secret',
        cipher: 'sqlcipher',
        verbose: false,
      };

      expect(() => validateDatabaseConfig(config)).not.toThrow();
    });

    it('should add .db extension if missing', () => {
      const config: DatabaseConfig = {
        databaseName: 'test',
      };

      validateDatabaseConfig(config);
      expect(config.databaseName).toBe('test.db');
    });

    it('should throw error for empty database name', () => {
      const config: DatabaseConfig = {
        databaseName: '',
      };

      expect(() => validateDatabaseConfig(config)).toThrow(ValidationError);
      expect(() => validateDatabaseConfig(config)).toThrow('required and must be a non-empty string');
    });

    it('should throw error for whitespace-only database name', () => {
      const config: DatabaseConfig = {
        databaseName: '   ',
      };

      expect(() => validateDatabaseConfig(config)).toThrow(ValidationError);
    });

    it('should throw error for invalid cipher', () => {
      const config: DatabaseConfig = {
        databaseName: 'test.db',
        cipher: 'invalid-cipher' as any,
      };

      expect(() => validateDatabaseConfig(config)).toThrow(ValidationError);
      expect(() => validateDatabaseConfig(config)).toThrow('Invalid cipher');
    });

    it('should throw error for short password', () => {
      const config: DatabaseConfig = {
        databaseName: 'test.db',
        password: 'abc',
      };

      expect(() => validateDatabaseConfig(config)).toThrow(ValidationError);
      expect(() => validateDatabaseConfig(config)).toThrow('at least 4 characters');
    });

    it('should accept empty password', () => {
      const config: DatabaseConfig = {
        databaseName: 'test.db',
        password: '',
      };

      expect(() => validateDatabaseConfig(config)).not.toThrow();
    });

    it('should throw error for non-existent schema file', () => {
      const config: DatabaseConfig = {
        databaseName: 'test.db',
        schemaPath: '/nonexistent/schema.sql',
      };

      expect(() => validateDatabaseConfig(config)).toThrow(ValidationError);
      expect(() => validateDatabaseConfig(config)).toThrow('not found');
    });

    it('should throw error for illegal characters in database name', () => {
      const config: DatabaseConfig = {
        databaseName: 'test<>:.db',
      };

      expect(() => validateDatabaseConfig(config)).toThrow(ValidationError);
      expect(() => validateDatabaseConfig(config)).toThrow('illegal characters');
    });
  });

  describe('validateRekeyConfig', () => {
    const tempDbPath = path.join(__dirname, 'temp-test.db');

    beforeEach(() => {
      // Create a temporary database file
      fs.writeFileSync(tempDbPath, '');
    });

    afterEach(() => {
      // Clean up
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
      }
    });

    it('should validate a valid rekey configuration', () => {
      const config: RekeyConfig = {
        databaseName: tempDbPath,
        currentPassword: 'oldpass',
        newPassword: 'newpass',
        verbose: false,
      };

      expect(() => validateRekeyConfig(config)).not.toThrow();
    });

    it('should throw error for non-existent database', () => {
      const config: RekeyConfig = {
        databaseName: '/nonexistent/db.db',
        currentPassword: 'oldpass',
        newPassword: 'newpass',
      };

      expect(() => validateRekeyConfig(config)).toThrow(ValidationError);
      expect(() => validateRekeyConfig(config)).toThrow('not found');
    });

    it('should throw error for missing current password', () => {
      const config: RekeyConfig = {
        databaseName: tempDbPath,
        currentPassword: '',
        newPassword: 'newpass',
      };

      expect(() => validateRekeyConfig(config)).toThrow(ValidationError);
      expect(() => validateRekeyConfig(config)).toThrow('Current password is required');
    });

    it('should throw error for missing new password', () => {
      const config: RekeyConfig = {
        databaseName: tempDbPath,
        currentPassword: 'oldpass',
        newPassword: '',
      };

      expect(() => validateRekeyConfig(config)).toThrow(ValidationError);
    });

    it('should throw error for short new password', () => {
      const config: RekeyConfig = {
        databaseName: tempDbPath,
        currentPassword: 'oldpass',
        newPassword: 'abc',
      };

      expect(() => validateRekeyConfig(config)).toThrow(ValidationError);
      expect(() => validateRekeyConfig(config)).toThrow('at least 4 characters');
    });

    it('should throw error for invalid new cipher', () => {
      const config: RekeyConfig = {
        databaseName: tempDbPath,
        currentPassword: 'oldpass',
        newPassword: 'newpass',
        newCipher: 'invalid' as any,
      };

      expect(() => validateRekeyConfig(config)).toThrow(ValidationError);
      expect(() => validateRekeyConfig(config)).toThrow('Invalid cipher');
    });
  });

  describe('sanitizeDatabaseName', () => {
    it('should remove path traversal attempts', () => {
      const result = sanitizeDatabaseName('../../malicious.db');
      expect(result).toBe('malicious.db');
    });

    it('should replace unsafe characters with underscores', () => {
      const result = sanitizeDatabaseName('test<>:file.db');
      expect(result).toBe('test___file.db');
    });

    it('should handle normal filenames', () => {
      const result = sanitizeDatabaseName('normal_file-123.db');
      expect(result).toBe('normal_file-123.db');
    });

    it('should preserve absolute paths and sanitize filename', () => {
      const result = sanitizeDatabaseName('/path/to/database.db');
      expect(result).toBe('/path/to/database.db');
    });
  });
});
