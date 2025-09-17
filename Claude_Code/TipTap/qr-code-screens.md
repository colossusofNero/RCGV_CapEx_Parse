# QR Code Scanner and Generator Screens

## QR Code Generator (Receive Tips)
```
┌─────────────────────────────────────┐
│ [Back]    Receive Tips       [Share]│
│                                     │
│                                     │
│         ┌─────────────────┐         │
│         │                 │         │
│         │  ████ ██ ████   │         │
│         │  ██ ████ ██ █   │         │
│         │  ████ ██ ████   │         │
│         │                 │         │
│         └─────────────────┘         │
│                                     │
│           Scan to tip me            │
│                                     │
│         Valid for 5 minutes         │
│            ⏱️ 04:23 left            │
│                                     │
│                                     │
│            [Refresh QR]             │
│                                     │
│         [Switch to NFC]             │
└─────────────────────────────────────┘
```

## QR Code Scanner (Send Tips)
```
┌─────────────────────────────────────┐
│ [Back]      Scan QR         [Flash] │
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │         📷 Camera View          ││
│  │                                 ││
│  │    ┌─────────────────┐          ││
│  │    │                 │          ││
│  │    │  Scan QR Code   │          ││
│  │    │   to Send Tip   │          ││
│  │    │                 │          ││
│  │    └─────────────────┘          ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│        Point camera at QR code     │
│                                     │
│          [Enter Code Manually]      │
│                                     │
│            [Use NFC Instead]        │
└─────────────────────────────────────┘
```

## QR Code Scanner with Detection
```
┌─────────────────────────────────────┐
│ [Back]      Scanning        [Flash] │
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │         📷 Camera View          ││
│  │                                 ││
│  │    ┌═══════════════════┐        ││
│  │    ║ QR CODE DETECTED  ║        ││
│  │    ║                   ║        ││
│  │    ║   Processing...   ║        ││
│  │    ║                   ║        ││
│  │    └═══════════════════┘        ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│           QR Code found!            │
│                                     │
│         Verifying recipient         │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

## QR Code Confirmation Screen
```
┌─────────────────────────────────────┐
│ [Back]      Confirm Tip             │
│                                     │
│          ┌─────────────────┐        │
│          │   [Avatar]      │        │
│          │                 │        │
│          │   Mike Johnson  │        │
│          │  Golf Caddy     │        │
│          └─────────────────┘        │
│                                     │
│            Send tip of              │
│             $25.00                  │
│                                     │
│         Payment Method              │
│     [💳] Chase •••• 1234            │
│                                     │
│                                     │
│  ┌─────────────────────────────────┐│
│  │           Confirm Tip           ││
│  └─────────────────────────────────┘│
│                                     │
│            [Cancel]                 │
└─────────────────────────────────────┘
```

## Manual Code Entry
```
┌─────────────────────────────────────┐
│ [Back]    Enter Tip Code            │
│                                     │
│          Enter the 6-digit          │
│           tip code below            │
│                                     │
│        ┌───┬───┬───┬───┬───┬───┐    │
│        │   │   │   │   │   │   │    │
│        └───┴───┴───┴───┴───┴───┘    │
│                                     │
│                                     │
│         ┌─────────────────┐         │
│         │ 1   │ 2   │ 3   │         │
│         ├─────┼─────┼─────┤         │
│         │ 4   │ 5   │ 6   │         │
│         ├─────┼─────┼─────┤         │
│         │ 7   │ 8   │ 9   │         │
│         ├─────┼─────┼─────┤         │
│         │     │ 0   │ ⌫   │         │
│         └─────┴─────┴─────┘         │
│                                     │
│            [Continue]               │
└─────────────────────────────────────┘
```

## QR Share Options
```
┌─────────────────────────────────────┐
│              Share QR               │
│                                     │
│         ┌─────────────────┐         │
│         │  ████ ██ ████   │         │
│         │  ██ ████ ██ █   │         │
│         │  ████ ██ ████   │         │
│         └─────────────────┘         │
│                                     │
│        Sarah's Tip Request          │
│                                     │
│  ┌─────────────────────────────────┐│
│  │      📱 Text Message            ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │      📧 Email                   ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │      📋 Copy Link               ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │      💾 Save Image              ││
│  └─────────────────────────────────┘│
│                                     │
│            [Cancel]                 │
└─────────────────────────────────────┘
```

## Design Specifications

### QR Code Generator
```css
.qr-container {
  width: 240px;
  height: 240px;
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin: 32px auto;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.qr-code {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.qr-timer {
  font-size: 16px;
  color: warning;
  text-align: center;
  margin-top: 16px;
}

.qr-expiry {
  font-size: 14px;
  color: neutral-700;
  text-align: center;
  margin-top: 8px;
}
```

### Camera Viewfinder
```css
.camera-container {
  position: relative;
  height: 400px;
  margin: 16px;
  border-radius: 16px;
  overflow: hidden;
  background: black;
}

.scan-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  border: 2px solid white;
  border-radius: 16px;
}

.scan-corners {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid primary-green;
}

.scan-corners::before,
.scan-corners::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 3px;
  background: primary-green;
}
```

### QR Detection Animation
```css
@keyframes qr-detected {
  0% {
    border-color: white;
    transform: scale(1);
  }
  50% {
    border-color: primary-green;
    transform: scale(1.05);
  }
  100% {
    border-color: primary-green;
    transform: scale(1);
  }
}

