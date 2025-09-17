import BiometricAuthService from './services/BiometricAuthService';
import EncryptionService from './services/EncryptionService';
import SecureStorageService from './services/SecureStorageService';
import SessionManagementService from './services/SessionManagementService';
import PinAuthService from './services/PinAuthService';
import CertificatePinningService from './services/CertificatePinningService';
import FraudDetectionService from './services/FraudDetectionService';

import {
  BiometricAuthResult,
  BiometricAvailability,
  BiometricPromptOptions
} from './types/BiometricTypes';
import { PinValidationResult, PinSetupResult } from './services/PinAuthService';
import { SessionState, SessionConfig } from './services/SessionManagementService';
import { FraudRiskScore } from './services/FraudDetectionService';
import { PinningConfig } from './services/CertificatePinningService';

export interface SecurityInitializationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export interface PaymentSecurityCheck {
  biometricsPassed: boolean;
  sessionValid: boolean;
  fraudRiskAcceptable: boolean;
  overallApproved: boolean;
  riskScore?: FraudRiskScore;
  requiresAdditionalAuth?: boolean;
}

export interface SecurityConfig {
  requireBiometricsForPayments: boolean;
  requireBiometricsForAppAccess: boolean;
  enableFraudDetection: boolean;
  enableCertificatePinning: boolean;
  sessionTimeoutMinutes: number;
  autoLockTimeoutMinutes: number;
  pinRequired: boolean;
  pinLength: number;
  maxPinAttempts: number;
}

class SecurityManager {
  private isInitialized = false;
  private securityConfig: SecurityConfig = {
    requireBiometricsForPayments: true,
    requireBiometricsForAppAccess: false,
    enableFraudDetection: true,
    enableCertificatePinning: true,
    sessionTimeoutMinutes: 30,
    autoLockTimeoutMinutes: 5,
    pinRequired: false,
    pinLength: 6,
    maxPinAttempts: 5
  };

