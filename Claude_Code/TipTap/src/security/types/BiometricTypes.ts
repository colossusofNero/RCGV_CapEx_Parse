export enum BiometricType {
  TOUCH_ID = 'TouchID',
  FACE_ID = 'FaceID',
  FINGERPRINT = 'Fingerprint',
  NONE = 'None'
}

export enum BiometricError {
  BIOMETRIC_UNKNOWN_ERROR = 'BiometricUnknownError',
  BIOMETRIC_UNAVAILABLE = 'BiometricUnavailable',
  BIOMETRIC_NOT_SUPPORTED = 'BiometricNotSupported',
  BIOMETRIC_NOT_ENROLLED = 'BiometricNotEnrolled',
  BIOMETRIC_LOCKOUT = 'BiometricLockout',
  BIOMETRIC_LOCKOUT_PERMANENT = 'BiometricLockoutPermanent',
  USER_CANCEL = 'UserCancel',
  USER_FALLBACK = 'UserFallback',
  SYSTEM_CANCEL = 'SystemCancel',
  PASSCODE_NOT_SET = 'PasscodeNotSet',
  BIOMETRIC_PIN_OR_PASSWORD_NOT_SET = 'BiometricPinOrPasswordNotSet'
}

export interface BiometricAuthResult {
  success: boolean;
  error?: BiometricError;
  message?: string;
}

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: BiometricType;
  error?: BiometricError;
}

export interface BiometricPromptOptions {
  promptMessage: string;
  cancelButtonText?: string;
  fallbackPromptMessage?: string;
  allowDeviceCredentials?: boolean;
}