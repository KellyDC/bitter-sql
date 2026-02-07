/**
 * Example: Basic usage of bitter-sql library
 */

import { createScaffoldDatabase } from 'bitter-sql';

async function main(): Promise<void> {
  console.log('Creating a simple database...\n');

  const result = await createScaffoldDatabase({
    databaseName: 'example.db',
    verbose: true,
  });

  if (result.success) {
    console.log('\n✅ Success!');
    console.log(`Database created at: ${result.databasePath}`);
    console.log(`Encrypted: ${result.encrypted}`);
  } else {
    console.error('\n❌ Failed to create database');
    console.error(`Error: ${result.error}`);
  }
}

main().catch(console.error);
