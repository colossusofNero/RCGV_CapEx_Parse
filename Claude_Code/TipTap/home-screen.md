# Home Screen Design

## Main Home Screen
```
┌─────────────────────────────────────┐
│ [Profile]          TipTap    [Menu] │
│                                     │
│              Hi Sarah!              │
│                                     │
│         ┌─────────────────┐         │
│         │   $2,847.50     │         │
│         │  Available      │         │
│         └─────────────────┘         │
│                                     │
│  ┌─────────────────────────────────┐│
│  │         💸 Send Tip            ││
│  │                                ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │         💰 Receive Tip         ││
│  │                                ││
│  └─────────────────────────────────┘│
│                                     │
│              Quick Actions          │
│                                     │
│  [NFC] [QR] [History] [Contacts]    │
│                                     │
│            Recent Activity          │
│  ┌─ $15 Golf Caddy        Today ─┐ │
│  ┌─ $25 Hotel Staff    Yesterday─┐ │
│  ┌─ $12 Valet         2 days ago─┐ │
└─────────────────────────────────────┘
```

## Design Specifications

### Header Section (72px height)
```css
.header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: linear-gradient(135deg, primary-blue, primary-purple);
}

.app-title {
  font-size: 20px;
  font-weight: 700;
  color: neutral-900;
}

.menu-button {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: neutral-100;
}
```

### Greeting & Balance (120px height)
```css
.greeting {
  font-size: 24px;
  font-weight: 600;
  color: neutral-900;
  text-align: center;
  margin-bottom: 16px;
}

.balance-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin: 0 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.balance-amount {
  font-size: 32px;
  font-weight: 700;
  color: primary-green;
  margin-bottom: 4px;
}

.balance-label {
  font-size: 14px;
  color: neutral-700;
}
```

### Primary Action Buttons (160px height)
```css
.action-button {
  height: 72px;
  margin: 8px 16px;
  border-radius: 36px;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.send-tip-button {
  background: linear-gradient(135deg, #00C853, #4CAF50);
  color: white;
}

.receive-tip-button {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
}

.action-button:active {
  transform: scale(0.98);
}
```

### Quick Actions (80px height)
```css
.quick-actions {
  padding: 16px;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.quick-action-button {
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: neutral-100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.quick-action-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}

.quick-action-label {
  font-size: 12px;
  color: neutral-700;
}
```

## One-Handed Operation Zones

### Primary Zone (Bottom 75%)
- Send Tip button: Most prominent, thumb-friendly
- Receive Tip button: Secondary but equally accessible
- Quick actions: Within easy thumb reach

### Secondary Zone (Top 25%)
- Profile and settings: Less frequent access
- Balance display: Information only
- Greeting: Visual hierarchy element

## Interaction Flow

### Send Tip Flow (3 taps maximum)
1. **Tap "Send Tip"** → Amount selection screen
2. **Tap amount preset** (or enter custom) → Payment method confirmation
3. **Tap "Send via NFC/QR"** → Complete transaction

### Receive Tip Flow (2 taps maximum)
1. **Tap "Receive Tip"** → QR code display
2. **Tap to refresh QR** (if needed) → Ready to receive

## Accessibility Features

### Screen Reader Support
```html
<button aria-label="Send tip to service worker">
  💸 Send Tip
</button>

<button aria-label="Generate QR code to receive tips">
  💰 Receive Tip
</button>
```

### High Contrast Mode
- Button borders increase to 2px
- Color contrast meets WCAG AAA standards
- Focus indicators become more prominent

### Large Text Support
- All text scales with system preferences
- Button sizes increase proportionally
- Maintains minimum 44px touch targets

## Animation & Feedback

### Micro-interactions
```css
@keyframes button-press {
  0% { transform: scale(1); }
  50% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

@keyframes success-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

### Haptic Feedback
- Light impact on button press
- Medium impact on successful transaction
- Error vibration pattern for failures

## State Management

### Loading States
- Skeleton screens for balance loading
- Button loading spinners
- Shimmer effects for recent activity

### Error States
- Balance unavailable message
- Retry buttons for failed loads
- Offline mode indicators

### Empty States
- "No recent activity" illustration
- Getting started tips
- Account setup prompts