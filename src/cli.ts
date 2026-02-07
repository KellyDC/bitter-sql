#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import Database from 'better-sqlite3-multiple-ciphers';
import { createScaffoldDatabase, rekeyDatabase } from './lib/database';
import { createLogger } from './lib/logger';
import { SUPPORTED_CIPHERS, CipherType } from './lib/types';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import packageJson from '../package.json';

// Suppress dotenv promotional messages
process.env.DOTENV_CONFIG_QUIET = 'true';

// Load environment variables
dotenv.config({ debug: false });

/**
 * Get SQLite and better-sqlite3 version information
 */
function getVersionInfo(): { sqliteVersion: string; betterSqliteVersion: string } {
  try {
    // Get better-sqlite3-multiple-ciphers version
    let betterSqliteVersion = 'unknown';

    try {
      // Resolve the actual installed location of the package
      const resolvedPath = require.resolve('better-sqlite3-multiple-ciphers');
      const packageJsonPath = path.join(path.dirname(resolvedPath), '../package.json');

      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        betterSqliteVersion = pkg.version || 'unknown';
      }
    } catch (resolveError) {
      // Package not found or version unreadable
      betterSqliteVersion = 'unknown';
      console.error('Error resolving better-sqlite3-multiple-ciphers version:', resolveError);
    }

    // Get SQLite version by creating a temporary in-memory database
    const tempDb = new Database(':memory:');
    const result = tempDb.prepare('SELECT sqlite_version() as version').get() as {
      version: string;
    };
    const sqliteVersion = result.version;
    tempDb.close();

    return { sqliteVersion, betterSqliteVersion };
  } catch (error) {
    console.error('Error retrieving version info:', error);
    return { sqliteVersion: 'unknown', betterSqliteVersion: 'unknown' };
  }
}

/**
 * Display banner with version information
 */
function displayBanner(): void {
  const { sqliteVersion, betterSqliteVersion } = getVersionInfo();

  console.log();
  console.log(chalk.hex('#00ff7f')('  bitter-sql ') + chalk.dim(`v${packageJson.version}`));
  console.log(chalk.dim.gray(`  ${' '.repeat(30)}SQLite ${sqliteVersion}`));
  console.log(chalk.dim.gray(`  ${' '.repeat(30)}better-sqlite3 ${betterSqliteVersion}`));
  console.log();
}

/**
 * Prompt user for input
 */
async function promptInput(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const prompt = defaultValue
      ? chalk.green('? ') +
        chalk.reset(question) +
        chalk.dim(` › `) +
        chalk.cyan(defaultValue) +
        chalk.dim(' ')
      : chalk.green('? ') + chalk.reset(question) + chalk.dim(' › ');

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/**
 * Prompt for password (hidden input)
 */
async function promptPassword(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    // Disable echo for password input
    const stdin = process.stdin;
    if (stdin.isTTY && 'setRawMode' in stdin) {
      (stdin as import('tty').ReadStream).setRawMode(true);
    }

    let password = '';
    process.stdout.write(chalk.green('? ') + chalk.reset(question) + chalk.dim(' › '));

    process.stdin.on('data', (char) => {
      const c = char.toString();

      switch (c) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl-D
          if (stdin.isTTY && 'setRawMode' in stdin) {
            (stdin as import('tty').ReadStream).setRawMode(false);
          }
          rl.close();
          console.log(); // New line after password
          resolve(password);
          break;
        case '\u0003': // Ctrl-C
          if (stdin.isTTY && 'setRawMode' in stdin) {
            (stdin as import('tty').ReadStream).setRawMode(false);
          }
          process.exit();
          break;
        case '\u007f': // Backspace
          password = password.slice(0, -1);
          break;
        default:
          password += c;
      }
    });
  });
}

/**
 * Interactive mode for creating database
 */
