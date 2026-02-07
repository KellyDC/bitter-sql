/**
 * Example: Creating a database with a custom schema
 */

import { createScaffoldDatabase } from 'bitter-sql';
import path from 'path';

async function main(): Promise<void> {
  console.log('Creating a database with custom schema...\n');

  const schemaPath = path.join(__dirname, 'schema.sql');

  const result = await createScaffoldDatabase({
    databaseName: 'blog.db',
    password: 'blog-password',
    cipher: 'sqlcipher',
    schemaPath,
    verbose: false,
  });

  if (result.success) {
    console.log('\n✅ Success!');
    console.log(`Database created at: ${result.databasePath}`);
    console.log('Schema loaded with sample data');
  } else {
    console.error('\n❌ Failed to create database');
    console.error(`Error: ${result.error}`);
  }
}

main().catch(console.error);
