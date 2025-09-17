# NFC Tapping Interface Design

## NFC Send Screen (Sender's View)
```
┌─────────────────────────────────────┐
│ [Back]        Send $25       [Help] │
│                                     │
│                                     │
│          ┌─────────────────┐        │
│          │                 │        │
│          │     📱 ≈≈≈≈     │        │
│          │   Tap to Send   │        │
│          │                 │        │
│          └─────────────────┘        │
│                                     │
│              Ready to send          │
│              $25.00 tip             │
│                                     │
│         Hold phone near the         │
│         recipient's device          │
│                                     │
│                                     │
│  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]  │
│           Scanning...               │
│                                     │
│            [Cancel]                 │
└─────────────────────────────────────┘
```

## NFC Receive Screen (Recipient's View)
```
┌─────────────────────────────────────┐
│ [Back]      Receive Tip      [Help] │
│                                     │
│                                     │
│          ┌─────────────────┐        │
│          │                 │        │
│          │    💰 ≈≈≈≈      │        │
│          │  Ready to       │        │
│          │   Receive       │        │
│          └─────────────────┘        │
│                                     │
│         Waiting for sender...       │
│                                     │
│         Hold your phone near        │
│         the sender's device         │
│                                     │
│                                     │
│                                     │
│  [◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯]  │
│         Listening...                │
│                                     │
│            [Cancel]                 │
└─────────────────────────────────────┘
```

## NFC Connection Established
```
┌─────────────────────────────────────┐
│ [Back]      Connected!       [Help] │
│                                     │
│                                     │
│          ┌─────────────────┐        │
│          │                 │        │
│          │    📱 ⟷ 💰      │        │
│          │   Connected     │        │
│          │                 │        │
│          └─────────────────┘        │
│                                     │
│            Device found!            │
│                                     │
│           Sending $25.00            │
│                                     │
│                                     │
│                                     │
│                                     │
│  [████████████████████████████████] │
│           Processing...             │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

## NFC Success Screen
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│          ┌─────────────────┐        │
│          │                 │        │
│          │       ✅        │        │
│          │   $25.00 Sent   │        │
│          │                 │        │
│          └─────────────────┘        │
│                                     │
│            Success!                 │
│                                     │
│      Transaction completed          │
│         in 2.3 seconds             │
│                                     │
│                                     │
│                                     │
│                                     │
│            [Done]                   │
│                                     │
│       [Send Another Tip]            │
└─────────────────────────────────────┘
```

## Design Specifications

### NFC Animation Ring
```css
.nfc-ring {
  width: 200px;
  height: 200px;
  border: 4px solid transparent;
  border-radius: 50%;
  position: relative;
  margin: 32px auto;
}

.nfc-ring::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 4px solid primary-blue;
  border-top-color: transparent;
  animation: nfc-scan 2s linear infinite;
}

@keyframes nfc-scan {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Visual States

#### Scanning State
- Rotating blue ring around NFC icon
- Pulsing animation (0.8s cycle)
- "Scanning..." text with dots animation
- Subtle screen glow effect

#### Connected State
- Green checkmark animation
- Haptic feedback (medium impact)
- Ring fills with green color
- Connection sound effect

#### Processing State
- Progress bar animation
- Purple accent colors
- "Processing..." with spinner
- Disable all buttons during transfer

### Haptic Feedback Patterns

#### Scanning Phase
```javascript
// Light tap every 2 seconds while scanning
const scanningFeedback = {
  pattern: [100],
  interval: 2000
};
```

#### Connection Found
```javascript
// Double tap to indicate connection
const connectionFeedback = {
  pattern: [100, 100, 100],
  intervals: [50, 50]
};
```

#### Success
```javascript
// Success pattern - ascending intensity
const successFeedback = {
  pattern: [50, 100, 150],
  intervals: [100, 100]
};
```

### Audio Feedback

#### Scanning Sound
- Subtle ping every 2 seconds
- Low volume, non-intrusive
- Can be disabled in settings

#### Connection Sound
- Distinctive "connection" chime
- Higher pitch than scanning
- Brief, confident tone

#### Success Sound
- Pleasant completion sound
- Cash register "cha-ching" alternative
- Celebratory but professional

## Accessibility Features

### Screen Reader Support
```html
<div
  role="status"
  aria-live="polite"
  aria-label="NFC scanning in progress">
  Scanning for nearby devices...
</div>
```

### Visual Indicators
- High contrast mode support
- Color-blind friendly indicators
- Text alternatives for all visual states

### Voice Prompts (Optional)
- "Ready to send tip"
- "Device found, processing payment"
- "Payment sent successfully"

## Error States

### NFC Disabled
```
┌─────────────────────────────────────┐
│ [Back]        NFC Error      [Help] │
│                                     │
│          ┌─────────────────┐        │
│          │        ⚠️        │        │
│          │   NFC Disabled  │        │
│          └─────────────────┘        │
│                                     │
│         NFC is turned off           │
│                                     │
│    Please enable NFC in your        │
│    device settings to continue      │
│                                     │
│            [Open Settings]          │
│                                     │
│         [Use QR Code Instead]       │
└─────────────────────────────────────┘
```

### Connection Failed
```
┌─────────────────────────────────────┐
│ [Back]    Connection Failed  [Help] │
│                                     │
│          ┌─────────────────┐        │
│          │        ❌        │        │
│          │  Failed to      │        │
│          │   Connect       │        │
│          └─────────────────┘        │
│                                     │
│      Couldn't find device          │
│                                     │
│    • Make sure both devices         │
│      have NFC enabled              │
│    • Hold phones closer together    │
│    • Try again                      │
│                                     │
│            [Try Again]              │
│                                     │
│         [Use QR Code Instead]       │
└─────────────────────────────────────┘
```

## Technical Specifications

### NFC Communication Protocol
- **Data Format**: JSON with transaction details
- **Security**: Encrypted payload with device authentication
- **Timeout**: 30 seconds maximum connection time
- **Range**: Optimal at 2-4cm distance

### Performance Requirements
- **Connection Time**: <3 seconds average
- **Data Transfer**: <1 second for transaction
- **Battery Impact**: Minimal, auto-disable after 2 minutes
- **Compatibility**: NFC Forum compliant devices

### Fallback Options
1. **QR Code**: If NFC fails or unavailable
2. **Bluetooth**: For devices without NFC
3. **Manual Entry**: Phone number or username
4. **Link Sharing**: Via SMS or messaging apps

## User Experience Guidelines

### Best Practices
- Keep devices steady during transfer
- Maintain 2-4cm distance
- Avoid metal cases or interference
- Ensure good lighting for visual feedback

### User Education
- First-time tutorial overlay
- Help button accessible throughout
- Tips for successful connections
- Troubleshooting guide in settings