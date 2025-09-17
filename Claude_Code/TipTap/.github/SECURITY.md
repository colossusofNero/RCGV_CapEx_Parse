# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

1. **Do NOT** create a public GitHub issue
2. Email security@tiptap.com with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Your contact information

3. Allow us 48 hours to respond with acknowledgment
4. We will provide updates every 72 hours until resolution
5. We may offer a bug bounty for qualifying reports

## Security Measures

### Code Security
- Static Application Security Testing (SAST) with CodeQL
- Dependency vulnerability scanning with Snyk
- Secret detection with GitLeaks and TruffleHog
- Regular security audits

### Mobile Security
- Certificate pinning for API communications
- Biometric authentication for sensitive operations
- Encrypted local storage for sensitive data
- NFC security protocols

### Payment Security
- PCI DSS compliance validation
- End-to-end encryption for payment data
- Secure tokenization of card information
- Regular security assessments

### Infrastructure Security
- Automated security scanning in CI/CD
- Container security scanning with Trivy
- API security testing with OWASP ZAP
- Regular penetration testing

## Security Headers

Our application implements the following security headers:
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection

## Compliance

- PCI DSS Level 1 compliant
- SOC 2 Type II certified
- GDPR compliant for data protection
- Regular third-party security audits

## Contact

For security-related questions or concerns:
- Email: security@tiptap.com
- Security Team: security-team@tiptap.com