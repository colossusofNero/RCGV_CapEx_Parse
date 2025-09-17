import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

export interface TransactionAttempt {
  id: string;
  amount: number;
  timestamp: number;
  location?: GeolocationPosition;
  deviceFingerprint: DeviceFingerprint;
  ipAddress?: string;
  merchantId?: string;
}

export interface DeviceFingerprint {
  deviceId: string;
  brand: string;
  model: string;
  systemVersion: string;
  buildId: string;
  userAgent: string;
  screenDensity?: number;
  screenResolution?: string;
  timezone: string;
  locale: string;
  batteryLevel?: number;
  isEmulator: boolean;
  hasNotch?: boolean;
}

export interface VelocityRule {
  name: string;
  timeWindowMs: number;
  maxTransactions: number;
  maxAmount: number;
  enabled: boolean;
}

export interface LocationRule {
  name: string;
  allowedCountries?: string[];
  blockedCountries?: string[];
  maxDistanceFromPreviousMiles?: number;
  minTimeBetweenLocationsMins?: number;
  enabled: boolean;
}

export interface FraudRiskScore {
  score: number; // 0-100, where 100 is highest risk
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
  shouldBlock: boolean;
  requireAdditionalAuth: boolean;
}

export interface FraudDetectionConfig {
  velocityRules: VelocityRule[];
  locationRules: LocationRule[];
  deviceFingerprintingEnabled: boolean;
  locationTrackingEnabled: boolean;
  minimumRiskScoreToBlock: number;
  minimumRiskScoreForAdditionalAuth: number;
}

class FraudDetectionService {
  private readonly STORAGE_KEYS = {
    TRANSACTION_HISTORY: 'fraud_transaction_history',
    DEVICE_FINGERPRINT: 'fraud_device_fingerprint',
    FRAUD_CONFIG: 'fraud_detection_config',
    BLOCKED_DEVICES: 'fraud_blocked_devices'
  };

  private readonly DEFAULT_CONFIG: FraudDetectionConfig = {
    velocityRules: [
      {
        name: 'hourly_transaction_count',
        timeWindowMs: 60 * 60 * 1000, // 1 hour
        maxTransactions: 10,
        maxAmount: 500,
        enabled: true
      },
      {
        name: 'daily_transaction_count',
        timeWindowMs: 24 * 60 * 60 * 1000, // 24 hours
        maxTransactions: 50,
        maxAmount: 2000,
        enabled: true
      },
      {
        name: 'burst_protection',
        timeWindowMs: 5 * 60 * 1000, // 5 minutes
        maxTransactions: 3,
        maxAmount: 100,
        enabled: true
      }
    ],
    locationRules: [
      {
        name: 'country_restriction',
        allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE'],
        enabled: true
      },
      {
        name: 'travel_velocity',
        maxDistanceFromPreviousMiles: 500,
        minTimeBetweenLocationsMins: 60,
        enabled: true
      }
    ],
    deviceFingerprintingEnabled: true,
    locationTrackingEnabled: true,
    minimumRiskScoreToBlock: 85,
    minimumRiskScoreForAdditionalAuth: 60
  };

  private config: FraudDetectionConfig = this.DEFAULT_CONFIG;
  private cachedDeviceFingerprint: DeviceFingerprint | null = null;

  async initialize(): Promise<void> {
    await this.loadConfig();
    await this.loadDeviceFingerprint();
  }

  async analyzeTransaction(
    transactionId: string,
    amount: number,
    merchantId?: string
  ): Promise<FraudRiskScore> {
    const timestamp = Date.now();
    const location = this.config.locationTrackingEnabled ? await this.getCurrentLocation() : undefined;
    const deviceFingerprint = await this.getDeviceFingerprint();

    const transactionAttempt: TransactionAttempt = {
      id: transactionId,
      amount,
      timestamp,
      location,
      deviceFingerprint,
      merchantId
    };

    // Store the transaction attempt
    await this.storeTransactionAttempt(transactionAttempt);

    // Calculate risk score
    const riskScore = await this.calculateRiskScore(transactionAttempt);

    return riskScore;
  }

