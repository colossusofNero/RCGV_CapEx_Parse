import {performanceMonitor} from '../utils/performanceMonitor';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import {Alert} from 'react-native';

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface PaymentMetrics {
  payment_attempts_total: number;
  payment_success_total: number;
  payment_failures_total: number;
  payment_method: 'nfc' | 'qr' | 'card' | 'ach';
  failure_reason?: string;
}

export interface TransactionMetrics {
  transaction_duration_seconds: number;
  transaction_amount: number;
  transaction_status: 'success' | 'failed' | 'pending';
  transaction_type: 'tip' | 'payment';
  geo_region?: string;
}

export interface UserActivityMetrics {
  user_activity_total: number;
  user_id: string;
  activity_type: 'login' | 'transaction' | 'view' | 'interaction';
  screen_name?: string;
}

export interface ErrorMetrics {
  error_logs_total: number;
  error_message: string;
  error_level: 'error' | 'warning' | 'info';
  feature: string;
  stack_trace?: string;
}

class MonitoringService {
  private metrics: MetricData[] = [];
  private batchSize: number = 50;
  private flushInterval: number = 30000; // 30 seconds
  private apiEndpoint: string = '';
  private deviceInfo: any = {};
  private isInitialized: boolean = false;

  constructor() {
    this.initializeDeviceInfo();
    this.startPeriodicFlush();
  }

  async initialize(config: {apiEndpoint: string; batchSize?: number; flushInterval?: number}) {
    this.apiEndpoint = config.apiEndpoint;
    this.batchSize = config.batchSize || 50;
    this.flushInterval = config.flushInterval || 30000;

    await this.initializeDeviceInfo();
    this.isInitialized = true;

    console.log('MonitoringService initialized');
  }

