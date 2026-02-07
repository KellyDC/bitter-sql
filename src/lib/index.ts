/**
 * bitter-sql - SQLite database scaffolding tool with encryption support
 *
 * @packageDocumentation
 */

export { createScaffoldDatabase, rekeyDatabase, verifyDatabase } from './database';
export { createLogger, getLogger, setVerbose } from './logger';
export {
  validateDatabaseConfig,
  validateRekeyConfig,
  sanitizeDatabaseName,
  ValidationError,
} from './validator';
export {
  DatabaseConfig,
  RekeyConfig,
  ScaffoldResult,
  CipherType,
  SUPPORTED_CIPHERS,
} from './types';
