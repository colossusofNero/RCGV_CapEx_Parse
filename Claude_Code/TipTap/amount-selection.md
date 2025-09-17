# Quick Amount Selection Screen

## Amount Selection Screen (Portrait)
```
┌─────────────────────────────────────┐
│ [Back]      Send Tip                │
│                                     │
│           Select Amount             │
│                                     │
│  ┌─────────────────────────────────┐│
│  │             $5                  ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │             $10                 ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │             $20                 ││ ← Most popular
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │             $50                 ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │       Custom Amount             ││
│  └─────────────────────────────────┘│
│                                     │
│            [Continue]               │
└─────────────────────────────────────┘
```

## Amount Selection with Category Context
```
┌─────────────────────────────────────┐
│ [Back]      Send Tip                │
│                                     │
│          🏌️ Golf Caddy              │
│                                     │
│        Suggested Amounts            │
│                                     │
│  ┌─────────────────────────────────┐│
│  │       $15     Most Common       ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │       $25     Generous          ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │       $50     Excellent         ││
│  └─────────────────────────────────┘│
│                                     │
│         Other Amounts               │
│                                     │
│  [ $5 ] [ $10 ] [ $20 ] [Custom]    │
│                                     │
│            [Continue]               │
└─────────────────────────────────────┘
```

## Custom Amount Entry
```
┌─────────────────────────────────────┐
│ [Back]    Custom Amount             │
│                                     │
│          Enter Amount               │
│                                     │
│         ┌─────────────────┐         │
│         │      $ 00       │         │
│         └─────────────────┘         │
│                                     │
│                                     │
│         ┌─────────────────┐         │
│         │ 1   │ 2   │ 3   │         │
│         ├─────┼─────┼─────┤         │
│         │ 4   │ 5   │ 6   │         │
│         ├─────┼─────┼─────┤         │
│         │ 7   │ 8   │ 9   │         │
│         ├─────┼─────┼─────┤         │
│         │ .   │ 0   │ ⌫   │         │
│         └─────┴─────┴─────┘         │
│                                     │
│            [Continue]               │
└─────────────────────────────────────┘
```

## Amount with Payment Method Preview
```
┌─────────────────────────────────────┐
│ [Back]    Confirm Amount            │
│                                     │
│            Sending                  │
│             $25.00                  │
│                                     │
│          Payment Method             │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [💳] Chase Checking •••• 1234   ││
│  │      Available: $2,847.50       ││
│  └─────────────────────────────────┘│
│                                     │
│            [Change]                 │
│                                     │
│                                     │
│                                     │
│                                     │
│  ┌─────────────────────────────────┐│
│  │         Send via NFC            ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │         Send via QR             ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Smart Amount Suggestions (Landscape)
```
┌───────────────────────────────────────────────────────┐
│ [Back]              Send Tip                          │
│                                                       │
│     🍽️ Restaurant Server        💰 Available: $2,847  │
│                                                       │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│ │     $15     │ │     $20     │ │     $25     │      │
│ │   Standard  │ │  Generous   │ │  Excellent  │      │
│ └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                       │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │    $5    │ │   $10    │ │   $30    │ │  Custom  │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                       │
│                    [Continue]                         │
└───────────────────────────────────────────────────────┘
```

## Design Specifications

### Amount Button Styles
```css
.amount-button-primary {
  height: 64px;
  width: 100%;
  margin: 8px 0;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border: 2px solid #e9ecef;
  border-radius: 16px;
  font-size: 24px;
  font-weight: 600;
  color: neutral-900;
  transition: all 0.2s ease;
}

.amount-button-primary:hover {
  border-color: primary-green;
  background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
}

.amount-button-primary:active {
  transform: scale(0.98);
  background: primary-green;
  color: white;
}

.amount-button-secondary {
  height: 48px;
  width: 80px;
  margin: 4px;
  background: neutral-100;
  border: 1px solid neutral-300;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
}

