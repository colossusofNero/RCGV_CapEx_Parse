import { NetworkingModule } from 'react-native-ssl-pinning';

export interface PinningConfig {
  hostname: string;
  pins: string[];
  includeSubdomains?: boolean;
  enforceHostnameValidation?: boolean;
}

export interface PinningValidationResult {
  isValid: boolean;
  error?: string;
  hostname?: string;
}

class CertificatePinningService {
  private pinningConfigs: Map<string, PinningConfig> = new Map();
  private initialized = false;

  async initialize(configs: PinningConfig[]): Promise<void> {
    try {
      for (const config of configs) {
        this.pinningConfigs.set(config.hostname, config);

        await NetworkingModule.addCertificate({
          hostname: config.hostname,
          pins: config.pins,
          includeSubdomains: config.includeSubdomains || false,
          enforceHostnameValidation: config.enforceHostnameValidation !== false
        });
      }

      this.initialized = true;
      console.log('Certificate pinning initialized for', configs.length, 'hosts');
    } catch (error) {
      console.error('Failed to initialize certificate pinning:', error);
      throw error;
    }
  }

  async addPin(config: PinningConfig): Promise<void> {
    try {
      this.pinningConfigs.set(config.hostname, config);

      await NetworkingModule.addCertificate({
        hostname: config.hostname,
        pins: config.pins,
        includeSubdomains: config.includeSubdomains || false,
        enforceHostnameValidation: config.enforceHostnameValidation !== false
      });

      console.log('Added certificate pin for:', config.hostname);
    } catch (error) {
      console.error('Failed to add certificate pin:', error);
      throw error;
    }
  }

  async removePin(hostname: string): Promise<void> {
    try {
      this.pinningConfigs.delete(hostname);
      await NetworkingModule.removeCertificate(hostname);
      console.log('Removed certificate pin for:', hostname);
    } catch (error) {
      console.error('Failed to remove certificate pin:', error);
      throw error;
    }
  }

  async validateHostname(hostname: string): Promise<PinningValidationResult> {
    try {
      if (!this.pinningConfigs.has(hostname)) {
        return {
          isValid: false,
          error: 'No pinning configuration found for hostname',
          hostname
        };
      }

      const isValid = await NetworkingModule.validateCertificate(hostname);

      return {
        isValid,
        hostname,
        error: isValid ? undefined : 'Certificate validation failed'
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        hostname
      };
    }
  }

  async makeSecureRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      const hostname = new URL(url).hostname;

      if (this.pinningConfigs.has(hostname)) {
        const validation = await this.validateHostname(hostname);
        if (!validation.isValid) {
          throw new Error(`Certificate pinning validation failed: ${validation.error}`);
        }
      }

      const response = await NetworkingModule.fetch(url, {
        ...options,
        sslPinning: {
          certs: this.getPinsForHostname(hostname)
        }
      });

      return response;
    } catch (error) {
      console.error('Secure request failed:', error);
      throw error;
    }
  }

  async makeSecureStripeRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const stripeHostname = 'api.stripe.com';

    if (!this.pinningConfigs.has(stripeHostname)) {
      await this.addPin({
        hostname: stripeHostname,
        pins: [
          'sha256/+xmQp6CvNu9VFBFvK76BjJeorLpkC+dHhTc0fUdLj3Y=',
          'sha256/2fRAUTCJmxrp1MrFV9fYt7rQJHI+3Kf3l9yP3yCM4K4=',
          'sha256/hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=',
        ],
        includeSubdomains: false,
        enforceHostnameValidation: true
      });
    }

    return this.makeSecureRequest(url, options);
  }

  async makeSecurePaymentRequest(
    url: string,
    paymentData: any,
    options: RequestInit = {}
  ): Promise<Response> {
    const secureOptions: RequestInit = {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TipTap/1.0.0',
        ...options.headers
      },
      body: JSON.stringify(paymentData)
    };

    return this.makeSecureRequest(url, secureOptions);
  }

  getPinningConfig(hostname: string): PinningConfig | undefined {
    return this.pinningConfigs.get(hostname);
  }

  getAllPinningConfigs(): PinningConfig[] {
    return Array.from(this.pinningConfigs.values());
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isPinnedHost(hostname: string): boolean {
    return this.pinningConfigs.has(hostname);
  }

  private getPinsForHostname(hostname: string): string[] {
    const config = this.pinningConfigs.get(hostname);
    return config ? config.pins : [];
  }

  async updatePins(hostname: string, newPins: string[]): Promise<void> {
    const existingConfig = this.pinningConfigs.get(hostname);
    if (!existingConfig) {
      throw new Error(`No existing configuration found for hostname: ${hostname}`);
    }

    const updatedConfig: PinningConfig = {
      ...existingConfig,
      pins: newPins
    };

    await this.removePin(hostname);
    await this.addPin(updatedConfig);
  }

  async rotatePins(hostname: string, additionalPins: string[]): Promise<void> {
    const existingConfig = this.pinningConfigs.get(hostname);
    if (!existingConfig) {
      throw new Error(`No existing configuration found for hostname: ${hostname}`);
    }

    const combinedPins = [...existingConfig.pins, ...additionalPins];
    const uniquePins = Array.from(new Set(combinedPins));

    await this.updatePins(hostname, uniquePins);
  }

  async clearAllPins(): Promise<void> {
    try {
      const hostnames = Array.from(this.pinningConfigs.keys());

      for (const hostname of hostnames) {
        await this.removePin(hostname);
      }

      this.pinningConfigs.clear();
      this.initialized = false;

      console.log('All certificate pins cleared');
    } catch (error) {
      console.error('Failed to clear all pins:', error);
      throw error;
    }
  }

  getDefaultStripeConfig(): PinningConfig {
    return {
      hostname: 'api.stripe.com',
      pins: [
        'sha256/+xmQp6CvNu9VFBFvK76BjJeorLpkC+dHhTc0fUdLj3Y=',
        'sha256/2fRAUTCJmxrp1MrFV9fYt7rQJHI+3Kf3l9yP3yCM4K4=',
        'sha256/hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=',
      ],
      includeSubdomains: false,
      enforceHostnameValidation: true
    };
  }

  getDefaultPaymentProcessorConfigs(): PinningConfig[] {
    return [
      this.getDefaultStripeConfig(),
      {
        hostname: 'api.paypal.com',
        pins: [
          'sha256/kHdGqt9a+ce4iCBdUjZZu/pOt9FkHQPgJUscKEp5p5E=',
          'sha256/2fRAUTCJmxrp1MrFV9fYt7rQJHI+3Kf3l9yP3yCM4K4=',
          'sha256/hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc='
        ],
        includeSubdomains: false,
        enforceHostnameValidation: true
      }
    ];
  }
}

export default new CertificatePinningService();