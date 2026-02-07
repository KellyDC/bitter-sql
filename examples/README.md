# bitter-sql Examples

This directory contains example scripts demonstrating how to use bitter-sql.

## Examples

### 1. Basic Usage ([basic-usage.ts](./basic-usage.ts))
Creates a simple unencrypted database with the default schema.

```bash
npx ts-node examples/basic-usage.ts
```

### 2. Encrypted Database ([encrypted-database.ts](./encrypted-database.ts))
Creates an encrypted database using SQLCipher.

```bash
npx ts-node examples/encrypted-database.ts
```

### 3. Custom Schema ([custom-schema.ts](./custom-schema.ts))
Creates a database with a custom SQL schema file.

```bash
npx ts-node examples/custom-schema.ts
```

### 4. Rekey Database ([rekey-database.ts](./rekey-database.ts))
Demonstrates how to change the password of an encrypted database.

```bash
npx ts-node examples/rekey-database.ts
```

## Schema Files

- **[schema.sql](./schema.sql)**: Complex schema with users, posts, comments, and tags
- **[simple-schema.sql](./simple-schema.sql)**: Simple users table for quick testing

## Running Examples

Make sure you have the project built:

```bash
npm run build
```

Then run any example:

```bash
npx ts-node examples/basic-usage.ts
```

Or install ts-node globally:

```bash
npm install -g ts-node
ts-node examples/basic-usage.ts
```

## Cleanup

Remove example databases:

```bash
rm -f *.db
```
