import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'fs';
import path from 'path';
import { DatabaseConfig, RekeyConfig, ScaffoldResult, CipherType } from './types';
import { validateDatabaseConfig, validateRekeyConfig, sanitizeDatabaseName } from './validator';
import { getLogger } from './logger';

/**
 * Default SQL schema for test table
 */
const DEFAULT_SCHEMA = `
CREATE TABLE IF NOT EXISTS test_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_table (name) VALUES ('Sample Entry 1');
INSERT INTO test_table (name) VALUES ('Sample Entry 2');
INSERT INTO test_table (name) VALUES ('Sample Entry 3');
`;

/**
 * Create a scaffold SQLite database with optional encryption
 * @param config - Database configuration
 * @returns Result of the scaffold operation
 */
export async function createScaffoldDatabase(config: DatabaseConfig): Promise<ScaffoldResult> {
  const logger = getLogger();

  try {
    // Validate configuration
    logger.debug('Validating database configuration...', { config });
    validateDatabaseConfig(config);

    // Sanitize database name
    const dbName = sanitizeDatabaseName(config.databaseName);
    const dbPath = path.resolve(process.cwd(), dbName);

    logger.info(`Creating database: ${dbPath}`);

    // Check if database already exists
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(dbPath)) {
      const error = `Database file already exists: ${dbPath}`;
      logger.error(error);
      return { success: false, error, encrypted: false };
    }

    // Create database connection
    const db = new Database(dbPath);

    // Configure encryption if password is provided
    const isEncrypted = !!(config.password && config.password.length > 0);

    if (isEncrypted) {
      logger.info('Configuring database encryption...');

      // Set cipher FIRST (before password, crucial for DB Browser compatibility)
      if (config.cipher) {
        logger.debug(`Setting cipher: ${config.cipher}`);
        db.pragma(`cipher='${config.cipher}'`);

        // Set legacy=4 for SQLCipher v4 compatibility with DB Browser
        if (config.cipher === 'sqlcipher') {
          logger.debug('Setting legacy=4 for DB Browser compatibility...');
          db.pragma('legacy=4');
        }
      } else {
        // set cipher to sqlcipher if password is provided but no cipher specified (default to sqlcipher)
        logger.debug('No cipher specified, defaulting to sqlcipher...');
        db.pragma(`cipher='sqlcipher'`);
        logger.debug('Setting legacy=4 for DB Browser compatibility...');
        db.pragma('legacy=4');
      }

      // Set encryption key for new database (after cipher settings)
      logger.debug('Setting encryption password...');
      db.pragma(`key='${config.password}'`);

      logger.info('Database encryption enabled');
    }

    // Load and execute schema
    let schema: string;

    if (config.schemaPath) {
      logger.info(`Loading schema from: ${config.schemaPath}`);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      schema = fs.readFileSync(config.schemaPath, 'utf-8');
    } else {
      logger.info('Using default schema with test table');
      schema = DEFAULT_SCHEMA;
    }

    // Execute schema
    logger.debug('Executing schema...');
    db.exec(schema);

    // Verify database was created successfully
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    logger.debug(`Created ${tables.length} table(s):`, { tables });

    // Close database
    db.close();
    logger.info('Database created successfully');

    return {
      success: true,
      databasePath: dbPath,
      encrypted: isEncrypted,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Failed to create database:', { error: errorMessage });

    return {
      success: false,
      error: errorMessage,
      encrypted: false,
    };
  }
}

/**
 * Rekey an existing encrypted database
 * @param config - Rekey configuration
 * @returns Result of the rekey operation
 */
export async function rekeyDatabase(config: RekeyConfig): Promise<ScaffoldResult> {
  const logger = getLogger();

  try {
    logger.debug('Validating rekey configuration...', {
      databaseName: config.databaseName,
      hasCurrentPassword: !!config.currentPassword,
      hasNewPassword: !!config.newPassword,
      newCipher: config.newCipher,
    });

    validateRekeyConfig(config);

    // Use the database path as provided (should already be validated as existing)
    const dbPath = path.isAbsolute(config.databaseName)
      ? config.databaseName
      : path.resolve(process.cwd(), config.databaseName);
    logger.info(`Rekeying database: ${dbPath}`);

    // Open database with current password
    const db = new Database(dbPath);

    // Set current cipher FIRST if specified (before password)
    if (config.currentCipher) {
      logger.debug(`Setting current cipher: ${config.currentCipher}`);
      db.pragma(`cipher='${config.currentCipher}'`);

      // Set legacy=4 for SQLCipher v4 compatibility
      if (config.currentCipher === 'sqlcipher') {
        logger.debug('Setting legacy=4 to open existing database...');
        db.pragma('legacy=4');
      }
    }

    logger.debug('Unlocking database with current password...');
    db.pragma(`key='${config.currentPassword}'`);

    // Verify current password is correct by running a query
    try {
      db.prepare('SELECT count(*) FROM sqlite_master').get();
      logger.debug('Current password verified');
    } catch {
      db.close();
      const error = 'Invalid current password';
      logger.error(error);
      return { success: false, error, encrypted: true };
    }

    // Change cipher if specified
    if (config.newCipher) {
      logger.debug(`Changing cipher to: ${config.newCipher}`);
      db.pragma(`cipher='${config.newCipher}'`);

      // Set legacy=4 for SQLCipher v4 compatibility with DB Browser
      if (config.newCipher === 'sqlcipher') {
        logger.debug('Setting legacy=4 for DB Browser compatibility...');
        db.pragma('legacy=4');
      }
    }

    // Rekey the database
    logger.info('Applying new encryption key...');
    db.pragma(`rekey='${config.newPassword}'`);

    // Close database
    db.close();
    logger.info('Database rekeyed successfully');

    return {
      success: true,
      databasePath: dbPath,
      encrypted: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Failed to rekey database:', { error: errorMessage });

    return {
      success: false,
      error: errorMessage,
      encrypted: true,
    };
  }
}

/**
 * Verify database can be opened and accessed
 * @param databasePath - Path to database file
 * @param password - Optional password for encrypted database
 * @returns True if database is accessible, false otherwise
 */
export function verifyDatabase(
  databasePath: string,
  password?: string,
  cipher?: CipherType
): boolean {
  const logger = getLogger();

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(databasePath)) {
      logger.error(`Database file not found: ${databasePath}`);
      return false;
    }

    const db = new Database(databasePath);

    if (password) {
      // Set cipher FIRST if specified (before password)
      if (cipher) {
        db.pragma(`cipher='${cipher}'`);

        // Set legacy=4 for SQLCipher v4 compatibility
        if (cipher === 'sqlcipher') {
          db.pragma('legacy=4');
        }
      }

      // Then set the key
      db.pragma(`key='${password}'`);
    }

    // Try to query the database
    db.prepare('SELECT count(*) FROM sqlite_master').get();

    db.close();
    logger.debug('Database verification successful');
    return true;
  } catch (error) {
    logger.error('Database verification failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
