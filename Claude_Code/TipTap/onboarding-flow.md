# Onboarding Flow Design

## Screen 1: Welcome Screen
```
┌─────────────────────────┐
│    [TipTap Logo]        │
│                         │
│     Welcome to          │
│      TipTap             │
│                         │
│  Lightning-fast tipping │
│   for service workers   │
│                         │
│                         │
│                         │
│                         │
│  ┌─────────────────────┐│
│  │    Get Started      ││
│  └─────────────────────┘│
│                         │
│   Already have account? │
│       Sign In           │
└─────────────────────────┘
```

**Design Details:**
- Large, friendly logo (96px)
- Headline: 32px, bold, centered
- Subtext: 16px, neutral-700
- CTA button: btn-large, primary-green
- Sign in link: 14px, primary-blue, underlined

## Screen 2: Account Linking Introduction
```
┌─────────────────────────┐
│    [Back] Link Account  │
│                         │
│    [Bank Card Icon]     │
│                         │
│   Connect Your Bank     │
│                         │
│ We use bank-level       │
│ encryption to securely  │
│ link your account       │
│                         │
│ • Instant transfers     │
│ • No hidden fees        │
│ • Cancel anytime        │
│                         │
│  ┌─────────────────────┐│
│  │  Link Bank Account  ││
│  └─────────────────────┘│
│                         │
│      Skip for now       │
└─────────────────────────┘
```

**Design Details:**
- Navigation: Back arrow + title
- Icon: 64px bank/card illustration
- Benefits list: 14px with green checkmarks
- Primary CTA: btn-large, primary-blue
- Skip option: 14px, neutral-700

## Screen 3: Bank Selection (Plaid Integration)
```
┌─────────────────────────┐
│ [Back] Choose Your Bank │
│                         │
│  ┌─ Search banks... ──┐ │
│  └───────────────────┘  │
│                         │
│  ┌─[Bank Logo] Chase──┐ │
│  └─────────────────────┘│
│  ┌─[Bank Logo] Wells──┐ │
│  └─────────────────────┘│
│  ┌─[Bank Logo] BofA───┐ │
│  └─────────────────────┘│
│  ┌─[Bank Logo] Citi───┐ │
│  └─────────────────────┘│
│                         │
│    Can't find yours?    │
│     Add manually        │
└─────────────────────────┘
```

**Design Details:**
- Search bar: 48px height, rounded
- Bank cards: 56px height, with logos
- Manual option: 14px, primary-blue link
- Scrollable list with popular banks first

## Screen 4: Account Credentials (Plaid)
```
┌─────────────────────────┐
│   [Back] Sign in to     │
│      Chase Bank         │
│                         │
│   [Chase Logo]          │
│                         │
│  Username               │
│  ┌─────────────────────┐│
│  │                     ││
│  └─────────────────────┘│
│                         │
│  Password               │
│  ┌─────────────────────┐│
│  │                     ││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│
│  │      Continue       ││
│  └─────────────────────┘│
│                         │
│   🔒 Secured by Plaid   │
└─────────────────────────┘
```

**Design Details:**
- Bank logo: 48px
- Input fields: 52px height, rounded borders
- Security badge: Small lock icon + "Plaid"
- Form validation: Real-time error states

## Screen 5: Account Selection
```
┌─────────────────────────┐
│ [Back] Choose Account   │
│                         │
│  Which account for      │
│      payments?          │
│                         │
│  ┌─ ⚪ Checking ────────┐│
│  │   Chase •••• 1234   ││
│  │   Balance: $2,450   ││
│  └─────────────────────┘│
│                         │
│  ┌─ ○  Savings ────────┐│
│  │   Chase •••• 5678   ││
│  │   Balance: $12,300  ││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│
│  │      Continue       ││
│  └─────────────────────┘│
└─────────────────────────┘
```

**Design Details:**
- Account cards: 72px height
- Radio buttons: Large, easy to tap
- Account info: Masked account numbers
- Balance display: Secondary text

## Screen 6: Notifications Permission
```
┌─────────────────────────┐
│  [Back] Stay Updated    │
│                         │
│    [Bell Icon]          │
│                         │
│  Get Notifications      │
│                         │
│ Stay informed about     │
│ your transactions and   │
│ received tips           │
│                         │
│ • Transaction receipts  │
│ • Tip notifications     │
│ • Security alerts       │
│                         │
│  ┌─────────────────────┐│
│  │ Enable Notifications││
│  └─────────────────────┘│
│                         │
│      Maybe later        │
└─────────────────────────┘
```

**Design Details:**
- Bell icon: 64px with subtle animation
- Benefits list: Green checkmarks
- Primary CTA: btn-large, primary-blue
- Skip option available

## Screen 7: Setup Complete
```
┌─────────────────────────┐
│                         │
│    [Checkmark Circle]   │
│                         │
│    You're all set!      │
│                         │
│  Your TipTap account    │
│  is ready to use        │
│                         │
│                         │
│                         │
│                         │
│                         │
│  ┌─────────────────────┐│
│  │   Start Tipping     ││
│  └─────────────────────┘│
│                         │
│                         │
└─────────────────────────┘
```

**Design Details:**
- Success icon: 96px animated checkmark
- Celebration micro-animation
- Final CTA: btn-large, primary-green
- Automatic navigation to home after 2s

## Flow Summary
1. **Welcome** → Get Started (1 tap)
2. **Account Intro** → Link Bank Account (1 tap)
3. **Bank Selection** → Choose bank (1 tap)
4. **Credentials** → Sign in (1 tap after form)
5. **Account Selection** → Choose account (1 tap)
6. **Notifications** → Enable/Skip (1 tap)
7. **Complete** → Start Tipping (1 tap)

**Total: 7 taps maximum to complete onboarding**