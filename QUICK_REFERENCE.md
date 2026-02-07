# Quick Reference

Quick reference guide for common bitter-sql development and deployment tasks.

## Development

### Setup

```bash
# Clone and setup
git clone https://github.com/kellydc/bitter-sql.git
cd bitter-sql
make setup

# Install dependencies
make install
# or
npm install
```

### Building

```bash
# Build TypeScript
make build
# or
npm run build

# Clean build artifacts
make clean
```

### Testing

```bash
# Run all tests
make test
# or
npm test

# Run tests in watch mode
make test-watch

# Run E2E tests
make test-e2e
```

### Code Quality

```bash
# Lint code
make lint

# Auto-fix linting issues
make lint-fix

# Format code
make format

# Check formatting
make format-check

# Run all checks
make check
```

### Development

```bash
# Run CLI in dev mode
make dev
# or
npm run dev
```

## Deployment

### Version Bumping

```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major

# Pre-release
npm version prerelease --preid=beta
```

### Publishing

```bash
# Quick publish (runs all checks)
make publish

# Manual steps
npm run clean
npm run build
npm test
npm publish

# Publish with tag
npm publish --tag beta
```

### Automated Release (Recommended)

```bash
# 1. Update version
npm version patch -m "chore: bump version to %s"

# 2. Update CHANGELOG.md

# 3. Create and push tag
git push origin main
git push origin v1.0.1

# 4. Create GitHub release (triggers auto-publish)
# Go to GitHub → Releases → Create new release
# Or use GitHub CLI:
gh release create v1.0.1 --generate-notes
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push changes
git push origin feature/my-feature

# Create pull request
gh pr create --fill
```

## Package Commands

```bash
# View package
npm view bitter-sql

# Check package size
npm pack --dry-run

# Test local installation
npm pack
npm install ./bitter-sql-1.0.0.tgz

# Login to npm
npm login

# Check login status
npm whoami
```

## Dependency Management

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Audit for vulnerabilities
npm audit

# Fix auto-fixable vulnerabilities
npm audit fix

# Check licenses
npx license-checker --summary
```

## Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Required for publishing
export NPM_TOKEN=your-token-here
```

## Useful Make Targets

```bash
make help          # Show all available targets
make install       # Install dependencies
make build         # Build project
make clean         # Clean artifacts
make test          # Run tests
make lint          # Lint code
make format        # Format code
make check         # Run all quality checks
make publish       # Publish to npm
make dev           # Run in dev mode
```

## GitHub Actions

### Workflows

- **CI** (`ci.yml`): Runs on push/PR - linting, tests, E2E
- **Publish** (`publish.yml`): Runs on release - publishes to npm
- **Dependency Check** (`dependency-check.yml`): Daily security/license audits

### Manual Triggers

```bash
# Trigger CI workflow
gh workflow run ci.yml

# Trigger publish workflow (dry-run)
gh workflow run publish.yml -f dry-run=true

# Trigger dependency check
gh workflow run dependency-check.yml
```

## Troubleshooting

### Build Errors

```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Rebuild native modules
npm rebuild better-sqlite3-multiple-ciphers
```

### Test Failures

```bash
# Run single test file
npm test -- tests/lib/database.test.ts

# Run with verbose output
npm test -- --verbose

# Update snapshots
npm test -- -u
```

### Publishing Issues

```bash
# Check npm login
npm whoami

# Re-login
npm logout
npm login

# Check package contents
npm pack --dry-run

# Verify version isn't already published
npm view bitter-sql versions
```

## Documentation

- 📚 [README](README.md) - Main documentation
- 🚀 [Deployment Guide](DEPLOYMENT.md) - Publishing to npm
- 🤝 [Contributing](CONTRIBUTING.md) - Contribution guidelines
- 🔒 [Security](SECURITY.md) - Security policy
- 📝 [Changelog](CHANGELOG.md) - Version history

## Support

- 🐛 [Report Bug](https://github.com/kellydc/bitter-sql/issues/new?labels=bug)
- 💡 [Request Feature](https://github.com/kellydc/bitter-sql/issues/new?labels=enhancement)
- 💬 [Discussions](https://github.com/kellydc/bitter-sql/discussions)

---

**Quick Links:**

- [npm Package](https://www.npmjs.com/package/bitter-sql)
- [GitHub Repository](https://github.com/kellydc/bitter-sql)
- [GitHub Actions](https://github.com/kellydc/bitter-sql/actions)
