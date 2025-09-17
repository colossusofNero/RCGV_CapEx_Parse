import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import {
  BiometricType,
  BiometricError,
  BiometricAuthResult,
  BiometricAvailability,
  BiometricPromptOptions
} from '../types/BiometricTypes';

class BiometricAuthService {
  private rnBiometrics: ReactNativeBiometrics;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true
    });
  }

  async checkBiometricAvailability(): Promise<BiometricAvailability> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();

      if (!available) {
        return {
          isAvailable: false,
          biometryType: BiometricType.NONE,
          error: BiometricError.BIOMETRIC_UNAVAILABLE
        };
      }

      const mappedType = this.mapBiometryType(biometryType);
      return {
        isAvailable: true,
        biometryType: mappedType
      };
    } catch (error) {
      return {
        isAvailable: false,
        biometryType: BiometricType.NONE,
        error: BiometricError.BIOMETRIC_UNKNOWN_ERROR
      };
    }
  }

  async authenticateWithBiometrics(options: BiometricPromptOptions): Promise<BiometricAuthResult> {
    try {
      const availability = await this.checkBiometricAvailability();

      if (!availability.isAvailable) {
        return {
          success: false,
          error: availability.error,
          message: 'Biometric authentication is not available'
        };
      }

      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage: options.promptMessage,
        cancelButtonText: options.cancelButtonText || 'Cancel',
        fallbackPromptMessage: options.fallbackPromptMessage
      });

      if (success) {
        return {
          success: true,
          message: 'Biometric authentication successful'
        };
      } else {
        return {
          success: false,
          error: BiometricError.USER_CANCEL,
          message: 'Biometric authentication was cancelled'
        };
      }
    } catch (error: any) {
      const mappedError = this.mapBiometricError(error);
      return {
        success: false,
        error: mappedError,
        message: error.message || 'Biometric authentication failed'
      };
    }
  }

  async createKeys(): Promise<{ publicKey: string }> {
    try {
      const result = await this.rnBiometrics.createKeys();
      return { publicKey: result.publicKey };
    } catch (error: any) {
      throw new Error(`Failed to create biometric keys: ${error.message}`);
    }
  }

  async deleteKeys(): Promise<void> {
    try {
      await this.rnBiometrics.deleteKeys();
    } catch (error: any) {
      throw new Error(`Failed to delete biometric keys: ${error.message}`);
    }
  }

  async biometricKeysExist(): Promise<boolean> {
    try {
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();
      return keysExist;
    } catch (error) {
      return false;
    }
  }

  private mapBiometryType(biometryType: BiometryTypes | undefined): BiometricType {
    switch (biometryType) {
      case BiometryTypes.TouchID:
        return BiometricType.TOUCH_ID;
      case BiometryTypes.FaceID:
        return BiometricType.FACE_ID;
      case BiometryTypes.Biometrics:
        return BiometricType.FINGERPRINT;
      default:
        return BiometricType.NONE;
    }
  }

  private mapBiometricError(error: any): BiometricError {
    if (error.name === 'UserCancel') {
      return BiometricError.USER_CANCEL;
    }
    if (error.name === 'UserFallback') {
      return BiometricError.USER_FALLBACK;
    }
    if (error.name === 'SystemCancel') {
      return BiometricError.SYSTEM_CANCEL;
    }
    if (error.name === 'BiometricUnavailable') {
      return BiometricError.BIOMETRIC_UNAVAILABLE;
    }
    if (error.name === 'BiometricNotEnrolled') {
      return BiometricError.BIOMETRIC_NOT_ENROLLED;
    }
    if (error.name === 'BiometricLockout') {
      return BiometricError.BIOMETRIC_LOCKOUT;
    }
    if (error.name === 'BiometricLockoutPermanent') {
      return BiometricError.BIOMETRIC_LOCKOUT_PERMANENT;
    }
    return BiometricError.BIOMETRIC_UNKNOWN_ERROR;
  }
}

export default new BiometricAuthService();