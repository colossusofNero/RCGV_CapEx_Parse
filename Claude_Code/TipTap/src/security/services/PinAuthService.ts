import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptionService from './EncryptionService';
import SecureStorageService from './SecureStorageService';

export interface PinValidationResult {
  isValid: boolean;
  attemptsRemaining?: number;
  isLocked?: boolean;
  unlockTime?: number;
}

export interface PinSetupResult {
  success: boolean;
  error?: string;
}

export interface PinConfig {
  length: number;
  maxAttempts: number;
  lockoutDurationMs: number;
  requireComplexPin: boolean;
}

class PinAuthService {
  private readonly STORAGE_KEYS = {
    PIN_HASH: 'pin_hash_secure',
    PIN_ATTEMPTS: 'pin_attempts',
    PIN_LOCKOUT: 'pin_lockout',
    PIN_CONFIG: 'pin_config'
  };

  private readonly DEFAULT_CONFIG: PinConfig = {
    length: 6,
    maxAttempts: 5,
    lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
    requireComplexPin: false
  };

  private pinConfig: PinConfig = this.DEFAULT_CONFIG;

  async initialize(): Promise<void> {
    await this.loadPinConfig();
  }

  async setupPin(pin: string, confirmPin: string): Promise<PinSetupResult> {
    if (pin !== confirmPin) {
      return {
        success: false,
        error: 'PIN confirmation does not match'
      };
    }

    const validation = this.validatePinFormat(pin);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    try {
      const deviceId = await this.getDeviceIdentifier();
      const { hash, salt } = await EncryptionService.hashPassword(pin + deviceId);

      const pinData = {
        hash,
        salt,
        createdAt: Date.now()
      };

      const success = await SecureStorageService.setSecureObject(
        this.STORAGE_KEYS.PIN_HASH,
        pinData,
        deviceId,
        { touchID: false }
      );

      if (success) {
        await this.clearPinAttempts();
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Failed to store PIN securely'
        };
      }
    } catch (error) {
      console.error('PIN setup error:', error);
      return {
        success: false,
        error: 'Failed to setup PIN'
      };
    }
  }

  async validatePin(pin: string): Promise<PinValidationResult> {
    try {
      const lockoutStatus = await this.checkLockoutStatus();
      if (lockoutStatus.isLocked) {
        return {
          isValid: false,
          isLocked: true,
          unlockTime: lockoutStatus.unlockTime
        };
      }

      const deviceId = await this.getDeviceIdentifier();
      const pinData = await SecureStorageService.getSecureObject(
        this.STORAGE_KEYS.PIN_HASH,
        deviceId
      );

      if (!pinData) {
        return {
          isValid: false,
          attemptsRemaining: this.pinConfig.maxAttempts
        };
      }

      const isValid = await EncryptionService.verifyPassword(
        pin + deviceId,
        pinData.hash,
        pinData.salt
      );

      if (isValid) {
        await this.clearPinAttempts();
        return { isValid: true };
      } else {
        const attempts = await this.incrementPinAttempts();
        const attemptsRemaining = this.pinConfig.maxAttempts - attempts;

        if (attemptsRemaining <= 0) {
          await this.lockPin();
          return {
            isValid: false,
            isLocked: true,
            attemptsRemaining: 0,
            unlockTime: Date.now() + this.pinConfig.lockoutDurationMs
          };
        }

        return {
          isValid: false,
          attemptsRemaining
        };
      }
    } catch (error) {
      console.error('PIN validation error:', error);
      return {
        isValid: false,
        attemptsRemaining: 0
      };
    }
  }

  async changePin(currentPin: string, newPin: string, confirmNewPin: string): Promise<PinSetupResult> {
    const currentValidation = await this.validatePin(currentPin);
    if (!currentValidation.isValid) {
      return {
        success: false,
        error: 'Current PIN is incorrect'
      };
    }

    return await this.setupPin(newPin, confirmNewPin);
  }

  async isPinSet(): Promise<boolean> {
    try {
      const deviceId = await this.getDeviceIdentifier();
      const pinData = await SecureStorageService.getSecureObject(
        this.STORAGE_KEYS.PIN_HASH,
        deviceId
      );
      return pinData !== null;
    } catch (error) {
      console.error('Error checking if PIN is set:', error);
      return false;
    }
  }

  async removePin(currentPin: string): Promise<boolean> {
    const validation = await this.validatePin(currentPin);
    if (!validation.isValid) {
      return false;
    }

    try {
      await SecureStorageService.removeItem(this.STORAGE_KEYS.PIN_HASH);
      await this.clearPinAttempts();
      await AsyncStorage.removeItem(this.STORAGE_KEYS.PIN_LOCKOUT);
      return true;
    } catch (error) {
      console.error('Error removing PIN:', error);
      return false;
    }
  }

  async getRemainingAttempts(): Promise<number> {
    try {
      const attemptsStr = await AsyncStorage.getItem(this.STORAGE_KEYS.PIN_ATTEMPTS);
      const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
      return Math.max(0, this.pinConfig.maxAttempts - attempts);
    } catch (error) {
      console.error('Error getting remaining attempts:', error);
      return this.pinConfig.maxAttempts;
    }
  }

  async updatePinConfig(newConfig: Partial<PinConfig>): Promise<void> {
    this.pinConfig = { ...this.pinConfig, ...newConfig };
    await AsyncStorage.setItem(this.STORAGE_KEYS.PIN_CONFIG, JSON.stringify(this.pinConfig));
  }

  private validatePinFormat(pin: string): { isValid: boolean; error?: string } {
    if (pin.length !== this.pinConfig.length) {
      return {
        isValid: false,
        error: `PIN must be exactly ${this.pinConfig.length} digits`
      };
    }

    if (!/^\d+$/.test(pin)) {
      return {
        isValid: false,
        error: 'PIN must contain only numbers'
      };
    }

    if (this.pinConfig.requireComplexPin) {
      if (this.isSequentialPin(pin) || this.isRepeatingPin(pin)) {
        return {
          isValid: false,
          error: 'PIN must not be sequential or repeating digits'
        };
      }
    }

    return { isValid: true };
  }

  private isSequentialPin(pin: string): boolean {
    const digits = pin.split('').map(Number);
    let isAscending = true;
    let isDescending = true;

    for (let i = 1; i < digits.length; i++) {
      if (digits[i] !== digits[i - 1] + 1) {
        isAscending = false;
      }
      if (digits[i] !== digits[i - 1] - 1) {
        isDescending = false;
      }
    }

    return isAscending || isDescending;
  }

  private isRepeatingPin(pin: string): boolean {
    return new Set(pin).size === 1;
  }

  private async incrementPinAttempts(): Promise<number> {
    try {
      const attemptsStr = await AsyncStorage.getItem(this.STORAGE_KEYS.PIN_ATTEMPTS);
      const attempts = attemptsStr ? parseInt(attemptsStr, 10) + 1 : 1;
      await AsyncStorage.setItem(this.STORAGE_KEYS.PIN_ATTEMPTS, attempts.toString());
      return attempts;
    } catch (error) {
      console.error('Error incrementing PIN attempts:', error);
      return 1;
    }
  }

  private async clearPinAttempts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.PIN_ATTEMPTS);
      await AsyncStorage.removeItem(this.STORAGE_KEYS.PIN_LOCKOUT);
    } catch (error) {
      console.error('Error clearing PIN attempts:', error);
    }
  }

  private async lockPin(): Promise<void> {
    try {
      const lockoutData = {
        lockedAt: Date.now(),
        unlockAt: Date.now() + this.pinConfig.lockoutDurationMs
      };
      await AsyncStorage.setItem(this.STORAGE_KEYS.PIN_LOCKOUT, JSON.stringify(lockoutData));
    } catch (error) {
      console.error('Error locking PIN:', error);
    }
  }

  private async checkLockoutStatus(): Promise<{ isLocked: boolean; unlockTime?: number }> {
    try {
      const lockoutStr = await AsyncStorage.getItem(this.STORAGE_KEYS.PIN_LOCKOUT);
      if (!lockoutStr) {
        return { isLocked: false };
      }

      const lockoutData = JSON.parse(lockoutStr);
      const now = Date.now();

      if (now >= lockoutData.unlockAt) {
        await AsyncStorage.removeItem(this.STORAGE_KEYS.PIN_LOCKOUT);
        await this.clearPinAttempts();
        return { isLocked: false };
      }

      return {
        isLocked: true,
        unlockTime: lockoutData.unlockAt
      };
    } catch (error) {
      console.error('Error checking lockout status:', error);
      return { isLocked: false };
    }
  }

  private async loadPinConfig(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem(this.STORAGE_KEYS.PIN_CONFIG);
      if (configStr) {
        const savedConfig = JSON.parse(configStr);
        this.pinConfig = { ...this.DEFAULT_CONFIG, ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load PIN config:', error);
    }
  }

  private async getDeviceIdentifier(): Promise<string> {
    try {
      const DeviceInfo = require('react-native-device-info');
      const deviceId = await DeviceInfo.getUniqueId();
      return deviceId;
    } catch (error) {
      console.warn('Could not get device ID, using fallback');
      return 'fallback_device_id';
    }
  }
}

export default new PinAuthService();