async function interactiveCreate(): Promise<void> {
  displayBanner();

  const databaseName = await promptInput('Database name', process.env.db_name || 'bitter_sql.db');

  const useEncryption = (await promptInput('Enable encryption?', 'yes'))
    .toLowerCase()
    .startsWith('y');

  let password: string | undefined;
  let cipher: CipherType | undefined;

  if (useEncryption) {
    password = await promptPassword('Password');
    console.log();
    console.log(chalk.dim(`  ciphers: ${SUPPORTED_CIPHERS.join(', ')}`));
    console.log(chalk.dim(`  recommended: sqlcipher (industry standard, best tool compatibility)`));
    const cipherInput = await promptInput('Cipher', process.env.cipher || 'sqlcipher');
    cipher = cipherInput as CipherType;
  }

  const useSchema = (await promptInput('Custom schema?', 'no')).toLowerCase().startsWith('y');
  let schemaPath: string | undefined;

  if (useSchema) {
    schemaPath = await promptInput('Schema path', process.env.schema_path);
  }

  const verbose = (await promptInput('Verbose?', 'no')).toLowerCase().startsWith('y');

  // Create logger
  createLogger(verbose);
  console.log();

  // Create database
  const spinner = ora({
    text: chalk.cyan('Creating database...'),
    color: 'cyan',
    spinner: 'dots',
  }).start();

  const result = await createScaffoldDatabase({
    databaseName,
    password,
    cipher,
    verbose,
    schemaPath,
  });

  spinner.stop();

  if (result.success) {
    console.log();
    console.log(chalk.green('  ✓ ') + 'Database created');
    console.log();
    console.log(chalk.dim('  path:       ') + chalk.cyan(result.databasePath));
    console.log(
      chalk.dim('  encrypted:  ') + (result.encrypted ? chalk.green('yes') : chalk.dim('no'))
    );
    console.log();
  } else {
    console.log();
    console.log(chalk.red('  ✖ ') + 'Failed to create database');
    console.log(chalk.dim('  ') + chalk.red(result.error));
    console.log();
    process.exit(1);
  }
}

/**
 * Interactive mode for rekeying database
 */
async function interactiveRekey(): Promise<void> {
  displayBanner();

  const databaseName = await promptInput('Database');
  const currentPassword = await promptPassword('Current password');

  console.log();
  console.log(chalk.dim(`  ciphers: ${SUPPORTED_CIPHERS.join(', ')}`));
  console.log(chalk.dim(`  recommended: sqlcipher (industry standard, best tool compatibility)`));
  const currentCipherInput = await promptInput(
    'Current cipher (press Enter if unknown)',
    'sqlcipher'
  );
  const currentCipher = currentCipherInput ? (currentCipherInput as CipherType) : undefined;

  const newPassword = await promptPassword('New password');

  const changeCipher = (await promptInput('Change cipher?', 'no')).toLowerCase().startsWith('y');
  let newCipher: CipherType | undefined;

  if (changeCipher) {
    console.log();
    console.log(chalk.dim(`  ciphers: ${SUPPORTED_CIPHERS.join(', ')}`));
    const cipherInput = await promptInput('New cipher');
    newCipher = cipherInput as CipherType;
  }

  const verbose = (await promptInput('Verbose?', 'no')).toLowerCase().startsWith('y');

  // Create logger
  createLogger(verbose);
  console.log();

  // Rekey database
  const spinner = ora({
    text: chalk.cyan('Rekeying database...'),
    color: 'cyan',
    spinner: 'dots',
  }).start();

  const result = await rekeyDatabase({
    databaseName,
    currentPassword,
    currentCipher,
    newPassword,
    newCipher,
    verbose,
  });

  spinner.stop();

  if (result.success) {
    console.log();
    console.log(chalk.green('  ✓ ') + 'Database rekeyed');
    console.log();
    console.log(chalk.dim('  path: ') + chalk.cyan(result.databasePath));
    console.log();
  } else {
    console.log();
    console.log(chalk.red('  ✖ ') + 'Failed to rekey database');
    console.log(chalk.dim('  ') + chalk.red(result.error));
    console.log();
    process.exit(1);
  }
}

/**
 * Main CLI application
 */
