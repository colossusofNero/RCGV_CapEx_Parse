# iOS App Store Screenshots Specification

## Required Screenshot Sizes

### iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max)
- **Resolution**: 1290 x 2796 pixels
- **Aspect Ratio**: 19.5:9
- **Required**: Yes (Primary display size)

### iPhone 6.5" (iPhone XS Max, 11 Pro Max, 12 Pro Max, 13 Pro Max)
- **Resolution**: 1242 x 2688 pixels
- **Aspect Ratio**: 19.5:9
- **Required**: Yes

### iPhone 5.5" (iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus)
- **Resolution**: 1242 x 2208 pixels
- **Aspect Ratio**: 16:9
- **Required**: Yes (for older device support)

### iPad Pro (12.9-inch) (3rd, 4th, 5th, 6th generation)
- **Resolution**: 2048 x 2732 pixels
- **Aspect Ratio**: 4:3
- **Required**: Yes (for iPad support)

## Screenshot Content Strategy

### Screenshot 1: Main Home Screen
**Message**: "Tap. Tip. Done."
- Show the main interface with NFC and QR code options
- Highlight the clean, professional design
- Display preset tip amounts ($5, $10, $15, $20)

### Screenshot 2: NFC Payment Flow
**Message**: "Just Tap Your Phone"
- Show NFC payment in progress
- Emphasize the simplicity and speed
- Include visual feedback for NFC activation

### Screenshot 3: QR Code Scanner
**Message**: "Or Scan to Tip Instantly"
- Display QR code scanner interface
- Show camera overlay with target reticle
- Emphasize universal compatibility

### Screenshot 4: Transaction Limits Feature
**Message**: "$20 Limit = Smart Compliance"
- Highlight the $20 transaction limit
- Show spending tracker
- Emphasize regulatory compliance benefit

### Screenshot 5: Transaction History
**Message**: "Track Every Tip Securely"
- Display transaction history screen
- Show spending analytics
- Emphasize security and privacy

## Text Overlay Guidelines

### Primary Headline (Top)
- Font: SF Pro Display Bold
- Size: 48pt (iPhone), 64pt (iPad)
- Color: #1D4ED8 (TipTap Blue)

### Secondary Text (Bottom)
- Font: SF Pro Text Regular
- Size: 24pt (iPhone), 32pt (iPad)
- Color: #374151 (Dark Gray)

### Background Treatment
- Use subtle gradient overlay (white to light blue)
- Ensure text readability
- Maintain app UI visibility

## Key Messaging Points

1. **Regulatory Compliance**: "$20 limit keeps it simple and compliant"
2. **Convenience**: "No cash needed, works anywhere"
3. **Security**: "Bank-level security, locally stored data"
4. **Speed**: "Instant recognition for great service"
5. **Universal**: "NFC and QR - works on any phone"

## File Naming Convention

```
ios-screenshot-[size]-[number]-[description].png

Examples:
ios-screenshot-6.7-01-home-screen.png
ios-screenshot-6.5-02-nfc-payment.png
ios-screenshot-5.5-03-qr-scanner.png
ios-screenshot-ipad-04-transaction-limits.png
```

## Technical Requirements

- **Format**: PNG (24-bit RGB)
- **Color Space**: sRGB
- **No transparency**: Fill background completely
- **Text safe areas**: Keep text 120px from edges (iPhone), 160px (iPad)
- **Status bar**: Show realistic status bar with full signal, battery, time