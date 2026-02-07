import { DatabaseConfig, RekeyConfig, SUPPORTED_CIPHERS } from './types';
import path from 'path';
import fs from 'fs';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate database configuration
 * @param config - Database configuration to validate
 * @throws {ValidationError} If configuration is invalid
 */
export function validateDatabaseConfig(config: DatabaseConfig): void {
  // Validate database name
  if (!config.databaseName || typeof config.databaseName !== 'string') {
    throw new ValidationError('Database name is required and must be a non-empty string');
  }

  if (config.databaseName.trim().length === 0) {
    throw new ValidationError('Database name cannot be empty or whitespace');
  }

  // Validate database name doesn't contain illegal characters
  // eslint-disable-next-line no-control-regex
  const illegalChars = /[<>:"|?*\x00-\x1F]/;
  if (illegalChars.test(config.databaseName)) {
    throw new ValidationError('Database name contains illegal characters');
  }

  // Ensure database name has .db extension
  if (!config.databaseName.endsWith('.db') && !config.databaseName.endsWith('.sqlite')) {
    config.databaseName += '.db';
  }

  // Validate cipher if provided
  if (config.cipher && !SUPPORTED_CIPHERS.includes(config.cipher)) {
    throw new ValidationError(
      `Invalid cipher '${config.cipher}'. Supported ciphers: ${SUPPORTED_CIPHERS.join(', ')}`
    );
  }

  // Validate password requirements
  if (config.password !== undefined && config.password !== null) {
    if (typeof config.password !== 'string') {
      throw new ValidationError('Password must be a string');
    }

    if (config.password.length > 0 && config.password.length < 4) {
      throw new ValidationError('Password must be at least 4 characters long');
    }
  }

  // Validate schema path if provided
  if (config.schemaPath) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(config.schemaPath)) {
      throw new ValidationError(`Schema file not found: ${config.schemaPath}`);
    }

    const ext = path.extname(config.schemaPath).toLowerCase();
    if (ext !== '.sql') {
      throw new ValidationError('Schema file must have .sql extension');
    }

    // Check if file is readable
    try {
      fs.accessSync(config.schemaPath, fs.constants.R_OK);
    } catch {
      throw new ValidationError(`Schema file is not readable: ${config.schemaPath}`);
    }
  }
}

/**
 * Validate rekey configuration
 * @param config - Rekey configuration to validate
 * @throws {ValidationError} If configuration is invalid
 */
export function validateRekeyConfig(config: RekeyConfig): void {
  if (!config.databaseName || typeof config.databaseName !== 'string') {
    throw new ValidationError('Database name is required and must be a non-empty string');
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(config.databaseName)) {
    throw new ValidationError(`Database file not found: ${config.databaseName}`);
  }

  if (!config.currentPassword || typeof config.currentPassword !== 'string') {
    throw new ValidationError('Current password is required for rekeying');
  }

  if (!config.newPassword || typeof config.newPassword !== 'string') {
    throw new ValidationError('New password is required for rekeying');
  }

  if (config.newPassword.length < 4) {
    throw new ValidationError('New password must be at least 4 characters long');
  }

  if (config.newCipher && !SUPPORTED_CIPHERS.includes(config.newCipher)) {
    throw new ValidationError(
      `Invalid cipher '${config.newCipher}'. Supported ciphers: ${SUPPORTED_CIPHERS.join(', ')}`
    );
  }
}

/**
 * Sanitize database name for safe file system usage
 * @param name - Database name to sanitize
 * @returns Sanitized database name
 */
export function sanitizeDatabaseName(name: string): string {
  // Parse the path components
  const parsed = path.parse(name);

  // Normalize the path to resolve .. and . segments
  const normalized = path.normalize(name);

  // Check for path traversal attempts (relative paths going outside cwd)
  if (!path.isAbsolute(name) && normalized.startsWith('..')) {
    // Only allow the filename for traversal attempts
    const basename = path.basename(name);
    // eslint-disable-next-line no-control-regex
    return basename.replace(/[<>:"|?*\x00-\x1F]/g, '_');
  }

  // Sanitize the filename part (remove unsafe characters)
  // eslint-disable-next-line no-control-regex
  const sanitizedBase = parsed.base.replace(/[<>:"|?*\x00-\x1F]/g, '_');

  // Reconstruct with original directory structure
  if (parsed.dir) {
    return path.join(parsed.dir, sanitizedBase);
  }

  return sanitizedBase;
}