.amount-popular {
  background: linear-gradient(135deg, #e3f2fd, #f1f8e9);
  border-color: primary-blue;
  position: relative;
}

.amount-popular::after {
  content: "Most Popular";
  position: absolute;
  top: -8px;
  right: 16px;
  background: primary-blue;
  color: white;
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 8px;
}
```

### Category-Based Suggestions
```javascript
const amountSuggestions = {
  golf: {
    primary: [15, 25, 50],
    secondary: [5, 10, 20, 75, 100],
    labels: ["Standard", "Generous", "Excellent"]
  },
  restaurant: {
    primary: [15, 20, 25],
    secondary: [5, 10, 30, 40],
    labels: ["Good Service", "Great Service", "Outstanding"]
  },
  hotel: {
    primary: [10, 20, 30],
    secondary: [5, 15, 25, 50],
    labels: ["Standard", "Generous", "VIP"]
  },
  valet: {
    primary: [5, 10, 15],
    secondary: [3, 7, 12, 20],
    labels: ["Quick", "Standard", "Premium"]
  }
};
```

### Smart Amount Logic
```javascript
// Adjust suggestions based on context
const getSmartAmounts = (category, location, timeOfDay) => {
  let baseAmounts = amountSuggestions[category];

  // High-end location adjustment
  if (location.type === 'luxury') {
    baseAmounts = baseAmounts.map(amount => amount * 1.5);
  }

  // Time-based adjustments
  if (timeOfDay === 'late' || timeOfDay === 'holiday') {
    baseAmounts = baseAmounts.map(amount => amount * 1.2);
  }

  return baseAmounts;
};
```

## Custom Amount Interface

### Number Pad Design
```css
.number-pad {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  max-width: 280px;
  margin: 24px auto;
}

.number-key {
  height: 64px;
  border-radius: 32px;
  background: white;
  border: 2px solid neutral-200;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.number-key:active {
  background: primary-blue;
  color: white;
  transform: scale(0.95);
}

.amount-display {
  font-size: 48px;
  font-weight: 700;
  text-align: center;
  color: primary-green;
  background: white;
  border: 2px solid neutral-200;
  border-radius: 16px;
  padding: 20px;
  margin: 20px;
}
```

### Input Validation
```javascript
const validateAmount = (amount) => {
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: "Please enter a valid amount" };
  }

  if (numAmount < 1) {
    return { valid: false, error: "Minimum tip is $1.00" };
  }

  if (numAmount > 500) {
    return { valid: false, error: "Maximum tip is $500.00" };
  }

  return { valid: true };
};
```

## Accessibility Features

### Screen Reader Support
```html
<button
  aria-label="Select 25 dollar tip amount, marked as most popular"
  aria-describedby="amount-25-description">
  $25
</button>

<div id="amount-25-description" class="sr-only">
  Most popular tip amount for golf caddy service
</div>
```

### Keyboard Navigation
- Tab order: Primary amounts → Secondary amounts → Custom → Continue
- Space/Enter to select amounts
- Arrow keys for number pad navigation
- Escape to go back

### Voice Input Support
```javascript
// Support voice commands
const voiceCommands = {
  "twenty dollars": () => selectAmount(20),
  "custom amount": () => openCustomInput(),
  "fifteen": () => selectAmount(15),
  "go back": () => navigateBack()
};
```

## One-Handed Operation Optimization

### Thumb Zone Layout
```css
/* Primary amounts within easy thumb reach */
.primary-amounts {
  position: fixed;
  bottom: 120px;
  left: 16px;
  right: 16px;
}

/* Continue button in optimal position */
.continue-button {
  position: fixed;
  bottom: 32px;
  left: 16px;
  right: 16px;
  height: 56px;
}

/* Custom amount pad positioned for thumb access */
.number-pad {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
}
```

### Gesture Support
- **Swipe up**: Open custom amount
- **Long press**: See amount details/suggestions
- **Double tap**: Confirm selection quickly

## Performance Optimizations

### Amount Button Animations
```css
.amount-button {
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.amount-button:active {
  transform: scale(0.96);
  transition-duration: 0.1s;
}
```

### Haptic Feedback
```javascript
const hapticFeedback = {
  amountSelect: () => navigator.vibrate(50),
  customInput: () => navigator.vibrate([25, 25, 25]),
  confirm: () => navigator.vibrate(100)
};
```

## Error States

### Insufficient Funds
```
┌─────────────────────────────────────┐
│ [Back]    Insufficient Funds        │
│                                     │
│          ⚠️ Cannot Send             │
│             $250.00                 │
│                                     │
│        Account Balance: $125.50     │
│                                     │
│     Please select a lower amount    │
│     or add funds to your account    │
│                                     │
│            [Add Funds]              │
│                                     │
│         [Select Different Amount]   │
│                                     │
│            [Cancel]                 │
└─────────────────────────────────────┘
```

### Network Error
```
┌─────────────────────────────────────┐
│ [Back]    Connection Error          │
│                                     │
│          📶 No Connection           │
│                                     │
│      Cannot verify account          │
│         balance right now           │
│                                     │
│       • Check internet connection   │
│       • Try again in a moment       │
│                                     │
│            [Retry]                  │
│                                     │
│            [Cancel]                 │
└─────────────────────────────────────┘
```

## Analytics & Insights

### Usage Tracking
- Most selected amounts by category
- Custom amount vs preset usage
- Average tip amounts by context
- User behavior patterns

### Smart Suggestions Improvement
- A/B testing for amount layouts
- Machine learning for personalized suggestions
- Regional/cultural adjustments
- Seasonal tip amount trends