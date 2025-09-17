import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: {
    OS: 'ios',
    select: jest.fn((options) => options.ios),
  },
  NativeModules: {
    ...jest.requireActual('react-native').NativeModules,
    RNDeviceInfo: {
      getUniqueId: jest.fn(() => Promise.resolve('test-device-id')),
      getBundleId: jest.fn(() => Promise.resolve('com.tiptap.app')),
    },
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(() => Promise.resolve()),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
}));

// Mock EncryptedStorage
jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock NFC Manager
jest.mock('react-native-nfc-manager', () => ({
  default: {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    isSupported: jest.fn(() => Promise.resolve(true)),
    isEnabled: jest.fn(() => Promise.resolve(true)),
    requestTechnology: jest.fn(() => Promise.resolve()),
    cancelTechnologyRequest: jest.fn(() => Promise.resolve()),
    getTag: jest.fn(() => Promise.resolve(null)),
    setEventListener: jest.fn(),
    ndefHandler: {
      writeNdefMessage: jest.fn(() => Promise.resolve()),
    },
  },
  NfcTech: {
    Ndef: 'Ndef',
  },
  Ndef: {
    encodeMessage: jest.fn(() => new Uint8Array()),
    textRecord: jest.fn(() => ({})),
  },
}));

// Mock Camera permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(() => Promise.resolve('granted')),
  request: jest.fn(() => Promise.resolve('granted')),
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
  },
}));

// Mock QR Code Scanner
jest.mock('react-native-qrcode-scanner', () => 'QRCodeScanner');

// Mock Camera
jest.mock('react-native-camera', () => ({
  RNCamera: {
    Constants: {
      FlashMode: {
        off: 'off',
        on: 'on',
        auto: 'auto',
      },
    },
  },
}));

// Mock Biometrics
jest.mock('react-native-biometrics', () => ({
  isSensorAvailable: jest.fn(() => Promise.resolve({ available: true, biometryType: 'TouchID' })),
  createKeys: jest.fn(() => Promise.resolve()),
  biometricKeysExist: jest.fn(() => Promise.resolve({ keysExist: true })),
  createSignature: jest.fn(() => Promise.resolve({ success: true, signature: 'test-signature' })),
}));

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  initStripe: jest.fn(() => Promise.resolve()),
  createPaymentMethod: jest.fn(() => Promise.resolve({
    paymentMethod: { id: 'pm_test_123' },
    error: null,
  })),
  confirmPayment: jest.fn(() => Promise.resolve({
    paymentIntent: { status: 'succeeded' },
    error: null,
  })),
}));

// Mock Plaid Link
jest.mock('react-native-plaid-link-sdk', () => ({
  LinkSuccess: 'LinkSuccess',
  LinkExit: 'LinkExit',
  LinkError: 'LinkError',
  openLink: jest.fn(),
  create: jest.fn(),
}));

// Mock Redux Toolkit
jest.mock('@reduxjs/toolkit', () => ({
  ...jest.requireActual('@reduxjs/toolkit'),
  configureStore: jest.fn(() => ({
    dispatch: jest.fn(),
    getState: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

// Global test utilities
global.__DEV__ = true;
global.fetch = jest.fn();

// Mock console methods in tests
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...global.console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}