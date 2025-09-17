# TipTap iOS Build Configuration Guide

This guide outlines the complete iOS build configuration for the TipTap payment application.

## 📱 Required Capabilities

### 1. NFC Tag Reading
- **Capability**: Near Field Communication Tag Reading
- **Entitlement**: `com.apple.developer.nfc.readersession.formats`
- **Supported Formats**: NDEF, TAG
- **Usage**: Reading payment information from NFC-enabled cards and devices

### 2. Push Notifications
- **Capability**: Push Notifications
- **Entitlement**: `aps-environment` (development/production)
- **Usage**: Real-time payment notifications and transaction updates

### 3. Apple Pay
- **Capability**: In-App Payments
- **Entitlement**: `com.apple.developer.in-app-payments`
- **Merchant IDs**:
  - `merchant.com.tiptap.app` (production)
  - `merchant.com.tiptap.app.staging` (staging)

### 4. Associated Domains
- **Capability**: Associated Domains
- **Entitlement**: `com.apple.developer.associated-domains`
- **Domains**:
  - `applinks:tiptap.com`
  - `applinks:*.tiptap.com`
  - `webcredentials:tiptap.com`

### 5. App Groups
- **Capability**: App Groups
- **Entitlement**: `com.apple.security.application-groups`
- **Groups**:
  - `group.com.tiptap.app`
  - `group.com.tiptap.app.widgets`
  - `group.com.tiptap.app.notifications`

### 6. Background Modes
- **Capability**: Background Modes
- **Modes**:
  - Background App Refresh
  - Background Processing
  - Remote Notifications
  - Background Fetch

## 🔒 Privacy Permissions

### Camera Usage
```xml
<key>NSCameraUsageDescription</key>
<string>TipTap needs camera access to scan QR codes for quick and secure payments. Your camera is only used for scanning payment codes and is never used for recording.</string>
```

### NFC Usage
```xml
<key>NFCReaderUsageDescription</key>
<string>TipTap uses NFC to securely read payment information from NFC-enabled cards and devices for quick contactless payments.</string>
```

### Face ID Usage
```xml
<key>NSFaceIDUsageDescription</key>
<string>TipTap uses Face ID to securely authenticate payments and protect your financial information. Face ID data never leaves your device.</string>
```

### Location Usage
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>TipTap uses your location to find nearby merchants and enhance payment security by preventing fraudulent transactions from unusual locations.</string>
```

### Contacts Usage
```xml
<key>NSContactsUsageDescription</key>
<string>TipTap can access your contacts to help you quickly send tips to friends and family. Your contact information is never shared or stored on our servers.</string>
```

### Photo Library Usage
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>TipTap can save payment receipts and QR codes to your photo library for your records. We only save images you explicitly choose to save.</string>
```

## 🔗 URL Schemes and Deep Linking

### Custom URL Schemes
- `tiptap://` - Main app scheme
- `com.tiptap.app://` - Bundle identifier scheme
- `plaidlink-com.tiptap.app://` - Plaid Link integration

### Universal Links
- `https://tiptap.com/*`
- `https://app.tiptap.com/*`
- `https://api.tiptap.com/*`

## 🏗️ Xcode Project Setup Instructions

### 1. Enable Required Capabilities

1. Open `TipTap.xcworkspace` in Xcode
2. Select the TipTap target
3. Go to "Signing & Capabilities" tab
4. Add the following capabilities:
   - Near Field Communication Tag Reading
   - Push Notifications
   - In-App Purchase (for Apple Pay)
   - Associated Domains
   - App Groups
   - Background Modes

### 2. Configure Entitlements

Ensure the `TipTap.entitlements` file is properly linked:
1. In project navigator, verify `TipTap.entitlements` exists
2. In Build Settings, verify `CODE_SIGN_ENTITLEMENTS` points to `TipTap/TipTap.entitlements`

### 3. Configure Info.plist

Verify all privacy permissions are properly set:
1. Check all `NS*UsageDescription` keys are present
2. Verify URL schemes are configured
3. Ensure NFC formats are specified

### 4. Build Settings Configuration

Apply the following critical build settings:

```
IPHONEOS_DEPLOYMENT_TARGET = 13.0
SWIFT_VERSION = 5.0
ENABLE_BITCODE = NO
DEVELOPMENT_TEAM = YOUR_TEAM_ID
PRODUCT_BUNDLE_IDENTIFIER = com.tiptap.app
```

### 5. Code Signing

1. Set up your Apple Developer Team
2. Configure automatic code signing
3. Ensure provisioning profiles include all required capabilities
4. For distribution, use App Store or Ad Hoc profiles

## 📋 Pre-Build Checklist

- [ ] All capabilities enabled in Xcode
- [ ] Entitlements file properly configured
- [ ] Privacy permissions descriptions added
- [ ] URL schemes configured
- [ ] Associated domains verified
- [ ] Apple Pay merchant IDs registered
- [ ] Push notification certificates configured
- [ ] Code signing properly set up
- [ ] Build settings optimized

## 🚀 Build Commands

### Development Build
```bash
cd ios
xcodebuild -workspace TipTap.xcworkspace -scheme TipTap -configuration Debug -destination generic/platform=iOS -archivePath TipTap.xcarchive archive
```

### Production Build
```bash
cd ios
xcodebuild -workspace TipTap.xcworkspace -scheme TipTap -configuration Release -destination generic/platform=iOS -archivePath TipTap.xcarchive archive
```

### Export for App Store
```bash
xcodebuild -exportArchive -archivePath TipTap.xcarchive -exportPath . -exportOptionsPlist ExportOptions.plist
```

## 🔧 Troubleshooting

### NFC Not Working
1. Verify device supports NFC (iPhone 7+)
2. Check entitlements are properly set
3. Ensure usage description is present
4. Test on physical device (NFC doesn't work in simulator)

### Push Notifications Not Working
1. Verify certificates are properly configured
2. Check entitlements match your provisioning profile
3. Test with development and production certificates
4. Ensure device is registered for development

### Apple Pay Issues
1. Verify merchant IDs are registered in Apple Developer
2. Check certificates are properly configured
3. Ensure entitlements match your setup
4. Test with real payment methods (not available in simulator)

### Deep Linking Issues
1. Verify associated domains are properly configured
2. Check apple-app-site-association file on your server
3. Ensure URL schemes are properly registered
4. Test both custom schemes and universal links

## 📚 Additional Resources

- [Apple Developer Documentation - NFC](https://developer.apple.com/documentation/corenfc)
- [Apple Pay Developer Guide](https://developer.apple.com/apple-pay/)
- [Universal Links Guide](https://developer.apple.com/ios/universal-links/)
- [Push Notifications Guide](https://developer.apple.com/notifications/)
- [App Groups Guide](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_security_application-groups)