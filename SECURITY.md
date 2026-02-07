# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in bitter-sql, please report it by emailing security@example.com or opening a private security advisory on GitHub.

**Please do not publicly disclose the vulnerability until it has been addressed.**

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- Initial response: Within 48 hours
- Status update: Within 7 days
- Fix timeline: Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

## Security Best Practices

When using bitter-sql:

1. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, and symbols
2. **Choose Secure Ciphers**: SQLCipher or AES256CBC recommended for production
3. **Protect Credentials**: Never commit passwords to version control
4. **File Permissions**: Set restrictive permissions on database files (600 or 400)
5. **Regular Updates**: Keep bitter-sql and dependencies up to date
6. **Password Rotation**: Regularly rotate database passwords using the rekey feature
7. **Environment Variables**: Use secure vaults or environment variables for sensitive data

## Known Security Considerations

1. **RC4 Cipher**: Not recommended for new applications due to known weaknesses
2. **Password Length**: Minimum enforced is 4 characters, but 12+ is strongly recommended
3. **Logging**: Passwords are never logged, even in verbose mode
4. **Memory**: Passwords are stored in memory during operations - ensure proper process isolation

## Security Updates

Security updates will be released as soon as possible and announced via:

- GitHub Security Advisories
- npm package updates
- Project CHANGELOG.md

## Credits

We appreciate responsible disclosure of security vulnerabilities. Contributors who report valid security issues will be credited in our CHANGELOG (unless they prefer to remain anonymous).
