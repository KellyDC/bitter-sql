# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
