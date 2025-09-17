# Google Play Store Screenshots Specification

## Required Screenshot Dimensions

### Phone Screenshots
- **Minimum**: 2 screenshots required
- **Maximum**: 8 screenshots allowed
- **Dimensions**:
  - 16:9 aspect ratio: 1920 x 1080 pixels (landscape) or 1080 x 1920 pixels (portrait)
  - 9:16 aspect ratio: 1080 x 1920 pixels (portrait) - **Recommended**
- **Format**: PNG or JPEG
- **File Size**: Maximum 8MB per screenshot

### Tablet Screenshots (7-inch)
- **Minimum**: 1 screenshot required (if tablet supported)
- **Maximum**: 8 screenshots allowed
- **Dimensions**:
  - 16:10 aspect ratio: 1920 x 1200 pixels (landscape) or 1200 x 1920 pixels (portrait)
  - 4:3 aspect ratio: 2048 x 1536 pixels (landscape) or 1536 x 2048 pixels (portrait)

### 10-inch Tablet Screenshots
- **Dimensions**:
  - 16:10 aspect ratio: 2560 x 1600 pixels (landscape) or 1600 x 2560 pixels (portrait)
  - 4:3 aspect ratio: 2048 x 1536 pixels (landscape) or 1536 x 2048 pixels (portrait)

## TipTap Android Screenshots Strategy

### Phone Screenshots (Portrait 1080 x 1920)

#### Screenshot 1: Home Screen - "Digital Tipping Made Simple"
```
[Android Status Bar]
Time: 2:30    [Signal][Wifi][Battery: 85%]

        TipTap

  Choose Your Tip Amount

    [$5]  [$10]  [$15]  [$20]

    How would you like to pay?

    [NFC Icon]        [QR Icon]
      Tap             Scan
   Your Phone      QR Code

   Today: $35 of $100 daily limit

[Text Overlay: "Tap your phone or scan QR codes anywhere"]
```

#### Screenshot 2: NFC Payment Screen - "Just Tap to Pay"
```
[Android Status Bar]

        TipTap - NFC Payment

    [Large NFC animation with pulsing rings]

    Ready to tap!

    Hold your phone near
    the payment device

       Tip Amount: $15.00

    [Cancel] [Switch to QR Code]

[Text Overlay: "NFC technology - instant and secure"]
```

#### Screenshot 3: QR Code Scanner - "Scan Anywhere"
```
[Android Status Bar]

[Full camera viewfinder interface]
┌─────────────────────────────┐
│                             │
│    [QR targeting frame]     │
│       in center            │
│                             │
│     Point at QR code        │
└─────────────────────────────┘

      Tip Amount: $10.00

    [Flash] [Gallery] [NFC Instead]

[Text Overlay: "Works with any QR code reader"]
```

#### Screenshot 4: Transaction Success - "Tip Sent Successfully"
```
[Android Status Bar]

        TipTap

    [Large green checkmark animation]

       ✓ Tip Sent!

    $15.00 to Coffee Shop
    Today at 2:35 PM

    Transaction ID: TT-2024-001234

    [View Receipt] [Send Another Tip]

[Text Overlay: "Instant confirmation every time"]
```

#### Screenshot 5: Spending Tracker - "$20 Smart Limit"
```
[Android Status Bar]

        Spending Limits

    Daily Limit
    $55 / $100 (55%)
    [Progress bar showing 55%]

    Weekly Limit
    $210 / $500 (42%)
    [Progress bar showing 42%]

    Monthly Limit
    $680 / $2000 (34%)
    [Progress bar showing 34%]

    ✓ $20 max per tip = regulatory compliant
    ✓ No Money Transmitter License needed

[Text Overlay: "Smart limits keep you compliant"]
```

#### Screenshot 6: Transaction History - "Track Every Tip"
```
[Android Status Bar]

        Transaction History

    March 15, 2024
    Restaurant Server      $20.00   7:30 PM
    Valet Service         $10.00   6:45 PM

    March 14, 2024
    Coffee Barista        $5.00    8:15 AM
    Hotel Concierge       $15.00   11:30 PM
    Golf Caddie           $20.00   2:15 PM

    [Export History] [Settings]

    🔒 All data stored securely on device

[Text Overlay: "Your privacy protected always"]
```

## Tablet Screenshots (Landscape 1920 x 1200)

### Tablet Screenshot 1: Home Screen Optimized
```
[Android Tablet Layout - Landscape]

    TipTap - Digital Tipping for Service Industries

[Left Column - 60%]           [Right Column - 40%]
Choose Your Tip:              Payment Methods:

[$5]  [$10]                   [Large NFC Icon]
[$15] [$20]                   Tap to Pay

[Custom Amount Input]         [Large QR Icon]
                              Scan QR Code

Today's Activity:
Tips Given: 6                 Recent Tips:
Total: $65 / $100 daily limit Coffee Shop - $15
                              Restaurant - $20
                              Valet - $10

[Bottom: Designed for restaurants, hotels, golf courses, and service businesses]
```

