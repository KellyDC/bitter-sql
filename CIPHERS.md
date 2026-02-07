# Cipher Documentation

Comprehensive guide to encryption ciphers supported by bitter-sql.

## Table of Contents

- [Overview](#overview)
- [Supported Ciphers](#supported-ciphers)
- [Cipher Comparison](#cipher-comparison)
- [SQLCipher Versioning](#sqlcipher-versioning)
- [ChaCha20-Poly1305 Deep Dive](#chacha20-poly1305-deep-dive)
- [Legacy Database Support](#legacy-database-support)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

## Overview

bitter-sql supports 5 encryption ciphers through [better-sqlite3-multiple-ciphers](https://github.com/m4heshd/better-sqlite3-multiple-ciphers), which uses [SQLite3MultipleCiphers](https://github.com/utelle/SQLite3MultipleCiphers) under the hood.

### Default Behavior

- **Interactive mode**: Encryption enabled by default with **SQLCipher v4** (industry standard)
- **Library usage**: No encryption unless explicitly specified
- **Command-line**: No encryption unless `-p` (password) is provided

## Supported Ciphers

### ⭐ Recommended: SQLCipher v4 (Industry Standard)

```typescript
cipher: 'sqlcipher';
```

**Full name**: SQLCipher AES-256 CBC with SHA512 HMAC

**Security Features**:

- ✅ Industry-standard encryption (2008-present)
- ✅ AES-256 in CBC mode
- ✅ SHA512 HMAC authentication (v4)
- ✅ 256,000 KDF iterations (v4)
- ✅ Compatible with DB Browser for SQLite, SQLiteStudio, and most tools

**Technical Details**:

- Algorithm: AES-256 CBC
- Key derivation: PBKDF2 with 256,000 iterations
- HMAC: SHA512 (64 bytes)
- Page size: 4096 bytes
- Salt: Random 16 bytes (stored in database header)

**Use Cases**:

- ✅ New applications (best compatibility)
- ✅ Industry standard compliance
- ✅ Need to open databases in GUI tools (DB Browser, SQLiteStudio, etc.)
- ✅ Enterprise environments requiring AES
- ✅ Cross-platform database sharing
- ✅ Recommended for most users

### ✅ High Performance: ChaCha20-Poly1305

```typescript
cipher: 'chacha20';
```

**Full name**: ChaCha20-Poly1305 HMAC (also known as `sqleet`)

**Security Features**:

- ✅ Modern IETF standard (RFC 7905)
- ✅ Authenticated encryption with Poly1305 HMAC
- ✅ PBKDF2 key derivation (resists brute force)
- ✅ Cryptographic nonces (prevents pattern analysis)
- ✅ Best performance on most hardware
- ⚠️ Limited tool support (not compatible with DB Browser for SQLite)

**Technical Details**:

- Algorithm: ChaCha20 stream cipher
- Authentication: Poly1305 MAC
- Key derivation: PBKDF2
- Nonce: Per-database and per-page random bytes

**Use Cases**:

- ✅ Performance-critical applications
- ✅ Maximum security with modern cryptography
- ✅ Programmatic access only (no GUI tools needed)
- ⚠️ Not recommended if you need to open databases in DB Browser or similar tools

### ⚠️ Legacy: AES-256 CBC

```typescript
cipher: 'aes256cbc';
```

**Full name**: wxSQLite3 AES-256 CBC (No HMAC)

**Security Features**:

- ⚠️ No authentication/tamper detection
- ✅ AES-256 encryption
- ⚠️ Legacy wxSQLite3 format

**Technical Details**:

- Algorithm: AES-256 CBC
- Authentication: None (no HMAC)
- Reserved bytes: 16 per page

**Use Cases**:

- ⚠️ Legacy wxSQLite3 database compatibility only
- ❌ Not recommended for new applications

**Warning**: Lack of HMAC means no tamper detection. Malicious modifications won't be detected.

### ⚠️ Legacy: AES-128 CBC

```typescript
cipher: 'aes128cbc';
```

**Full name**: wxSQLite3 AES-128 CBC (No HMAC)

**Security Features**:

- ⚠️ No authentication/tamper detection
- ⚠️ Weaker 128-bit key (vs 256-bit)
- ⚠️ Legacy wxSQLite3 format

**Technical Details**:

- Algorithm: AES-128 CBC
- Authentication: None (no HMAC)
- Reserved bytes: 16 per page

**Use Cases**:

- ⚠️ Legacy wxSQLite3 database compatibility only
- ❌ Not recommended for new applications

### ❌ RC4 (Obsolete)

```typescript
cipher: 'rc4';
```

**Full name**: System.Data.SQLite RC4

**Security Features**:

- ❌ Obsolete cipher (known vulnerabilities)
- ❌ No authentication
- ❌ Weak by modern standards

**Technical Details**:

- Algorithm: RC4 stream cipher
- Authentication: None

**Use Cases**:

- ❌ Only for legacy System.Data.SQLite compatibility
- ❌ Never use for new applications

**Warning**: RC4 has known cryptographic weaknesses and should never be used for new development.

## Cipher Comparison

| Cipher        | Algorithm   | HMAC     | KDF Iterations | Performance    | Security                 | Tool Support | Recommended    |
| ------------- | ----------- | -------- | -------------- | -------------- | ------------------------ | ------------ | -------------- |
| **sqlcipher** | AES-256 CBC | SHA512   | 256,000        | ⚡⚡ Fast      | 🛡️🛡️🛡️ Excellent         | ✅ Excellent | ⭐ Yes         |
| **chacha20**  | ChaCha20    | Poly1305 | PBKDF2         | ⚡⚡⚡ Fastest | 🛡️🛡️🛡️ Excellent         | ⚠️ Limited   | ✅ Performance |
| **aes256cbc** | AES-256 CBC | None     | -              | ⚡⚡ Fast      | 🛡️⚠️ No Tamper Detection | ✅ Good      | ⚠️ Legacy Only |
| **aes128cbc** | AES-128 CBC | None     | -              | ⚡⚡⚡ Fast    | 🛡️⚠️ Weaker + No HMAC    | ✅ Good      | ⚠️ Legacy Only |
| **rc4**       | RC4         | None     | -              | ⚡⚡⚡ Fast    | ❌ Obsolete/Weak         | ✅ Limited   | ❌ Never       |

### Performance Notes

- **ChaCha20**: Best overall performance, especially on mobile/ARM
- **SQLCipher (AES)**: Good performance on Intel CPUs with AES-NI, excellent tool compatibility
- **RC4**: Fast but insecure - speed doesn't matter

### Security Notes

- **Authenticated encryption (HMAC)** prevents tampering
- **Key derivation (PBKDF2)** slows down brute-force attacks
- **Nonces/IVs** prevent pattern analysis

### Compatibility Notes

- **SQLCipher**: Works with DB Browser for SQLite, SQLiteStudio, and most SQLite GUI tools
- **ChaCha20**: Programmatic access only via better-sqlite3-multiple-ciphers
- **Important**: Choose SQLCipher if you need to inspect/modify databases with GUI tools

## SQLCipher Versioning

When you use `cipher='sqlcipher'`, you're using **SQLCipher v4 by default** (the latest and most secure version).

### Version History

| Version | Year | KDF Iterations | HMAC Algorithm | HMAC Size | Page Size | Status               |
| ------- | ---- | -------------- | -------------- | --------- | --------- | -------------------- |
| **v4**  | 2018 | 256,000        | SHA512         | 64 bytes  | 4096      | ✅ Current (Default) |
| **v3**  | 2013 | 64,000         | SHA1           | 20 bytes  | 1024      | ⚠️ Legacy            |
| **v2**  | 2011 | 4,000          | SHA1           | 20 bytes  | 1024      | ⚠️ Legacy            |
| **v1**  | 2008 | 4,000          | None           | 0 bytes   | 1024      | ❌ Obsolete          |

### Security Improvements in v4

**SQLCipher v4** (2018) introduced major security enhancements:

1. **4x More KDF Iterations**: 256,000 (vs 64,000 in v3)
   - Dramatically increases brute-force attack resistance
2. **Stronger HMAC**: SHA512 (vs SHA1 in v3)
   - SHA1 is considered weak for HMAC
   - SHA512 provides better security margin
3. **Larger HMAC Tag**: 64 bytes (vs 20 bytes)
   - Stronger authentication
   - Better tamper detection
4. **Modern Page Size**: 4096 bytes (vs 1024)
   - Better performance with modern storage
   - Aligns with OS page sizes

### Version Detection

When opening a SQLCipher database, the library automatically detects the version based on:

- Reserved bytes per page
- HMAC size
- KDF parameters

## ChaCha20-Poly1305 Deep Dive

### Why ChaCha20-Poly1305 for Performance

**ChaCha20-Poly1305** is excellent for performance-critical applications where GUI tool compatibility isn't needed:

#### 1. Modern Cryptographic Standard

- **IETF Standard**: RFC 7905, RFC 8439
- **Proven Security**: Designed by Daniel J. Bernstein
- **Wide Adoption**: Used in TLS 1.3, SSH, VPNs
- **Constant-time**: Resistant to timing attacks

#### 2. Superior Performance

```
Benchmark Results (approximate):
┌─────────────────┬──────────────┬─────────────┐
│ Cipher          │ Intel (AES-NI)│ ARM/Mobile  │
├─────────────────┼──────────────┼─────────────┤
│ ChaCha20        │ ~1.5 GB/s    │ ~1.2 GB/s   │
│ AES-256 (w/ NI) │ ~2.0 GB/s    │ ~0.3 GB/s   │
│ AES-256 (no NI) │ ~0.1 GB/s    │ ~0.1 GB/s   │
└─────────────────┴──────────────┴─────────────┘
```

**Key Insight**: ChaCha20 performs consistently across all platforms, while AES requires hardware acceleration for good performance.

#### 3. Authenticated Encryption

- **Poly1305 MAC**: Authenticates encrypted data
- **AEAD**: Authenticated Encryption with Associated Data
- **Tamper Detection**: Automatically detects modifications
- **Nonce Misuse Resistance**: Better than many AEAD schemes

#### 4. Compatibility Limitation

**Important**: ChaCha20-Poly1305 databases **cannot** be opened in:

- DB Browser for SQLite
- SQLiteStudio
- Most other SQLite GUI tools

Use ChaCha20 only when you need maximum performance and don't require GUI tool access.

### Technical Implementation

**Encryption Process**:

1. Password → PBKDF2 → 256-bit key
2. Per-page nonce generation
3. ChaCha20 encrypts page data
4. Poly1305 authenticates ciphertext
5. MAC appended to page

**Decryption Process**:

1. Read encrypted page + MAC
2. Verify MAC with Poly1305
3. If valid, decrypt with ChaCha20
4. Return plaintext

**Database Structure**:

```
┌─────────────────────────────────────────┐
│ Database Header (plaintext)             │
│ - Magic: "SQLite format 3"              │
│ - Cipher salt (16 bytes)                │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Page 1 (encrypted)                      │
│ - Nonce (12 bytes)                      │
│ - Encrypted data                        │
│ - Poly1305 MAC (16 bytes)               │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Page 2 (encrypted)                      │
│ ...                                     │
└─────────────────────────────────────────┘
```

## Legacy Database Support

### Opening SQLCipher v3 Databases

If you have an existing database created with SQLCipher v3:

```javascript
import Database from 'better-sqlite3-multiple-ciphers';

const db = new Database('legacy_database.db');

// Set password
db.pragma(`key='your-password'`);

// Set cipher type
db.pragma(`cipher='sqlcipher'`);

// Enable legacy mode for v3
db.pragma(`legacy=3`);

// Now you can use the database
const data = db.prepare('SELECT * FROM users').all();
```

### Opening SQLCipher v2 Databases

```javascript
db.pragma(`key='your-password'`);
db.pragma(`cipher='sqlcipher'`);
db.pragma(`legacy=2`);
```

### Migrating from v3 to v4

**Recommended approach**: Create new v4 database and migrate data

```javascript
// 1. Open old v3 database
const oldDb = new Database('old.db');
oldDb.pragma(`key='password'`);
oldDb.pragma(`cipher='sqlcipher'`);
oldDb.pragma(`legacy=3`);

// 2. Create new v4 database
const newDb = new Database('new.db');
newDb.pragma(`rekey='password'`);
newDb.pragma(`cipher='sqlcipher'`);
// v4 is default, no legacy pragma needed

// 3. Attach and migrate
oldDb.prepare(`ATTACH DATABASE 'new.db' AS new KEY 'password'`).run();
oldDb.exec(`
  BEGIN;
  SELECT sqlcipher_export('new');
  COMMIT;
`);

// 4. Verify and switch
oldDb.close();
newDb.close();

// Rename files
// mv new.db database.db
```

**Alternative**: In-place migration (risky, backup first!)

```javascript
const db = new Database('database.db');
db.pragma(`key='password'`);
db.pragma(`cipher='sqlcipher'`);
db.pragma(`legacy=3`); // Open as v3

// Migrate to v4
db.pragma(`cipher_migrate`); // Upgrades to v4 format

db.close();
```

### Compatibility with DB Browser for SQLite

**DB Browser for SQLite** supports SQLCipher v3 and v4:

```javascript
// For DB Browser compatibility, use:
const db = new Database('database.db');
db.pragma(`rekey='password'`);
db.pragma(`cipher='sqlcipher'`);
db.pragma(`legacy=4`); // Explicit v4 (optional, it's default)
```

**Note**: DB Browser expects specific pragmas. If you can't open your database in DB Browser:

1. Check you're using SQLCipher v4 (or set `legacy=4`)
2. Try older versions: `legacy=3` or `legacy=2`
3. Verify password is correct

## Best Practices

### 1. Choosing a Cipher

**For most users (recommended)**:

```typescript
✅ Use: cipher: 'sqlcipher'
Why: Industry standard, excellent tool compatibility, strong security
Best for: General use, needs DB Browser access, cross-platform
```

**For performance-critical applications**:

```typescript
✅ Use: cipher: 'chacha20'
Why: Best performance, modern cryptography
Best for: High-throughput applications, programmatic access only
Warning: Cannot open in DB Browser or most GUI tools
```

**For legacy compatibility**:

```typescript
⚠️ Only if required: cipher: 'aes256cbc' or 'aes128cbc'
Why: Existing database compatibility
Action: Plan migration to modern cipher (sqlcipher)
```

### 2. Password Requirements

**Strong passwords are critical**:

```javascript
// ❌ BAD
password: '123456';
password: 'password';

// ✅ GOOD
password: 'Tr0ub4dor&3';
password: 'correct horse battery staple';

// ⭐ BEST
password: crypto.randomBytes(32).toString('base64');
// Example: 'kX8vG2nP9wQ4mL7sT6hY1xC3bN5dF0uA8jK4pM9rE2w='
```

**Recommendations**:

- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- Or use passphrases (4+ random words)
- Or use cryptographically random keys

### 3. Key Management

**Never hardcode passwords**:

```typescript
// ❌ NEVER DO THIS
const password = 'my-secret-password';

// ✅ DO THIS
const password = process.env.DB_PASSWORD;

// ⭐ BEST
import { getSecret } from './key-management';
const password = await getSecret('database-encryption-key');
```

**Key management options**:

- Environment variables (development)
- Key management services (AWS KMS, Azure Key Vault)
- Hardware security modules (production)
- User-provided passwords (applications)

### 4. Backup Strategy

**Encrypted backups**:

```bash
# Create encrypted backup
sqlite3 database.db ".backup backup.db"

# Backup is encrypted with same cipher
```

**Important**: Backup files inherit the same encryption as the source database.

### 5. Performance Tuning

**For better performance**:

```javascript
// Enable WAL mode (Write-Ahead Logging)
db.pragma('journal_mode = WAL');

// Optimize page size
db.pragma('page_size = 4096'); // Match cipher page size

// Cache size (in pages)
db.pragma('cache_size = -64000'); // 64MB cache
```

## Migration Guide

### From Unencrypted to Encrypted

```javascript
import { createScaffoldDatabase } from 'bitter-sql';
import Database from 'better-sqlite3-multiple-ciphers';

// 1. Create encrypted database
await createScaffoldDatabase({
  databaseName: 'encrypted.db',
  password: 'your-strong-password',
  cipher: 'sqlcipher',
});

// 2. Attach unencrypted database
const db = new Database('encrypted.db');
db.pragma(`key='your-strong-password'`);
db.prepare(`ATTACH DATABASE 'unencrypted.db' AS old`).run();

// 3. Copy data
db.exec(`
  BEGIN;
  -- Copy each table
  INSERT INTO main.users SELECT * FROM old.users;
  INSERT INTO main.posts SELECT * FROM old.posts;
  -- ... etc
  COMMIT;
`);

// 4. Detach and cleanup
db.prepare(`DETACH DATABASE old`).run();
db.close();
```

### From ChaCha20 to SQLCipher

```javascript
import { rekeyDatabase } from 'bitter-sql';

// Convert from ChaCha20 to SQLCipher for tool compatibility
await rekeyDatabase({
  databaseName: 'database.db',
  currentPassword: 'current-password',
  newPassword: 'new-password',
  newCipher: 'sqlcipher',
  verbose: true,
});
```

### From SQLCipher v3 to v4

See "Migrating from v3 to v4" in the [Legacy Database Support](#legacy-database-support) section above.

## Advanced Topics

### Custom Cipher Configuration

For advanced users who need fine-grained control:

```javascript
const db = new Database('database.db');

// SQLCipher v4 custom settings
db.pragma(`key='password'`);
db.pragma(`cipher='sqlcipher'`);
db.pragma(`kdf_iter=500000`); // More iterations
db.pragma(`kdf_algorithm=2`); // 0=SHA1, 1=SHA256, 2=SHA512
db.pragma(`hmac_algorithm=2`); // 0=SHA1, 1=SHA256, 2=SHA512
db.pragma(`page_size=8192`); // Larger pages
```

**Warning**: Custom settings may cause compatibility issues. Stick to defaults unless you have specific requirements.

### Plaintext Header

SQLCipher v4 supports plaintext headers for iOS compatibility:

```javascript
db.pragma(`key='password'`);
db.pragma(`cipher='sqlcipher'`);
db.pragma(`plaintext_header_size=32`); // 32 bytes plaintext

// Must save and provide salt separately
const salt = db.pragma('cipher_salt', { simple: true });
// Store salt securely
```

**Warning**: Plaintext headers slightly reduce security. Only use if required for iOS file identification.

## Troubleshooting

### "file is not a database" Error

This usually means:

1. Wrong password
2. Wrong cipher
3. Wrong legacy version
4. Corrupted database

**Solution**:

```javascript
// Try different legacy versions
db.pragma(`legacy=4`);
db.pragma(`legacy=3`);
db.pragma(`legacy=2`);
```

### Performance Issues

**If encryption is slow**:

1. Enable WAL mode: `db.pragma('journal_mode = WAL')`
2. Increase cache: `db.pragma('cache_size = -64000')`
3. Use appropriate cipher (ChaCha20 for performance, SQLCipher for compatibility)
4. Check disk I/O (encryption itself is rarely the bottleneck)

### Cannot Open Database in DB Browser

**If you created a ChaCha20 database**:

- ChaCha20 is not supported by DB Browser for SQLite
- Solution: Use `rekeyDatabase()` to convert to SQLCipher

**If you created a SQLCipher database**:

1. Use "Open Database" → "SQLCipher 4 defaults"
2. Enter your password
3. If that doesn't work, try "SQLCipher 3 defaults"

### Database Size Larger Than Expected

Encrypted databases have overhead:

- SQLCipher v4: 80 bytes per page (2% overhead on 4KB pages)
- ChaCha20: 28 bytes per page (0.7% overhead on 4KB pages)

This is normal and necessary for security.

## References

- [SQLite3MultipleCiphers Documentation](https://utelle.github.io/SQLite3MultipleCiphers/)
- [SQLCipher Official](https://www.zetetic.net/sqlcipher/)
- [ChaCha20-Poly1305 RFC 8439](https://datatracker.ietf.org/doc/html/rfc8439)
- [PBKDF2 Standard](https://datatracker.ietf.org/doc/html/rfc2898)
- [better-sqlite3-multiple-ciphers](https://github.com/m4heshd/better-sqlite3-multiple-ciphers)
- [DB Browser for SQLite](https://sqlitebrowser.org/)

---

**Last Updated**: February 6, 2026  
**bitter-sql Version**: 1.0.0  
**Default Cipher**: SQLCipher v4 (for best tool compatibility)
