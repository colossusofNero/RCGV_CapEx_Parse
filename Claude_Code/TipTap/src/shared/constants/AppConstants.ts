export const APP_CONFIG = {
  name: 'TipTap',
  version: '1.0.0',
  bundleId: 'com.tiptap.app',

  // API Configuration
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
  },

  // Payment Configuration
  payment: {
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    minAmount: 0.01,
    maxAmount: 999999.99,
    defaultTipPercentages: [15, 18, 20, 25],
    maxTipPercentage: 100
  },

  // NFC Configuration
  nfc: {
    scanTimeoutMs: 30000,
    maxDataSize: 8192, // 8KB
    supportedTechTypes: ['Ndef', 'NfcA', 'NfcB', 'NfcF', 'NfcV', 'IsoDep', 'MifareClassic', 'MifareUltralight']
  },

  // QR Code Configuration
  qr: {
    scanTimeoutMs: 30000,
    defaultGenerationOptions: {
      size: 256,
      backgroundColor: '#FFFFFF',
      foregroundColor: '#000000',
      errorCorrectionLevel: 'M' as const,
      margin: 4
    }
  },

  // Storage Configuration
  storage: {
    maxTransactionHistory: 1000,
    cacheExpirationDays: 30,
    encryptSensitiveData: true
  },

  // UI Configuration
  ui: {
    animationDuration: 300,
    debounceDelay: 500,
    toastDuration: 3000,
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
      background: '#F2F2F7',
      surface: '#FFFFFF',
      text: '#000000',
      textSecondary: '#8E8E93'
    }
  }
} as const;

export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_UNAVAILABLE: 'Network connection is unavailable. Please check your internet connection.',
  REQUEST_TIMEOUT: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',

  // Payment errors
  PAYMENT_FAILED: 'Payment processing failed. Please try again.',
  INSUFFICIENT_FUNDS: 'Insufficient funds. Please use a different payment method.',
  CARD_DECLINED: 'Your card was declined. Please contact your bank or try a different card.',
  INVALID_AMOUNT: 'Invalid payment amount. Please enter a valid amount.',
  GATEWAY_ERROR: 'Payment gateway error. Please try again later.',

  // NFC errors
  NFC_NOT_SUPPORTED: 'NFC is not supported on this device.',
  NFC_NOT_ENABLED: 'NFC is not enabled. Please enable NFC in device settings.',
  NFC_PERMISSION_DENIED: 'NFC permission is required to scan tags.',
  NFC_SCAN_FAILED: 'Failed to scan NFC tag. Please try again.',
  NFC_WRITE_FAILED: 'Failed to write to NFC tag. Please try again.',

  // QR Code errors
  CAMERA_PERMISSION_DENIED: 'Camera permission is required to scan QR codes.',
  QR_SCAN_FAILED: 'Failed to scan QR code. Please try again.',
  QR_GENERATION_FAILED: 'Failed to generate QR code. Please try again.',
  INVALID_QR_DATA: 'Invalid QR code data.',

  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  VALIDATION_ERROR: 'Invalid input. Please check your data and try again.',
  PERMISSION_DENIED: 'Permission denied. Please grant the required permissions.',
} as const;

export const VALIDATION_RULES = {
  // Amount validation
  amount: {
    min: APP_CONFIG.payment.minAmount,
    max: APP_CONFIG.payment.maxAmount,
    decimalPlaces: 2
  },

  // Tip percentage validation
  tipPercentage: {
    min: 0,
    max: APP_CONFIG.payment.maxTipPercentage
  },

  // Currency validation
  currency: {
    length: 3,
    format: /^[A-Z]{3}$/
  },

  // Transaction ID validation
  transactionId: {
    minLength: 10,
    maxLength: 50,
    format: /^[a-zA-Z0-9_-]+$/
  }
} as const;

export const STORAGE_KEYS = {
  TRANSACTIONS: '@tiptap_transactions',
  MERCHANT_INDEX: '@tiptap_merchant_index',
  USER_PREFERENCES: '@tiptap_user_preferences',
  CACHED_GATEWAYS: '@tiptap_cached_gateways',
  APP_STATE: '@tiptap_app_state'
} as const;

export const EVENT_NAMES = {
  // Payment events
  PAYMENT_STARTED: 'payment_started',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_CANCELLED: 'payment_cancelled',

  // NFC events
  NFC_TAG_DISCOVERED: 'nfc_tag_discovered',
  NFC_SCAN_STARTED: 'nfc_scan_started',
  NFC_SCAN_STOPPED: 'nfc_scan_stopped',

  // QR Code events
  QR_CODE_SCANNED: 'qr_code_scanned',
  QR_SCAN_STARTED: 'qr_scan_started',
  QR_SCAN_STOPPED: 'qr_scan_stopped',

  // App events
  APP_FOREGROUND: 'app_foreground',
  APP_BACKGROUND: 'app_background'
} as const;