  async initialize(): Promise<SecurityInitializationResult> {
    const result: SecurityInitializationResult = {
      success: true,
      errors: [],
      warnings: []
    };

    try {
      // Initialize session management first
      await SessionManagementService.initialize();

      // Initialize biometric auth
      try {
        const biometricAvailability = await BiometricAuthService.checkBiometricAvailability();
        if (!biometricAvailability.isAvailable) {
          result.warnings.push('Biometric authentication not available on this device');
        }
      } catch (error) {
        result.warnings.push(`Biometric initialization warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Initialize PIN auth
      await PinAuthService.initialize();

      // Initialize fraud detection
      if (this.securityConfig.enableFraudDetection) {
        await FraudDetectionService.initialize();
      }

      // Initialize certificate pinning
      if (this.securityConfig.enableCertificatePinning) {
        try {
          const defaultConfigs = CertificatePinningService.getDefaultPaymentProcessorConfigs();
          await CertificatePinningService.initialize(defaultConfigs);
        } catch (error) {
          result.errors.push(`Certificate pinning initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.success = false;
        }
      }

      // Configure session management
      await SessionManagementService.updateSessionConfig({
        sessionTimeoutMs: this.securityConfig.sessionTimeoutMinutes * 60 * 1000,
        autoLockTimeoutMs: this.securityConfig.autoLockTimeoutMinutes * 60 * 1000,
        requireBiometricForPayments: this.securityConfig.requireBiometricsForPayments,
        requireBiometricAfterBackground: this.securityConfig.requireBiometricsForAppAccess
      });

      // Configure PIN auth
      await PinAuthService.updatePinConfig({
        length: this.securityConfig.pinLength,
        maxAttempts: this.securityConfig.maxPinAttempts,
        lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
        requireComplexPin: true
      });

      this.isInitialized = true;

    } catch (error) {
      result.success = false;
      result.errors.push(`Security initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  async authenticateForPayment(
    transactionId: string,
    amount: number,
    merchantId?: string
  ): Promise<PaymentSecurityCheck> {
    if (!this.isInitialized) {
      throw new Error('SecurityManager not initialized');
    }

    const result: PaymentSecurityCheck = {
      biometricsPassed: false,
      sessionValid: false,
      fraudRiskAcceptable: false,
      overallApproved: false
    };

    // Check session validity
    result.sessionValid = SessionManagementService.isSessionActive();

    if (!result.sessionValid) {
      return result;
    }

    // Fraud detection check
    if (this.securityConfig.enableFraudDetection) {
      try {
        const riskScore = await FraudDetectionService.analyzeTransaction(
          transactionId,
          amount,
          merchantId
        );

        result.riskScore = riskScore;
        result.fraudRiskAcceptable = !riskScore.shouldBlock;
        result.requiresAdditionalAuth = riskScore.requireAdditionalAuth;

        if (riskScore.shouldBlock) {
          return result;
        }
      } catch (error) {
        console.error('Fraud detection failed:', error);
        // Continue with payment if fraud detection fails (fail open)
        result.fraudRiskAcceptable = true;
      }
    } else {
      result.fraudRiskAcceptable = true;
    }

    // Biometric/PIN authentication
    if (this.securityConfig.requireBiometricsForPayments || result.requiresAdditionalAuth) {
      try {
        result.biometricsPassed = await SessionManagementService.requireBiometricForPayment();

        if (!result.biometricsPassed && this.securityConfig.pinRequired) {
          // Fallback to PIN authentication would be handled by the UI
          result.biometricsPassed = false;
        }
      } catch (error) {
        console.error('Payment authentication failed:', error);
        result.biometricsPassed = false;
      }
    } else {
      result.biometricsPassed = true;
    }

    result.overallApproved = result.sessionValid &&
                           result.fraudRiskAcceptable &&
                           result.biometricsPassed;

    return result;
  }

  async authenticateWithBiometrics(options: BiometricPromptOptions): Promise<BiometricAuthResult> {
    return BiometricAuthService.authenticateWithBiometrics(options);
  }

  async checkBiometricAvailability(): Promise<BiometricAvailability> {
    return BiometricAuthService.checkBiometricAvailability();
  }

  async authenticateWithPIN(pin: string): Promise<PinValidationResult> {
    return PinAuthService.validatePin(pin);
  }

  async setupPIN(pin: string, confirmPin: string): Promise<PinSetupResult> {
    return PinAuthService.setupPin(pin, confirmPin);
  }

  async startSession(userId: string): Promise<string> {
    return SessionManagementService.startSession(userId);
  }

  async endSession(): Promise<void> {
    await SessionManagementService.endSession();
  }

  async lockSession(): Promise<void> {
    await SessionManagementService.lockSession();
  }

  async unlockSession(): Promise<boolean> {
    return SessionManagementService.unlockSession();
  }

  getSessionState(): SessionState | null {
    return SessionManagementService.getSessionState();
  }

  updateLastActivity(): void {
    SessionManagementService.updateLastActivity();
  }

  async encryptSensitiveData(data: string, password: string): Promise<any> {
    return EncryptionService.encrypt(data, password);
  }

  async decryptSensitiveData(encryptedData: any, password: string): Promise<string> {
    return EncryptionService.decrypt(encryptedData, password);
  }

  async storeSecureData(key: string, data: any, password: string): Promise<boolean> {
    return SecureStorageService.setSecureObject(key, data, password, { touchID: true });
  }

  async retrieveSecureData<T>(key: string, password: string): Promise<T | null> {
    return SecureStorageService.getSecureObject<T>(key, password, { touchID: true });
  }

  async makeSecureAPICall(url: string, options?: RequestInit): Promise<Response> {
    return CertificatePinningService.makeSecureRequest(url, options);
  }

  async makeSecurePaymentCall(url: string, paymentData: any, options?: RequestInit): Promise<Response> {
    return CertificatePinningService.makeSecurePaymentRequest(url, paymentData, options);
  }

  async blockDevice(deviceId: string): Promise<void> {
    await FraudDetectionService.blockDevice(deviceId);
  }

  async updateSecurityConfig(config: Partial<SecurityConfig>): Promise<void> {
    this.securityConfig = { ...this.securityConfig, ...config };

    // Apply configuration to individual services
    if (config.sessionTimeoutMinutes !== undefined || config.autoLockTimeoutMinutes !== undefined) {
      await SessionManagementService.updateSessionConfig({
        sessionTimeoutMs: this.securityConfig.sessionTimeoutMinutes * 60 * 1000,
        autoLockTimeoutMs: this.securityConfig.autoLockTimeoutMinutes * 60 * 1000,
        requireBiometricForPayments: this.securityConfig.requireBiometricsForPayments,
        requireBiometricAfterBackground: this.securityConfig.requireBiometricsForAppAccess
      });
    }

    if (config.pinLength !== undefined || config.maxPinAttempts !== undefined) {
      await PinAuthService.updatePinConfig({
        length: this.securityConfig.pinLength,
        maxAttempts: this.securityConfig.maxPinAttempts,
        lockoutDurationMs: 30 * 60 * 1000,
        requireComplexPin: true
      });
    }
  }

  getSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }

  isSecurityInitialized(): boolean {
    return this.isInitialized;
  }

  async addSessionEventListener(listener: (eventType: string, data?: any) => void): Promise<void> {
    SessionManagementService.addEventListener(listener);
  }

  async removeSessionEventListener(listener: (eventType: string, data?: any) => void): Promise<void> {
    SessionManagementService.removeEventListener(listener);
  }

  async addCertificatePin(config: PinningConfig): Promise<void> {
    await CertificatePinningService.addPin(config);
  }

  async getFraudRiskScore(transactionId: string, amount: number): Promise<FraudRiskScore> {
    return FraudDetectionService.analyzeTransaction(transactionId, amount);
  }

  async cleanup(): Promise<void> {
    await SessionManagementService.cleanup();
    await CertificatePinningService.clearAllPins();
    this.isInitialized = false;
  }
}

export default new SecurityManager();