/**
 * Example: Creating an encrypted database
 */

import { createScaffoldDatabase } from 'bitter-sql';

async function main(): Promise<void> {
  console.log('Creating an encrypted database...\n');

  const result = await createScaffoldDatabase({
    databaseName: 'secure.db',
    password: 'my-super-secret-password',
    cipher: 'sqlcipher',
    verbose: true,
  });

  if (result.success) {
    console.log('\n✅ Success!');
    console.log(`Database created at: ${result.databasePath}`);
    console.log(`Encrypted: ${result.encrypted}`);
    console.log('\n⚠️  Remember to keep your password safe!');
  } else {
    console.error('\n❌ Failed to create database');
    console.error(`Error: ${result.error}`);
  }
}

main().catch(console.error);