.qr-detected {
  animation: qr-detected 0.5s ease-out;
  border-color: primary-green;
  box-shadow: 0 0 20px rgba(0, 200, 83, 0.5);
}
```

## User Experience Flow

### QR Generation Flow (Receive)
1. **Tap "Receive Tip"** → QR code generated instantly
2. **Show QR to sender** → Scanner detects and processes
3. **Automatic refresh** → New QR every 5 minutes for security

### QR Scanning Flow (Send)
1. **Tap "Send Tip"** → Amount selection
2. **Tap "Scan QR"** → Camera opens immediately
3. **Point at QR code** → Automatic detection and confirmation

## Security Features

### QR Code Encryption
- **Time-limited**: 5-minute expiry
- **Single-use**: Invalidated after successful scan
- **Encrypted payload**: Recipient ID and validation token
- **Anti-fraud**: Device fingerprinting

### Scanner Security
- **Validation**: Verify QR authenticity before showing confirmation
- **Malicious QR detection**: Block suspicious or malformed codes
- **HTTPS only**: All API calls use secure connections
- **Rate limiting**: Prevent spam scanning attempts

## Accessibility Features

### Screen Reader Support
```html
<div
  role="img"
  aria-label="QR code for receiving tips from Sarah Johnson">
  <!-- QR Code Image -->
</div>

<div
  role="status"
  aria-live="polite">
  QR code expires in 4 minutes and 23 seconds
</div>
```

### High Contrast Mode
- QR code maintains readability
- Scanner overlay more prominent
- Button borders increased
- Text size scalable

### Camera Accessibility
- Voice guidance for positioning
- Audio feedback on detection
- Flashlight toggle for low light
- Manual entry fallback

## Error Handling

### Camera Permission Denied
```
┌─────────────────────────────────────┐
│ [Back]    Camera Access     [Help]  │
│                                     │
│          ┌─────────────────┐        │
│          │        📷       │        │
│          │   Camera        │        │
│          │   Disabled      │        │
│          └─────────────────┘        │
│                                     │
│       Camera access required        │
│       to scan QR codes              │
│                                     │
│         [Enable Camera]             │
│                                     │
│         [Enter Code Manually]       │
│                                     │
│            [Use NFC]                │
└─────────────────────────────────────┘
```

### Invalid QR Code
```
┌─────────────────────────────────────┐
│ [Back]    Invalid Code      [Help]  │
│                                     │
│          ┌─────────────────┐        │
│          │        ⚠️        │        │
│          │   Invalid QR    │        │
│          │      Code       │        │
│          └─────────────────┘        │
│                                     │
│      This QR code is not            │
│      a valid TipTap code            │
│                                     │
│           [Scan Again]              │
│                                     │
│         [Enter Code Manually]       │
│                                     │
│            [Cancel]                 │
└─────────────────────────────────────┘
```

### Expired QR Code
```
┌─────────────────────────────────────┐
│ [Back]    Code Expired      [Help]  │
│                                     │
│          ┌─────────────────┐        │
│          │        ⏰        │        │
│          │    Expired      │        │
│          │   QR Code       │        │
│          └─────────────────┘        │
│                                     │
│     This QR code has expired        │
│                                     │
│    Ask the recipient to             │
│    generate a new code              │
│                                     │
│           [Scan Again]              │
│                                     │
│            [Cancel]                 │
└─────────────────────────────────────┘
```

## Technical Specifications

### QR Code Format
- **Standard**: QR Code Model 2
- **Error Correction**: Level M (15% redundancy)
- **Data Capacity**: Up to 2,953 bytes
- **Quiet Zone**: 4 module minimum border

### Camera Requirements
- **Resolution**: Minimum 720p for reliable scanning
- **Autofocus**: Required for close-range scanning
- **Frame Rate**: 30fps for smooth experience
- **Formats**: JPEG, PNG support

### Performance Targets
- **QR Generation**: <500ms
- **Scan Detection**: <2 seconds
- **Validation**: <1 second
- **Battery Impact**: Minimal, auto-stop after 2 minutes idle