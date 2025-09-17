import { StripeProvider, useStripe, usePaymentSheet, initPaymentSheet, presentPaymentSheet, confirmPaymentSheetPayment } from '@stripe/stripe-react-native';
import { PaymentMethod } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';

export interface StripeConfig {
  publishableKey: string;
  merchantId: string;
  testMode: boolean;
}

export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
}

export interface TokenizationResult {
  token: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  errorCode?: string;
  requiresAction?: boolean;
}

export interface ThreeDSResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

const STORAGE_KEYS = {
  CUSTOMER_ID: 'stripe_customer_id',
  PAYMENT_METHODS: 'stripe_payment_methods',
  CONFIG: 'stripe_config',
};

export class StripeService {
  private static instance: StripeService;
  private config: StripeConfig | null = null;
  private backendBaseUrl: string;

  private constructor() {
    this.backendBaseUrl = __DEV__
      ? 'http://localhost:3000/api'  // Development backend
      : 'https://your-api.com/api';  // Production backend
  }

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  async initialize(config: StripeConfig): Promise<void> {
    this.config = config;
    await EncryptedStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }

  async getConfig(): Promise<StripeConfig | null> {
    if (this.config) return this.config;

    try {
      const storedConfig = await EncryptedStorage.getItem(STORAGE_KEYS.CONFIG);
      if (storedConfig) {
        this.config = JSON.parse(storedConfig);
        return this.config;
      }
    } catch (error) {
      console.error('Failed to retrieve Stripe config:', error);
    }
    return null;
  }

  // Generate idempotency key for preventing duplicate charges
  generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create payment intent on backend
  async createPaymentIntent(request: PaymentIntentRequest, idempotencyKey: string): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/stripe/payment-intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  // Tokenize payment method for PCI compliance
  async tokenizeCard(cardDetails: {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
  }): Promise<TokenizationResult> {
    try {
      // In a real implementation, this would use Stripe Elements or similar
      // For now, we simulate the tokenization process
      const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        token,
        last4: cardDetails.number.slice(-4),
        brand: this.detectCardBrand(cardDetails.number),
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
      };
    } catch (error: any) {
      throw new Error(`Card tokenization failed: ${error.message}`);
    }
  }

  // Process payment with 3D Secure support
  async processPayment(
    clientSecret: string,
    paymentMethodId?: string,
    billingDetails?: any
  ): Promise<PaymentResult> {
    try {
      // Initialize payment sheet if not already done
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'TipTap',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: billingDetails,
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        return {
          success: false,
          error: initError.message,
          errorCode: initError.code,
        };
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          return {
            success: false,
            error: 'Payment was cancelled by user',
            errorCode: 'USER_CANCELLED',
          };
        }
        return {
          success: false,
          error: presentError.message,
          errorCode: presentError.code,
        };
      }

      // Payment succeeded
      const paymentIntentId = this.extractPaymentIntentId(clientSecret);
      return {
        success: true,
        paymentIntentId,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment processing failed',
        errorCode: 'PROCESSING_ERROR',
      };
    }
  }

  // Handle 3D Secure authentication
  async handle3DSecure(clientSecret: string): Promise<ThreeDSResult> {
    try {
      const { error } = await confirmPaymentSheetPayment();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const paymentIntentId = this.extractPaymentIntentId(clientSecret);
      return {
        success: true,
        paymentIntentId,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || '3D Secure authentication failed',
      };
    }
  }

  // Save customer payment method
  async savePaymentMethod(paymentMethod: PaymentMethod): Promise<void> {
    try {
      const existingMethods = await this.getStoredPaymentMethods();
      const updatedMethods = [...existingMethods, paymentMethod];

      await EncryptedStorage.setItem(
        STORAGE_KEYS.PAYMENT_METHODS,
        JSON.stringify(updatedMethods)
      );
    } catch (error) {
      console.error('Failed to save payment method:', error);
      throw new Error('Failed to save payment method');
    }
  }

  // Retrieve stored payment methods
  async getStoredPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const stored = await EncryptedStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve payment methods:', error);
      return [];
    }
  }

  // Get or create customer
  async getOrCreateCustomer(email: string, name?: string): Promise<string> {
    try {
      let customerId = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMER_ID);

      if (!customerId) {
        const response = await fetch(`${this.backendBaseUrl}/stripe/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, name }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        customerId = data.customerId;
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMER_ID, customerId);
      }

      return customerId;
    } catch (error: any) {
      throw new Error(`Failed to get or create customer: ${error.message}`);
    }
  }

  // Retry logic with exponential backoff
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Webhook signature verification (for backend)
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // In a real implementation, this would use Stripe's webhook signature verification
    // This is a placeholder for the verification logic
    console.warn('Webhook signature verification not implemented');
    return true;
  }

  // Helper methods
  private detectCardBrand(cardNumber: string): string {
    const number = cardNumber.replace(/\D/g, '');

    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6/.test(number)) return 'discover';

    return 'unknown';
  }

  private extractPaymentIntentId(clientSecret: string): string {
    return clientSecret.split('_secret_')[0];
  }

  private isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'card_declined',
      'insufficient_funds',
      'invalid_cvc',
      'expired_card',
      'incorrect_cvc',
      'processing_error',
      'USER_CANCELLED',
    ];

    return nonRetryableCodes.includes(error.code || error.errorCode);
  }

  // Cleanup methods
  async clearStoredData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.CUSTOMER_ID),
        EncryptedStorage.removeItem(STORAGE_KEYS.PAYMENT_METHODS),
        EncryptedStorage.removeItem(STORAGE_KEYS.CONFIG),
      ]);
    } catch (error) {
      console.error('Failed to clear Stripe data:', error);
    }
  }
}

export default StripeService;