  async calculateRiskScore(transaction: TransactionAttempt): Promise<FraudRiskScore> {
    let score = 0;
    const reasons: string[] = [];

    // Velocity checks
    if (this.config.velocityRules.some(rule => rule.enabled)) {
      const velocityScore = await this.checkVelocityRules(transaction);
      score += velocityScore.score;
      reasons.push(...velocityScore.reasons);
    }

    // Location checks
    if (this.config.locationTrackingEnabled && transaction.location) {
      const locationScore = await this.checkLocationRules(transaction);
      score += locationScore.score;
      reasons.push(...locationScore.reasons);
    }

    // Device fingerprint checks
    if (this.config.deviceFingerprintingEnabled) {
      const deviceScore = await this.checkDeviceRules(transaction);
      score += deviceScore.score;
      reasons.push(...deviceScore.reasons);
    }

    // Determine risk level and actions
    let level: FraudRiskScore['level'] = 'LOW';
    let shouldBlock = false;
    let requireAdditionalAuth = false;

    if (score >= this.config.minimumRiskScoreToBlock) {
      level = 'CRITICAL';
      shouldBlock = true;
    } else if (score >= this.config.minimumRiskScoreForAdditionalAuth) {
      level = score >= 75 ? 'HIGH' : 'MEDIUM';
      requireAdditionalAuth = true;
    }

    return {
      score: Math.min(100, score),
      level,
      reasons,
      shouldBlock,
      requireAdditionalAuth
    };
  }

  private async checkVelocityRules(transaction: TransactionAttempt): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    const history = await this.getTransactionHistory();

    for (const rule of this.config.velocityRules.filter(r => r.enabled)) {
      const cutoffTime = transaction.timestamp - rule.timeWindowMs;
      const recentTransactions = history.filter(t => t.timestamp >= cutoffTime);

      const transactionCount = recentTransactions.length;
      const totalAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0);

      // Check transaction count
      if (transactionCount >= rule.maxTransactions) {
        const excess = transactionCount - rule.maxTransactions;
        const penaltyScore = Math.min(30, excess * 10);
        score += penaltyScore;
        reasons.push(`Exceeded ${rule.name} transaction limit: ${transactionCount}/${rule.maxTransactions}`);
      }

