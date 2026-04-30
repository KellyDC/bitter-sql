# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-04-30

### Version Bumping

- build(deps): bump patch due to outdated dependencies and security audit issues
- chore: update changelog and version for 1.0.5 release

## [1.0.4] - 2026-03-21

### Version Bumping

- chore: bump version and remove redundant steps that cause wf failures

## [1.0.3] - 2026-03-21

### Version Bumping

- ci: update version and fix logic in not skipping for approval to publish

## [1.0.2] - 2026-03-21

### Version Bumping

- chore: adjust version to 1.0.2 and additional workflow for approval to trigger publishing

## [1.0.1] - 2026-03-21

### Version Bumping

- fix: audit issues and update dependencies

## [1.0.0] - 2026-02-07

### Added

- Initial release of bitter-sql
- Database creation with optional encryption support
- Support for multiple encryption ciphers (SQLCipher, AES256CBC, AES128CBC, ChaCha20, RC4)
- Database rekeying functionality
- CLI tool with interactive mode
- Library API for programmatic usage
- Environment variable configuration support
- Verbose logging with file output
- Custom SQL schema support
- Comprehensive test suite (Jest + Playwright)
- CI/CD pipeline with GitHub Actions
- Security-focused validation and error handling
- Colorful CLI with progress indicators
- Complete documentation and examples

### Security

- Passwords are never logged or exposed in output
- Input validation for all user-provided data
- Secure file path handling to prevent directory traversal
- Support for industry-standard encryption ciphers

[1.0.0]: https://github.com/kellydc/bitter-sql/releases/tag/v1.0.0
