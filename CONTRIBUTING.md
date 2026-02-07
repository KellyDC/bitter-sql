# Contributing to bitter-sql

Thank you for your interest in contributing to bitter-sql! This document provides guidelines and instructions for contributing.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/kellydc/bitter-sql.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Setup development environment: `make setup`

## Development Guidelines

### Code Style

- Follow the existing code style
- Use TypeScript for all source code
- Run `npm run lint` to check for linting errors
- Run `npm run format` to format code automatically

### Testing

- Write tests for all new features
- Maintain test coverage above 80%
- Run `npm test` before submitting PR
- Add E2E tests for CLI features

### Commit Messages

Follow conventional commits format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or modifications
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Example: `feat: add support for new encryption cipher`

### Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass: `make check`
4. Update CHANGELOG.md with your changes
5. Submit PR with clear description

### Review Process

- All PRs require at least one review
- CI must pass before merging
- Address reviewer feedback promptly
- Squash commits before merging

## Project Structure

```
src/
├── lib/          # Core library code
├── cli.ts        # CLI implementation
└── index.ts      # Main exports

tests/
├── lib/          # Unit tests
└── e2e/          # End-to-end tests
```

## Areas for Contribution

- Bug fixes
- New encryption ciphers
- Documentation improvements
- Performance optimizations
- Additional database operations
- Platform compatibility
- Test coverage improvements

## Release Process

For maintainers publishing new versions:

1. See the comprehensive [Deployment Guide](DEPLOYMENT.md) for detailed instructions
2. Ensure all tests pass and coverage is maintained
3. Update version following semantic versioning
4. Update CHANGELOG.md with release notes
5. Create a GitHub release - automated publishing will handle the rest

Automated workflows handle:

- Dependency updates (via Dependabot)
- Security audits (daily)
- npm publishing (on release)
- License compliance checks

## Questions?

Feel free to open an issue for questions or discussions.

Thank you for contributing! 🎉