      // Check amount limit
      if (totalAmount >= rule.maxAmount) {
        const excessPercentage = (totalAmount - rule.maxAmount) / rule.maxAmount;
        const penaltyScore = Math.min(25, excessPercentage * 20);
        score += penaltyScore;
        reasons.push(`Exceeded ${rule.name} amount limit: $${totalAmount}/$${rule.maxAmount}`);
      }
    }

    return { score, reasons };
  }

  private async checkLocationRules(transaction: TransactionAttempt): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    if (!transaction.location) {
      return { score, reasons };
    }

    for (const rule of this.config.locationRules.filter(r => r.enabled)) {
      if (rule.name === 'country_restriction') {
        // Note: You would need a reverse geocoding service to get country from coordinates
        // This is a simplified implementation
        const country = await this.getCountryFromCoordinates(transaction.location);

        if (rule.blockedCountries?.includes(country)) {
          score += 50;
          reasons.push(`Transaction from blocked country: ${country}`);
        } else if (rule.allowedCountries && !rule.allowedCountries.includes(country)) {
          score += 30;
          reasons.push(`Transaction from non-whitelisted country: ${country}`);
        }
      }

      if (rule.name === 'travel_velocity' && rule.maxDistanceFromPreviousMiles) {
        const previousTransaction = await this.getPreviousTransactionWithLocation();

        if (previousTransaction?.location) {
          const distance = this.calculateDistance(
            transaction.location.coords,
            previousTransaction.location.coords
          );

          const timeDiffMins = (transaction.timestamp - previousTransaction.timestamp) / (1000 * 60);

          if (distance > rule.maxDistanceFromPreviousMiles &&
              timeDiffMins < (rule.minTimeBetweenLocationsMins || 0)) {
            score += 40;
            reasons.push(`Impossible travel: ${distance} miles in ${timeDiffMins} minutes`);
          }
        }
      }
    }

    return { score, reasons };
  }

  private async checkDeviceRules(transaction: TransactionAttempt): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // Check if device is blocked
    const blockedDevices = await this.getBlockedDevices();
    if (blockedDevices.includes(transaction.deviceFingerprint.deviceId)) {
      score += 100;
      reasons.push('Transaction from blocked device');
      return { score, reasons };
    }

    // Check for emulator
    if (transaction.deviceFingerprint.isEmulator) {
      score += 35;
      reasons.push('Transaction from emulated device');
    }

    // Check for device fingerprint consistency
    const storedFingerprint = await this.getStoredDeviceFingerprint();
    if (storedFingerprint && this.hasSignificantFingerprintChange(storedFingerprint, transaction.deviceFingerprint)) {
      score += 25;
      reasons.push('Device fingerprint inconsistency detected');
    }

    return { score, reasons };
  }

  private async getDeviceFingerprint(): Promise<DeviceFingerprint> {
    if (this.cachedDeviceFingerprint) {
      return this.cachedDeviceFingerprint;
    }

    const fingerprint: DeviceFingerprint = {
      deviceId: await DeviceInfo.getUniqueId(),
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      systemVersion: DeviceInfo.getSystemVersion(),
      buildId: await DeviceInfo.getBuildId(),
      userAgent: await DeviceInfo.getUserAgent(),
      timezone: DeviceInfo.getTimezone(),
      locale: await DeviceInfo.getDeviceLocale(),
      isEmulator: await DeviceInfo.isEmulator(),
      hasNotch: DeviceInfo.hasNotch()
    };

    this.cachedDeviceFingerprint = fingerprint;
    await this.storeDeviceFingerprint(fingerprint);

    return fingerprint;
  }

  private async getCurrentLocation(): Promise<GeolocationPosition | undefined> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return undefined;
        }
      }

      return new Promise((resolve) => {
        Geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => {
            console.warn('Location error:', error);
            resolve(undefined);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      });
    } catch (error) {
      console.warn('Failed to get location:', error);
      return undefined;
    }
  }

  private async getCountryFromCoordinates(location: GeolocationPosition): Promise<string> {
    // This would typically use a reverse geocoding service
    // For now, return a placeholder
    return 'US';
  }

  private calculateDistance(coord1: GeolocationCoordinates, coord2: GeolocationCoordinates): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(coord2.latitude - coord1.latitude);
    const dLon = this.toRad(coord2.longitude - coord1.longitude);
    const lat1 = this.toRad(coord1.latitude);
    const lat2 = this.toRad(coord2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  private hasSignificantFingerprintChange(stored: DeviceFingerprint, current: DeviceFingerprint): boolean {
    return stored.deviceId !== current.deviceId ||
           stored.buildId !== current.buildId ||
           stored.systemVersion !== current.systemVersion;
  }

  // Storage methods
  private async storeTransactionAttempt(transaction: TransactionAttempt): Promise<void> {
    try {
      const history = await this.getTransactionHistory();
      history.push(transaction);

      // Keep only last 1000 transactions
      const trimmedHistory = history.slice(-1000);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.TRANSACTION_HISTORY,
        JSON.stringify(trimmedHistory)
      );
    } catch (error) {
      console.error('Failed to store transaction attempt:', error);
    }
  }

  private async getTransactionHistory(): Promise<TransactionAttempt[]> {
    try {
      const historyStr = await AsyncStorage.getItem(this.STORAGE_KEYS.TRANSACTION_HISTORY);
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  private async getPreviousTransactionWithLocation(): Promise<TransactionAttempt | undefined> {
    const history = await this.getTransactionHistory();
    const transactionsWithLocation = history.filter(t => t.location);
    return transactionsWithLocation[transactionsWithLocation.length - 1];
  }

  private async storeDeviceFingerprint(fingerprint: DeviceFingerprint): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.DEVICE_FINGERPRINT,
        JSON.stringify(fingerprint)
      );
    } catch (error) {
      console.error('Failed to store device fingerprint:', error);
    }
  }

  private async getStoredDeviceFingerprint(): Promise<DeviceFingerprint | null> {
    try {
      const fingerprintStr = await AsyncStorage.getItem(this.STORAGE_KEYS.DEVICE_FINGERPRINT);
      return fingerprintStr ? JSON.parse(fingerprintStr) : null;
    } catch (error) {
      console.error('Failed to get stored device fingerprint:', error);
      return null;
    }
  }

  private async loadDeviceFingerprint(): Promise<void> {
    this.cachedDeviceFingerprint = await this.getStoredDeviceFingerprint();
  }

  private async getBlockedDevices(): Promise<string[]> {
    try {
      const blockedStr = await AsyncStorage.getItem(this.STORAGE_KEYS.BLOCKED_DEVICES);
      return blockedStr ? JSON.parse(blockedStr) : [];
    } catch (error) {
      console.error('Failed to get blocked devices:', error);
      return [];
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem(this.STORAGE_KEYS.FRAUD_CONFIG);
      if (configStr) {
        const savedConfig = JSON.parse(configStr);
        this.config = { ...this.DEFAULT_CONFIG, ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load fraud detection config:', error);
    }
  }

  // Public configuration methods
  async updateConfig(newConfig: Partial<FraudDetectionConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await AsyncStorage.setItem(this.STORAGE_KEYS.FRAUD_CONFIG, JSON.stringify(this.config));
  }

  async blockDevice(deviceId: string): Promise<void> {
    const blockedDevices = await this.getBlockedDevices();
    if (!blockedDevices.includes(deviceId)) {
      blockedDevices.push(deviceId);
      await AsyncStorage.setItem(this.STORAGE_KEYS.BLOCKED_DEVICES, JSON.stringify(blockedDevices));
    }
  }

  async unblockDevice(deviceId: string): Promise<void> {
    const blockedDevices = await this.getBlockedDevices();
    const filteredDevices = blockedDevices.filter(id => id !== deviceId);
    await AsyncStorage.setItem(this.STORAGE_KEYS.BLOCKED_DEVICES, JSON.stringify(filteredDevices));
  }

  getConfig(): FraudDetectionConfig {
    return { ...this.config };
  }
}

export default new FraudDetectionService();