async function main(): Promise<void> {
  // Custom help handler - intercept before yargs
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    const { sqliteVersion, betterSqliteVersion } = getVersionInfo();

    console.log(
      chalk.cyan.bold('\n Usage: ') +
        chalk.green('bitter-sql ') +
        chalk.yellow('<command>') +
        chalk.dim(' [options]')
    );
    console.log(chalk.cyan.bold('\n📋 Commands:'));
    console.log(
      chalk.green('  bitter-sql ') +
        chalk.white('create  ') +
        chalk.dim('Create a new SQLite database (encrypted by default)')
    );
    console.log(
      chalk.green('  bitter-sql ') +
        chalk.white('rekey   ') +
        chalk.dim('Rekey an existing encrypted database')
    );
    console.log(chalk.cyan.bold('\n⚙️  Options:'));
    console.log(chalk.white('  -h, --help     ') + chalk.dim('Show this help message'));
    console.log(chalk.white('  -V, --version  ') + chalk.dim('Show version number'));
    console.log(chalk.cyan.bold('\n� Security Note:'));
    console.log(
      chalk.yellow('  For security, passwords must be provided via ') +
        chalk.cyan('.env file') +
        chalk.yellow(' or interactive mode.')
    );
    console.log(chalk.dim('  This prevents passwords from appearing in shell history.'));
    console.log(chalk.cyan.bold('\n💡 Examples:'));
    console.log(
      chalk.green('  bitter-sql ') +
        chalk.white('create                                 ') +
        chalk.dim('→ Interactive mode (secure, recommended)')
    );
    console.log(
      chalk.green('  bitter-sql ') +
        chalk.white('create ') +
        chalk.yellow('-n') +
        chalk.white(' mydb.db ') +
        chalk.yellow('-c') +
        chalk.white(' sqlcipher         ') +
        chalk.dim('→ Use .env for password')
    );
    console.log(
      chalk.green('  bitter-sql ') +
        chalk.white('create ') +
        chalk.yellow('-n') +
        chalk.white(' mydb.db ') +
        chalk.yellow('-s') +
        chalk.white(' schema.sql        ') +
        chalk.dim('→ Create with custom schema')
    );
    console.log(
      chalk.green('  bitter-sql ') +
        chalk.white('rekey                                  ') +
        chalk.dim('→ Interactive database rekeying')
    );
    console.log(chalk.cyan('\n📦 Compatibility:'));
    console.log(chalk.dim(`   SQLite: ${chalk.green(sqliteVersion)}`));
    console.log(
      chalk.dim(`   better-sqlite3-multiple-ciphers: ${chalk.green(betterSqliteVersion)}`)
    );
    console.log();
    console.log(
      chalk.dim('For more information, visit: ') +
        chalk.cyan.underline('https://github.com/kellydc/bitter-sql')
    );
    console.log();
    process.exit(0);
  }

  const { sqliteVersion, betterSqliteVersion } = getVersionInfo();
  const epilogueText =
    chalk.cyan('\n📦 Compatibility:\n') +
    chalk.white(`   SQLite: ${chalk.green(sqliteVersion)}\n`) +
    chalk.white(`   better-sqlite3-multiple-ciphers: ${chalk.green(betterSqliteVersion)}\n\n`) +
    chalk.white('For more information, visit: ') +
    chalk.cyan.underline('https://github.com/kellydc/bitter-sql');

  await yargs(hideBin(process.argv))
    .scriptName(chalk.hex('#00ff7f').bold('bitter-sql'))
    .usage(
      chalk.cyan.bold('\n Usage: ') +
        chalk.white('$0 ') +
        chalk.yellow('<command>') +
        chalk.dim(' [options]')
    )
    .updateStrings({
      'Commands:': chalk.cyan.bold('\n📋 Commands:'),
      'Options:': chalk.cyan.bold('\n⚙️  Options:'),
      'Examples:': chalk.cyan.bold('\n💡 Examples:'),
      boolean: '',
      string: '',
      number: '',
      array: '',
      count: '',
      required: chalk.red('(required)'),
      'default:': chalk.dim('default:'),
      'choices:': chalk.dim('choices:'),
    })
    .command(
      'create',
      chalk.white('Create a new SQLite database ') + chalk.dim('(encrypted by default)'),
      (yargs) => {
        return yargs
          .option('name', {
            alias: 'n',
            type: 'string',
            description: chalk.dim('Database name'),
            default: process.env.db_name,
          })
          .option('cipher', {
            alias: 'c',
            type: 'string',
            description:
              chalk.dim('Encryption cipher ') +
              chalk.magenta(`[${SUPPORTED_CIPHERS.join('|')}]`) +
              chalk.yellow(' (password via .env)'),
            choices: SUPPORTED_CIPHERS,
            default: process.env.cipher,
          })
          .option('schema', {
            alias: 's',
            type: 'string',
            description: chalk.dim('Path to SQL schema file'),
            default: process.env.schema_path,
          })
          .option('verbose', {
            alias: 'v',
            type: 'boolean',
            description: chalk.dim('Enable verbose logging'),
            default: process.env.verbose === 'true',
          })
          .option('interactive', {
            alias: 'i',
            type: 'boolean',
            description: chalk.dim('Interactive mode ') + chalk.green('(recommended)'),
            default: false,
          });
      },
      async (argv) => {
        // Default to interactive mode if no name provided
        if (argv.interactive || !argv.name) {
          await interactiveCreate();
          return;
        }

        displayBanner();
        createLogger(argv.verbose);

        const spinner = ora({
          text: chalk.cyan('Creating database...'),
          color: 'cyan',
          spinner: 'dots',
        }).start();

        // Get password from environment variable only
        const password = process.env.password;

        // Default cipher to 'sqlcipher' if password is provided but cipher is not
        const cipher = argv.cipher || (password ? 'sqlcipher' : undefined);

        const result = await createScaffoldDatabase({
          databaseName: argv.name,
          password: password,
          cipher: cipher as CipherType | undefined,
          verbose: argv.verbose,
          schemaPath: argv.schema,
        });

        spinner.stop();

        if (result.success) {
          console.log();
          console.log(chalk.green('  ✓ ') + 'Database created');
          console.log();
          console.log(chalk.dim('  path:       ') + chalk.cyan(result.databasePath));
          console.log(
            chalk.dim('  encrypted:  ') + (result.encrypted ? chalk.green('yes') : chalk.dim('no'))
          );
          console.log();
        } else {
          console.log();
          console.log(chalk.red('  ✖ ') + 'Failed to create database');
          console.log(chalk.dim('  ') + chalk.red(result.error));
          console.log();
          process.exit(1);
        }
      }
    )
    .command(
      'rekey',
      chalk.white('Rekey an existing encrypted database'),
      (yargs) => {
        return yargs
          .option('name', {
            alias: 'n',
            type: 'string',
            description: chalk.dim('Database name'),
            demandOption: false,
          })
          .option('current-cipher', {
            type: 'string',
            description:
              chalk.dim('Current cipher ') +
              chalk.magenta(`[${SUPPORTED_CIPHERS.join('|')}]`) +
              chalk.yellow(' (passwords via .env)'),
            choices: SUPPORTED_CIPHERS,
          })
          .option('new-cipher', {
            type: 'string',
            description:
              chalk.dim('New cipher ') +
              chalk.magenta(`[${SUPPORTED_CIPHERS.join('|')}]`) +
              chalk.yellow(' (passwords via .env)'),
            choices: SUPPORTED_CIPHERS,
          })
          .option('verbose', {
            alias: 'v',
            type: 'boolean',
            description: chalk.dim('Enable verbose logging'),
            default: process.env.verbose === 'true',
          })
          .option('interactive', {
            alias: 'i',
            type: 'boolean',
            description: chalk.dim('Interactive mode ') + chalk.green('(recommended)'),
            default: false,
          });
      },
      async (argv) => {
        // Get passwords from environment variables only
        const currentPassword = process.env.current_password;
        const newPassword = process.env.new_password;

        if (argv.interactive || !argv.name || !currentPassword || !newPassword) {
          await interactiveRekey();
          return;
        }

        displayBanner();
        createLogger(argv.verbose);

        const spinner = ora({
          text: chalk.cyan('Rekeying database...'),
          color: 'cyan',
          spinner: 'dots',
        }).start();

        // Default current cipher to 'sqlcipher' if not provided
        const currentCipher = argv.currentCipher || 'sqlcipher';

        const result = await rekeyDatabase({
          databaseName: argv.name,
          currentPassword: currentPassword,
          currentCipher: currentCipher as CipherType | undefined,
          newPassword: newPassword,
          newCipher: argv.newCipher as CipherType | undefined,
          verbose: argv.verbose,
        });

        spinner.stop();

        if (result.success) {
          console.log();
          console.log(chalk.green('  ✓ ') + 'Database rekeyed');
          console.log();
          console.log(chalk.dim('  path: ') + chalk.cyan(result.databasePath));
          console.log();
        } else {
          console.log();
          console.log(chalk.red('  ✖ ') + 'Failed to rekey database');
          console.log(chalk.dim('  ') + chalk.red(result.error));
          console.log();
          process.exit(1);
        }
      }
    )
    .example(chalk.cyan('$0 create'), chalk.dim('→ Interactive mode (secure, recommended)'))
    .example(
      chalk.cyan('$0 create -n mydb.db -c sqlcipher'),
      chalk.dim('→ Use password from .env file')
    )
    .example(
      chalk.cyan('$0 create -n mydb.db -s schema.sql'),
      chalk.dim('→ Create with custom schema')
    )
    .example(chalk.cyan('$0 rekey'), chalk.dim('→ Interactive database rekeying'))
    .epilogue(epilogueText)
    .demandCommand(
      1,
      chalk.red('❌ Please specify a command') + chalk.dim(' (try: create or rekey)')
    )
    .strict()
    .help()
    .version('1.0.0')
    .alias('version', 'V')
    .alias('help', 'h')
    .wrap(Math.min(100, process.stdout.columns || 100))
    .parse();
}

// Run CLI
main().catch((error) => {
  console.log();
  console.error(chalk.red('  ✖ ') + 'Unexpected error');
  console.error(chalk.dim('  ') + chalk.red(error.message));
  if (error.stack) {
    console.error(chalk.dim('  ' + error.stack.split('\n').slice(1).join('\n  ')));
  }
  console.log();
  process.exit(1);
});
