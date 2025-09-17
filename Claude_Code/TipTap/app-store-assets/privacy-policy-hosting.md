# TipTap Privacy Policy Hosting Setup

## Privacy Policy URL Requirements

### App Store Requirements
- **Publicly Accessible URL**: Must be accessible via standard web browser
- **HTTPS Required**: Must use secure HTTPS protocol
- **Always Available**: Must maintain 99.9% uptime
- **Direct Link**: Cannot require additional navigation or authentication

### Recommended Hosting Options

#### Option 1: GitHub Pages (Free & Simple)
```
Repository: tiptap-privacy-policy
URL: https://tiptap.github.io/privacy-policy/
File: index.html (contains full privacy policy)

Advantages:
- Free hosting
- Version control for policy changes
- Reliable uptime
- Easy updates via git commits
```

#### Option 2: Dedicated Domain (Professional)
```
Domain: privacy.tiptap.app
URL: https://privacy.tiptap.app/
File: Complete privacy policy page

Advantages:
- Professional branded URL
- Full control over content and styling
- Easy to remember and share
- SEO benefits
```

#### Option 3: Website Integration
```
Primary Website: tiptap.app
Privacy URL: https://tiptap.app/privacy
Location: /privacy page on main website

Advantages:
- Integrated with main website
- Consistent branding and design
- Single domain to maintain
```

## Required Privacy Policy Content

### Data Collection Section
```
**Information We Collect:**
- Transaction history (stored locally on your device only)
- App usage analytics (anonymized, no personal information)
- Device information (iOS version, device model for compatibility)

**Information We DO NOT Collect:**
- Personal identification information
- Financial account details or payment credentials
- Location data or GPS coordinates
- Contact lists or personal communications
- Browsing history or other app usage
```

### Data Usage Section
```
**How We Use Your Information:**
- Process tip transactions securely
- Maintain transaction history on your device
- Improve app performance and user experience
- Provide customer support when requested

**Data Sharing:**
- We do not sell, rent, or share personal information
- Payment processing handled by certified third-party processors (Stripe)
- Anonymized usage data may be shared with app analytics providers
- No personal data shared for advertising purposes
```

### Data Storage & Security
```
**Data Storage:**
- All personal transaction data stored locally on your device
- No personal information stored on our servers
- Encrypted data transmission for all payment processing
- Industry-standard security measures applied

**Data Retention:**
- Transaction history: Until you delete it or uninstall the app
- Analytics data: Anonymized and retained for 12 months maximum
- Support communications: Deleted after issue resolution
```

## Sample Privacy Policy URL Setup

### GitHub Pages Implementation
1. Create repository: `tiptap-privacy-policy`
2. Create `index.html` with complete privacy policy
3. Enable GitHub Pages in repository settings
4. URL becomes: `https://tiptap.github.io/tiptap-privacy-policy/`

### DNS Configuration (Custom Domain)
```
CNAME record: privacy.tiptap.app → hosting-provider.com
SSL Certificate: Auto-provision via Let's Encrypt
Redirect: Ensure www.privacy.tiptap.app redirects to privacy.tiptap.app
```

## Privacy Policy Update Process

### Version Control
- Maintain dated versions of privacy policy
- Document changes and effective dates
- Notify users of material changes via app update

### App Store Compliance
- Submit privacy policy URL during app submission
- Ensure URL remains active throughout app lifecycle
- Update App Store listing if URL changes

## App Store Privacy Information

### Privacy Labels Required
```
**Data Linked to You:**
- None (all transaction data stored locally)

**Data Not Linked to You:**
- Crash Data
- Performance Data
- Other Diagnostic Data

**Data Not Collected:**
- Health & Fitness
- Financial Info (processed but not stored)
- Location
- Contacts
- Search History
- Browsing History
- Usage Data (beyond anonymized analytics)
```

### Tracking Declaration
```
**Tracking:** No
**Reason:** App does not track users across other companies' apps or websites for advertising purposes

**Third-Party SDK Tracking:**
- Payment Processor: No tracking (transaction processing only)
- Analytics: No personal identifiers tracked
- Crash Reporting: Anonymous crash data only
```

## Implementation Checklist

### Pre-Submission
- [ ] Privacy policy written and reviewed by legal
- [ ] Hosting solution configured and tested
- [ ] URL accessible via HTTPS
- [ ] Content matches app's actual data practices
- [ ] Privacy labels completed in App Store Connect

### During Submission
- [ ] Privacy policy URL entered in App Store Connect
- [ ] Privacy labels accurately reflect data collection
- [ ] Age rating matches privacy practices
- [ ] Review notes mention privacy compliance

### Post-Submission
- [ ] Monitor privacy policy URL availability
- [ ] Set up monitoring for uptime
- [ ] Plan for policy updates if app features change
- [ ] Prepare user notification process for policy changes

## Recommended Privacy Policy URL

**Final Recommendation**: `https://tiptap.app/privacy`

**Rationale**:
- Professional and trustworthy appearance
- Easy to integrate with main website
- Consistent branding
- Simple to remember and communicate
- Full control over content and updates

## Legal Compliance Notes

### Required Disclosures
- Clear description of data collection practices
- Explanation of data usage and sharing
- User rights and choices regarding their data
- Contact information for privacy inquiries
- Effective date and change notification process

### Jurisdiction Considerations
- Comply with CCPA (California Consumer Privacy Act)
- Follow GDPR guidelines for European users
- Meet COPPA requirements (if app accessible to children)
- Include state-specific privacy law compliance as needed

The privacy policy URL is critical for App Store approval and ongoing compliance. Choose a reliable hosting solution and ensure the content accurately reflects the app's minimal data collection practices.