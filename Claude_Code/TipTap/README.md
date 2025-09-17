# TipTap - Mobile Tipping App

A React Native mobile application for seamless tipping using NFC and QR code payments with built-in transaction limits.

## Features

- **Dual Payment Methods**: Support for both NFC and QR code payments
- **Transaction Limits**: Configurable daily, weekly, and monthly spending limits
- **Transaction History**: Complete history of all tip transactions
- **Quick Tip Amounts**: Customizable preset tip amounts
- **Real-time Limit Tracking**: Monitor spending against configured limits
- **Secure Local Storage**: Transaction data stored securely on device

## Technology Stack

- **Framework**: React Native 0.73.6
- **Navigation**: React Navigation 6
- **State Management**: React Context + useReducer
- **Storage**: AsyncStorage for local data persistence
- **NFC**: react-native-nfc-manager
- **QR Scanner**: react-native-qrcode-scanner
- **Icons**: react-native-vector-icons

## Project Structure

```
TipTap/
├── src/
│   ├── components/
│   │   ├── NFCPayment.tsx      # NFC payment component
│   │   └── QRPayment.tsx       # QR code payment component
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Main screen with payment options
│   │   ├── TipAmountScreen.tsx # Amount selection screen
│   │   ├── PaymentScreen.tsx   # Payment processing screen
│   │   ├── HistoryScreen.tsx   # Transaction history
│   │   └── SettingsScreen.tsx  # App settings and limits
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Navigation configuration
│   ├── context/
│   │   └── AppContext.tsx      # Global state management
│   ├── hooks/
│   │   └── useTipLimits.ts     # Transaction limit logic
│   ├── services/
│   │   └── PaymentService.ts   # Payment processing logic
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   └── utils/                  # Utility functions
├── android/                    # Android-specific files
├── ios/                        # iOS-specific files
└── __tests__/                  # Test files
```

## Setup Instructions

1. **Prerequisites**
   - Node.js (>= 18)
   - React Native CLI
   - Android Studio (for Android development)
   - Xcode (for iOS development)

2. **Installation**
   ```bash
   cd TipTap
   npm install
   ```

3. **iOS Setup**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Run the App**
   ```bash
   # For Android
   npm run android

   # For iOS
   npm run ios
   ```

## Key Features Explained

### NFC Payments
- Uses `react-native-nfc-manager` for NFC functionality
- Automatically detects NFC capability
- Guides users through the payment process
- Handles NFC tag reading and validation

### QR Code Payments
- Integrates camera for QR code scanning
- Validates QR code format for payments
- Real-time camera preview with overlay
- Supports various QR code payment formats

### Transaction Limits
- Three-tier limit system (daily, weekly, monthly)
- Real-time limit validation before payments
- Visual indicators for spending progress
- Configurable limit amounts in settings

### Data Persistence
- All transactions stored locally using AsyncStorage
- No external server dependencies for basic functionality
- Secure storage of sensitive transaction data
- Export functionality for transaction history

## Configuration

### Transaction Limits
Default limits can be modified in `src/context/AppContext.tsx`:
```typescript
settings: {
  dailyLimit: 100,
  weeklyLimit: 500,
  monthlyLimit: 2000,
  currency: 'USD',
  quickTipAmounts: [5, 10, 15, 20],
}
```

### Permissions Required

#### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.NFC" />
<uses-permission android:name="android.permission.CAMERA" />
```

#### iOS (ios/TipTap/Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required for QR code scanning</string>
```

## Testing

```bash
npm test
```

## Building for Production

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
```bash
cd ios
xcodebuild -workspace TipTap.xcworkspace -scheme TipTap archive
```

## Security Considerations

- All transaction data stored locally on device
- No sensitive payment credentials stored in app
- NFC communications encrypted at hardware level
- QR codes validated before processing

## Future Enhancements

- Cloud synchronization for transaction history
- Multiple currency support
- Receipt generation and sharing
- Integration with popular payment processors
- Biometric authentication for high-value transactions
- Analytics and spending insights

## License

MIT License - see LICENSE file for details