  private async initializeDeviceInfo() {
    try {
      this.deviceInfo = {
        deviceId: await DeviceInfo.getUniqueId(),
        appVersion: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        systemName: DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
        deviceName: await DeviceInfo.getDeviceName(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
      };
    } catch (error) {
      console.error('Failed to initialize device info:', error);
    }
  }

  private createMetric(name: string, value: number, tags?: Record<string, string>, metadata?: Record<string, any>): MetricData {
    return {
      name,
      value,
      timestamp: Date.now(),
      tags: {
        ...this.getDefaultTags(),
        ...tags,
      },
      metadata,
    };
  }

  private getDefaultTags(): Record<string, string> {
    return {
      app_version: this.deviceInfo.appVersion || 'unknown',
      platform: this.deviceInfo.systemName || 'unknown',
      device_model: this.deviceInfo.model || 'unknown',
      environment: __DEV__ ? 'development' : 'production',
    };
  }

  // Payment Metrics
  recordPaymentAttempt(method: PaymentMetrics['payment_method'], amount: number, metadata?: Record<string, any>) {
    const metric = this.createMetric(
      'payment_attempts_total',
      1,
      { payment_method: method },
      { amount, ...metadata }
    );
    this.addMetric(metric);
  }

  recordPaymentSuccess(method: PaymentMetrics['payment_method'], amount: number, duration: number, metadata?: Record<string, any>) {
    const successMetric = this.createMetric(
      'payment_success_total',
      1,
      { payment_method: method },
      { amount, duration, ...metadata }
    );

    const durationMetric = this.createMetric(
      'transaction_duration_seconds',
      duration / 1000, // Convert to seconds
      { payment_method: method, transaction_type: 'payment' },
      { amount, ...metadata }
    );

    this.addMetric(successMetric);
    this.addMetric(durationMetric);
  }

  recordPaymentFailure(method: PaymentMetrics['payment_method'], amount: number, reason: string, metadata?: Record<string, any>) {
    const metric = this.createMetric(
      'payment_failures_total',
      1,
      { payment_method: method, failure_reason: reason },
      { amount, ...metadata }
    );
    this.addMetric(metric);
  }

  // Transaction Metrics
  recordTransactionComplete(metrics: TransactionMetrics) {
    const transactionMetric = this.createMetric(
      'transaction_count_total',
      1,
      {
        transaction_status: metrics.transaction_status,
        transaction_type: metrics.transaction_type,
        geo_region: metrics.geo_region
      },
      { amount: metrics.transaction_amount }
    );

    const amountMetric = this.createMetric(
      'tip_amount_total',
      metrics.transaction_amount,
      {
        transaction_type: metrics.transaction_type,
        geo_region: metrics.geo_region
      }
    );

    this.addMetric(transactionMetric);
    this.addMetric(amountMetric);
  }

  // User Activity Metrics
  recordUserActivity(userId: string, activityType: UserActivityMetrics['activity_type'], screenName?: string, metadata?: Record<string, any>) {
    const metric = this.createMetric(
      'user_activity_total',
      1,
      {
        user_id: userId,
        activity_type: activityType,
        screen_name: screenName
      },
      metadata
    );
    this.addMetric(metric);
  }

  // Error Metrics
  recordError(feature: string, errorMessage: string, level: ErrorMetrics['error_level'] = 'error', stackTrace?: string, metadata?: Record<string, any>) {
    const metric = this.createMetric(
      'error_logs_total',
      1,
      {
        feature,
        error_level: level,
        error_message: errorMessage.substring(0, 100) // Truncate for tags
      },
      {
        full_error_message: errorMessage,
        stack_trace: stackTrace,
        ...metadata
      }
    );

    // Also count feature-specific errors
    const featureErrorMetric = this.createMetric(
      'feature_errors_total',
      1,
      { feature, error_level: level },
      { error_message: errorMessage, stack_trace: stackTrace, ...metadata }
    );

    this.addMetric(metric);
    this.addMetric(featureErrorMetric);
  }

  // Performance Metrics
  recordPerformanceMetric(metricName: string, duration: number, feature: string, metadata?: Record<string, any>) {
    const metric = this.createMetric(
      metricName,
      duration,
      { feature },
      metadata
    );
    this.addMetric(metric);
  }

  // Fraud Detection Metrics
  recordFraudScore(score: number, transactionId: string, metadata?: Record<string, any>) {
    const metric = this.createMetric(
      'fraud_score_current',
      score,
      { transaction_id: transactionId },
      metadata
    );
    this.addMetric(metric);
  }

  recordSuspiciousTransaction(transactionId: string, reason: string, metadata?: Record<string, any>) {
    const metric = this.createMetric(
      'suspicious_transactions_total',
      1,
      { transaction_id: transactionId, reason },
      metadata
    );
    this.addMetric(metric);
  }

  // Authentication Metrics
  recordAuthAttempt(userId: string, success: boolean, method: string = 'standard', metadata?: Record<string, any>) {
    const metricName = success ? 'auth_success_total' : 'auth_failures_total';
    const metric = this.createMetric(
      metricName,
      1,
      { user_id: userId, auth_method: method },
      metadata
    );
    this.addMetric(metric);
  }

  // Network and Device Metrics
  async recordNetworkInfo() {
    try {
      const netInfo = await NetInfo.fetch();
      const metric = this.createMetric(
        'network_info',
        1,
        {
          connection_type: netInfo.type,
          is_connected: netInfo.isConnected ? 'true' : 'false',
          is_wifi_enabled: netInfo.isWifiEnabled ? 'true' : 'false',
        },
        {
          details: netInfo.details,
        }
      );
      this.addMetric(metric);
    } catch (error) {
      console.error('Failed to record network info:', error);
    }
  }

  // Custom Metrics
  recordCustomMetric(name: string, value: number, tags?: Record<string, string>, metadata?: Record<string, any>) {
    const metric = this.createMetric(name, value, tags, metadata);
    this.addMetric(metric);
  }

  // Geolocation Metrics
  recordGeolocation(latitude: number, longitude: number, accuracy: number, metadata?: Record<string, any>) {
    const metric = this.createMetric(
      'user_location',
      1,
      {
        geo_region: this.determineRegionFromCoords(latitude, longitude),
      },
      {
        latitude,
        longitude,
        accuracy,
        ...metadata
      }
    );
    this.addMetric(metric);
  }

  private determineRegionFromCoords(lat: number, lng: number): string {
    // Simplified region detection - in production, use a proper geo service
    if (lat >= 24.396308 && lat <= 49.384358 && lng >= -125.000000 && lng <= -66.934570) {
      return 'us';
    } else if (lat >= 41.40338 && lat <= 83.23324 && lng >= -141.00187 && lng <= -52.64374) {
      return 'canada';
    }
    return 'other';
  }

  private addMetric(metric: MetricData) {
    this.metrics.push(metric);

    // Auto-flush if batch size is reached
    if (this.metrics.length >= this.batchSize) {
      this.flushMetrics();
    }
  }

  private startPeriodicFlush() {
    setInterval(() => {
      if (this.metrics.length > 0) {
        this.flushMetrics();
      }
    }, this.flushInterval);
  }

  private async flushMetrics() {
    if (!this.isInitialized || this.metrics.length === 0) {
      return;
    }

    const metricsToSend = [...this.metrics];
    this.metrics = []; // Clear the buffer

    try {
      await this.sendMetricsToServer(metricsToSend);
      console.log(`Sent ${metricsToSend.length} metrics to monitoring server`);
    } catch (error) {
      console.error('Failed to send metrics:', error);

      // Re-add metrics to buffer if sending failed (with limit)
      if (this.metrics.length < this.batchSize * 2) {
        this.metrics.unshift(...metricsToSend);
      }
    }
  }

  private async sendMetricsToServer(metrics: MetricData[]) {
    if (!this.apiEndpoint) {
      console.warn('Monitoring API endpoint not configured');
      return;
    }

    const payload = {
      metrics,
      metadata: {
        timestamp: Date.now(),
        device_info: this.deviceInfo,
        batch_size: metrics.length,
      },
    };

    const response = await fetch(`${this.apiEndpoint}/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `TipTap/${this.deviceInfo.appVersion}`,
      },
      body: JSON.stringify(payload),
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Integration with existing performance monitor
  integrateWithPerformanceMonitor() {
    const originalEndTiming = performanceMonitor.endTiming.bind(performanceMonitor);

    performanceMonitor.endTiming = (name: string) => {
      const duration = originalEndTiming(name);
      if (duration !== null) {
        this.recordPerformanceMetric('performance_timing', duration, name);
      }
      return duration;
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiEndpoint) {
        return false;
      }

      const response = await fetch(`${this.apiEndpoint}/health`, {
        method: 'GET',
        timeout: 5000,
      });

      return response.ok;
    } catch (error) {
      console.error('Monitoring service health check failed:', error);
      return false;
    }
  }

  // Get current metrics count (for debugging)
  getMetricsCount(): number {
    return this.metrics.length;
  }

  // Force flush (for testing or manual triggers)
  async forceFlush(): Promise<void> {
    await this.flushMetrics();
  }

  // Clear all pending metrics
  clearMetrics(): void {
    this.metrics = [];
  }
}

export const monitoringService = new MonitoringService();

// Helper function to automatically track errors in try-catch blocks
export const withMonitoring = async <T>(
  feature: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    monitoringService.recordPerformanceMetric(
      'operation_duration',
      duration,
      feature,
      { ...metadata, status: 'success' }
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;

    monitoringService.recordError(
      feature,
      errorMessage,
      'error',
      stackTrace,
      { ...metadata, duration }
    );

    throw error;
  }
};