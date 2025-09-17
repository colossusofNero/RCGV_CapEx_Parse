# TipTap CI/CD Pipeline Documentation

## Overview

This repository includes comprehensive CI/CD pipelines for the TipTap React Native application, focusing on automated testing, building, deployment, and security scanning.

## Workflows

### 1. Main CI/CD Pipeline (`.github/workflows/main.yml`)

**Triggers:**
- Pull requests to `main`/`master`
- Pushes to `main`/`master`
- Manual workflow dispatch with production deployment option

**Jobs:**

#### Test Job
- Runs on every PR
- Installs dependencies
- Runs ESLint
- Executes Jest tests with coverage
- Uploads coverage to Codecov

#### Build Android Job
- Runs on pushes to main branch
- Builds release APK and AAB
- Signs with release keystore
- Uploads artifacts for deployment

#### Build iOS Job
- Runs on macOS runner
- Installs CocoaPods dependencies
- Sets up certificates and provisioning profiles
- Builds and archives iOS app
- Exports IPA for distribution

#### Deploy to Beta
- **Android**: Deploys AAB to Google Play Console beta track
- **iOS**: Uploads IPA to TestFlight

#### Production Deployment
- Requires manual approval (environment protection)
- Deploys to production stores
- Triggered by workflow dispatch or commit message `[deploy-prod]`

### 2. Security Scanning Pipeline (`.github/workflows/security-scan.yml`)

**Triggers:**
- Pushes to `main`/`master`/`develop`
- Pull requests
- Weekly schedule (Monday 2 AM UTC)
- Manual workflow dispatch

**Security Jobs:**

#### CodeQL SAST Analysis
- Static application security testing
- Scans JavaScript and TypeScript code
- Uploads results to GitHub Security tab

#### Dependency Vulnerability Scan
- `npm audit` for known vulnerabilities
- Snyk security scanning
- SARIF report upload to GitHub

#### Container Security Scan
- Builds security-focused Docker image
- Trivy vulnerability scanning
- Security report generation

#### API Security Testing
- OWASP ZAP baseline scanning
- API endpoint security testing
- Vulnerability report generation

#### Mobile Security Scan
- Semgrep mobile security rules
- React Native specific security checks
- Permission analysis for Android/iOS

#### PCI Compliance Validation
- Checks for PCI DSS compliance patterns
- Validates encryption implementation
- Scans for sensitive data logging
- Verifies HTTPS enforcement

#### Secret Detection
- GitLeaks for secret scanning
- TruffleHog for credential detection
- Historical commit analysis

#### License Compliance
- Validates open source licenses
- Generates license reports
- Ensures compliance with allowed licenses

## Required Secrets

### General
- `CODECOV_TOKEN`: Coverage reporting
- `SLACK_WEBHOOK_URL`: Deployment notifications
- `EMAIL_USERNAME`: Email notifications
- `EMAIL_PASSWORD`: Email notifications
- `NOTIFICATION_EMAIL`: General notifications
- `SECURITY_EMAIL`: Security alert notifications

### Android Deployment
- `ANDROID_KEYSTORE_BASE64`: Base64 encoded release keystore
- `ANDROID_KEY_ALIAS`: Keystore key alias
- `ANDROID_STORE_PASSWORD`: Keystore password
- `ANDROID_KEY_PASSWORD`: Key password
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: Play Console API credentials

### iOS Deployment
- `IOS_CERTIFICATE_BASE64`: Base64 encoded distribution certificate
- `IOS_PROVISIONING_PROFILE_BASE64`: Base64 encoded provisioning profile
- `IOS_CERTIFICATE_PASSWORD`: Certificate password
- `KEYCHAIN_PASSWORD`: Build keychain password
- `APP_STORE_CONNECT_API_KEY_BASE64`: App Store Connect API key
- `APP_STORE_CONNECT_API_KEY_ID`: API key ID
- `APP_STORE_CONNECT_ISSUER_ID`: API issuer ID

### Security Scanning
- `SNYK_TOKEN`: Snyk vulnerability scanning
- `GITLEAKS_LICENSE`: GitLeaks license (if applicable)

## Configuration Files

### `.github/codeql-config.yml`
CodeQL configuration for SAST scanning:
- Defines query packs for security analysis
- Specifies paths to scan and ignore
- Configures security-focused rule sets

### `.github/dependabot.yml`
Automated dependency updates:
- Weekly npm dependency updates
- GitHub Actions version updates
- Security-focused PR reviews

### `.zap/rules.tsv`
OWASP ZAP scanning rules:
- Defines which security rules to apply
- Customized for React Native applications
- Focuses on relevant vulnerabilities

### `ios/ExportOptions.plist`
iOS export configuration:
- App Store distribution settings
- Code signing configuration
- Upload and thinning options

## Environment Setup

### iOS Configuration Required:
1. Update `ios/ExportOptions.plist` with your Team ID
2. Configure provisioning profiles in Apple Developer account
3. Set up App Store Connect API keys

### Android Configuration Required:
1. Generate release keystore: `keytool -genkey -v -keystore release.keystore -alias your-alias -keyalg RSA -keysize 2048 -validity 10000`
2. Set up Google Play Console service account
3. Configure app signing in Play Console

### Security Tools Setup:
1. Create Snyk account for vulnerability scanning
2. Configure Codecov for coverage reporting
3. Set up notification channels (Slack, email)

## Security Features

### PCI DSS Compliance
- Automated compliance validation
- Secure coding pattern verification
- Encryption usage validation
- Sensitive data protection checks

### Vulnerability Management
- Multi-tool security scanning
- Automated dependency updates
- Secret detection and prevention
- License compliance monitoring

### Mobile Security
- Platform-specific security checks
- Permission analysis
- Certificate pinning validation
- Biometric authentication verification

## Deployment Workflow

1. **Development**: Push to feature branches
2. **Testing**: Create PR → automatic testing and security scans
3. **Beta**: Merge to main → automatic beta deployment
4. **Production**: Manual approval → production deployment

## Monitoring and Alerts

- Codecov for test coverage monitoring
- Slack notifications for deployment status
- Email alerts for security issues
- GitHub Security tab for vulnerability tracking

## Troubleshooting

### Common Issues:
1. **iOS build failures**: Check certificates and provisioning profiles
2. **Android signing errors**: Verify keystore configuration
3. **Security scan failures**: Review and address flagged vulnerabilities
4. **Dependency conflicts**: Use Dependabot PRs for updates

### Support:
- Check GitHub Actions logs for detailed error messages
- Review security scan results in GitHub Security tab
- Contact security team for compliance issues

## Best Practices

1. **Never commit secrets** to the repository
2. **Review Dependabot PRs** promptly for security updates
3. **Monitor security alerts** and address high-severity issues immediately
4. **Test deployments** in beta before production releases
5. **Keep certificates and keys** up to date