/**
 * Configuration options for creating a SQLite database
 */
export interface DatabaseConfig {
  /** Name of the SQLite database file to create */
  databaseName: string;
  /** Optional password for database encryption */
  password?: string;
  /** Optional encryption cipher (e.g., 'sqlcipher', 'aes256cbc') */
  cipher?: CipherType;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Optional path to SQL schema file for initialization */
  schemaPath?: string;
}

/**
 * Configuration options for rekeying a database
 */
export interface RekeyConfig {
  /** Name of the database to rekey */
  databaseName: string;
  /** Current password */
  currentPassword: string;
  /** Current cipher (needed to open existing encrypted database) */
  currentCipher?: CipherType;
  /** New password */
  newPassword: string;
  /** Optional new cipher */
  newCipher?: CipherType;
  /** Enable verbose logging */
  verbose?: boolean | false;
}

/**
 * Result of database scaffold operation
 */
export interface ScaffoldResult {
  /** Success status */
  success: boolean;
  /** Path to created database */
  databasePath?: string;
  /** Error message if failed */
  error?: string;
  /** Whether database is encrypted */
  encrypted: boolean;
}

/**
 * Available cipher types
 */
export type CipherType = 'sqlcipher' | 'aes256cbc' | 'aes128cbc' | 'chacha20' | 'rc4';

/**
 * Supported cipher configurations
 */
export const SUPPORTED_CIPHERS: CipherType[] = [
  'sqlcipher',
  'aes256cbc',
  'aes128cbc',
  'chacha20',
  'rc4',
];
