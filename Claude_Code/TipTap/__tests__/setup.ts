import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  SECURITY_LEVEL: {},
  ACCESSIBLE: {},
  ACCESS_CONTROL: {},
  AUTHENTICATION_TYPE: {},
  BIOMETRY_TYPE: {},
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: '', password: '' })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
  canImplyAuthentication: jest.fn(() => Promise.resolve(true)),
  getSupportedBiometryType: jest.fn(() => Promise.resolve('FaceID')),
}));

// Mock react-native-encrypted-storage
jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve('')),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-biometrics
jest.mock('react-native-biometrics', () => ({
  BiometryTypes: {
    TouchID: 'TouchID',
    FaceID: 'FaceID',
    Biometrics: 'Biometrics',
  },
  createKeys: jest.fn(() => Promise.resolve({ publicKey: 'mock-public-key' })),
  deleteKeys: jest.fn(() => Promise.resolve({ keysDeleted: true })),
  createSignature: jest.fn(() => Promise.resolve({ success: true, signature: 'mock-signature' })),
  simplePrompt: jest.fn(() => Promise.resolve({ success: true })),
  isSensorAvailable: jest.fn(() => Promise.resolve({ available: true, biometryType: 'FaceID' })),
}));

// Mock react-native-nfc-manager
jest.mock('react-native-nfc-manager', () => ({
  default: {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    isSupported: jest.fn(() => Promise.resolve(true)),
    isEnabled: jest.fn(() => Promise.resolve(true)),
    goToNfcSetting: jest.fn(() => Promise.resolve()),
    getLaunchTagEvent: jest.fn(() => Promise.resolve(null)),
    registerTagEvent: jest.fn(() => Promise.resolve()),
    unregisterTagEvent: jest.fn(() => Promise.resolve()),
    requestTechnology: jest.fn(() => Promise.resolve()),
    cancelTechnologyRequest: jest.fn(() => Promise.resolve()),
    closeSesssion: jest.fn(() => Promise.resolve()),
    onSessionClosedIOS: jest.fn(() => Promise.resolve()),
    setEventListener: jest.fn(),
  },
  NfcTech: {
    Ndef: 'Ndef',
    NfcA: 'NfcA',
    NfcB: 'NfcB',
    NfcF: 'NfcF',
    NfcV: 'NfcV',
    IsoDep: 'IsoDep',
    MifareClassic: 'MifareClassic',
    MifareUltralight: 'MifareUltralight',
  },
  NfcEvents: {
    DiscoverTag: 'DiscoverTag',
    SessionClosed: 'SessionClosed',
  },
}));

// Mock react-native-qrcode-scanner
jest.mock('react-native-qrcode-scanner', () => ({
  default: jest.fn().mockImplementation(() => ({
    reactivate: jest.fn(),
    fadeIn: jest.fn(),
  })),
}));

// Mock react-native-camera
jest.mock('react-native-camera', () => ({
  RNCamera: {
    Constants: {
      FlashMode: {
        torch: 'torch',
        on: 'on',
        off: 'off',
        auto: 'auto',
      },
      Type: {
        front: 'front',
        back: 'back',
      },
    },
    takePictureAsync: jest.fn(() => Promise.resolve({ uri: 'mock-uri' })),
  },
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(() => Promise.resolve('granted')),
  request: jest.fn(() => Promise.resolve('granted')),
  openSettings: jest.fn(() => Promise.resolve()),
  PERMISSIONS: {
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      NFC: 'android.permission.NFC',
    },
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
    },
  },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    LIMITED: 'limited',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
  },
}));

// Mock @stripe/stripe-react-native
jest.mock('@stripe/stripe-react-native', () => ({
  initStripe: jest.fn(() => Promise.resolve()),
  createPaymentMethod: jest.fn(() => Promise.resolve({ paymentMethod: { id: 'pm_test' } })),
  confirmPayment: jest.fn(() => Promise.resolve({ paymentIntent: { status: 'succeeded' } })),
  createToken: jest.fn(() => Promise.resolve({ token: { id: 'tok_test' } })),
}));

// Mock react-native-plaid-link-sdk
jest.mock('react-native-plaid-link-sdk', () => ({
  PlaidLink: {
    create: jest.fn(() => Promise.resolve()),
    open: jest.fn(() => Promise.resolve()),
    onSuccess: jest.fn(),
    onExit: jest.fn(),
  },
  LinkSuccess: jest.fn(),
  LinkExit: jest.fn(),
  LinkEvent: jest.fn(),
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(() => Promise.resolve('mock-device-id')),
  getVersion: jest.fn(() => '1.0.0'),
  getBuildNumber: jest.fn(() => '1'),
  getSystemVersion: jest.fn(() => '14.0'),
  getBrand: jest.fn(() => 'Apple'),
  getModel: jest.fn(() => 'iPhone'),
  getDeviceId: jest.fn(() => 'iPhone12,1'),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, type: 'wifi' })),
  addEventListener: jest.fn(() => () => {}),
}));

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
  HapticFeedbackTypes: {
    selection: 'selection',
    impactLight: 'impactLight',
    impactMedium: 'impactMedium',
    impactHeavy: 'impactHeavy',
    rigid: 'rigid',
    soft: 'soft',
    notificationSuccess: 'notificationSuccess',
    notificationWarning: 'notificationWarning',
    notificationError: 'notificationError',
  },
}));

// Mock crypto-js
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(() => ({
      ciphertext: { toString: jest.fn(() => 'encrypted') },
      tag: { toString: jest.fn(() => 'tag') },
    })),
    decrypt: jest.fn(() => ({ toString: jest.fn(() => 'decrypted') })),
  },
  PBKDF2: jest.fn(() => ({ toString: jest.fn(() => 'hashed') })),
  lib: {
    WordArray: {
      random: jest.fn(() => ({ toString: jest.fn(() => 'random') })),
    },
  },
  enc: {
    Base64: {
      parse: jest.fn(() => ({})),
    },
    Utf8: {},
  },
  mode: {
    GCM: {},
  },
  pad: {
    NoPadding: {},
  },
  algo: {
    SHA256: {},
  },
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.warn in tests unless explicitly testing warnings
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK',
  } as Response)
);

// Mock setTimeout and clearTimeout for timer tests
jest.useFakeTimers();

// Setup custom matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}