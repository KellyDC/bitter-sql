/**
 * Example: Rekeying a database with a new password
 */

import { createScaffoldDatabase, rekeyDatabase } from 'bitter-sql';

async function main(): Promise<void> {
  console.log('Example: Database rekeying\n');

  // First, create an encrypted database
  console.log('Step 1: Creating encrypted database...');
  const createResult = await createScaffoldDatabase({
    databaseName: 'rekey-example.db',
    password: 'old-password',
    cipher: 'sqlcipher',
  });

  if (!createResult.success) {
    console.error('Failed to create database:', createResult.error);
    return;
  }

  console.log('✅ Database created\n');

  // Now rekey it with a new password
  console.log('Step 2: Rekeying database with new password...');
  const rekeyResult = await rekeyDatabase({
    databaseName: createResult.databasePath!,
    currentPassword: 'old-password',
    newPassword: 'new-secure-password',
    verbose: true,
  });

  if (rekeyResult.success) {
    console.log('\n✅ Success!');
    console.log('Database has been rekeyed with new password');
    console.log('Old password will no longer work');
  } else {
    console.error('\n❌ Failed to rekey database');
    console.error(`Error: ${rekeyResult.error}`);
  }
}

main().catch(console.error);