### Tablet Screenshot 2: Business Dashboard View
```
[Android Tablet Layout - Landscape]

         TipTap Business Integration

[Left Panel]                  [Center Panel]              [Right Panel]
Transaction Limits:           Live Activity:              Settings:

Daily: $65/$100              [Real-time tip feed]         ✓ NFC Enabled
Weekly: $280/$500            15:30 - Coffee Shop $5       ✓ QR Scanner Ready
Monthly: $850/$2000          15:25 - Restaurant $20       ✓ Limits Active
                            15:20 - Valet $10            ✓ Privacy Secure

Compliance Status:           Payment Methods:             Quick Actions:
✓ Under $20 limit           NFC: 75% of tips            [Export Data]
✓ MTL compliant             QR: 25% of tips             [View Reports]
✓ Secure processing         Success Rate: 99.8%         [Contact Support]
```

## Screenshot Text Overlays

### Overlay Design Guidelines
- **Font**: Roboto Bold for headlines, Roboto Regular for body text
- **Size**: 36pt for main headlines, 24pt for secondary text
- **Color**: White text with dark shadow or colored background for contrast
- **Placement**: Bottom third of screen for optimal visibility
- **Duration**: Clear, readable messaging that works across device sizes

### Text Messages by Screenshot

#### Phone Screenshots
1. **"Tap your phone or scan QR codes anywhere"**
2. **"NFC technology - instant and secure"**
3. **"Works with any QR code reader"**
4. **"Instant confirmation every time"**
5. **"Smart limits keep you compliant"**
6. **"Your privacy protected always"**

#### Tablet Screenshots
1. **"Designed for service industries - hotels, restaurants, golf courses"**
2. **"Professional tipping solution with regulatory compliance"**

## Android-Specific Design Elements

### Material Design Integration
- Use Material Design 3 components and styling
- Floating Action Buttons where appropriate
- Material color schemes (blues and teals)
- Proper elevation and shadows
- Android-specific navigation patterns

### Status Bar Details
- Show realistic Android status bar
- Battery percentage, signal strength, WiFi
- Time should be consistent across screenshots
- Use Android-standard icons and styling

### Device Frames
- Use high-quality Android device mockups
- Popular devices: Pixel 7 Pro, Samsung Galaxy S23
- Clean, minimal frames that don't distract from app content
- Consistent device orientation across screenshot set

## File Naming Convention

### Phone Screenshots
```
google-play-phone-01-home-screen.png
google-play-phone-02-nfc-payment.png
google-play-phone-03-qr-scanner.png
google-play-phone-04-success-confirmation.png
google-play-phone-05-spending-limits.png
google-play-phone-06-transaction-history.png
```

### Tablet Screenshots
```
google-play-tablet-7in-01-dashboard.png
google-play-tablet-7in-02-business-view.png
google-play-tablet-10in-01-landscape-home.png
```

## Key Messaging Focus

### Primary Value Propositions
1. **Simplicity**: "Tap your phone or scan QR codes"
2. **Compliance**: "$20 limit = regulatory compliance"
3. **Security**: "Bank-level security, local data storage"
4. **Universality**: "Works anywhere QR codes or NFC available"
5. **Business-Ready**: "Perfect for service industries"

### Android-Specific Benefits
- Material Design interface familiar to Android users
- NFC support on compatible Android devices
- Camera integration for QR code scanning
- Local storage respects Android privacy preferences

## Quality Assurance Checklist

### Technical Requirements
- [ ] All screenshots exactly match required dimensions
- [ ] File sizes under 8MB each
- [ ] High resolution, no pixelation or blur
- [ ] Consistent color profiles across all images
- [ ] Text overlays readable on mobile devices

### Content Requirements
- [ ] Show actual app interface (not mockups)
- [ ] Accurate representation of app features
- [ ] No misleading claims or exaggerated benefits
- [ ] Professional, business-appropriate imagery
- [ ] Consistent with app's actual user experience

### Google Play Compliance
- [ ] No copyrighted content without permission
- [ ] Family-friendly imagery appropriate for all audiences
- [ ] Accurate representation of $20 transaction limit
- [ ] No prohibited content or claims
- [ ] Consistent with app description and feature set

The Android screenshots should emphasize TipTap's Material Design integration while highlighting the same core value propositions as the iOS version, with particular attention to the regulatory compliance benefits of the $20 transaction limit.