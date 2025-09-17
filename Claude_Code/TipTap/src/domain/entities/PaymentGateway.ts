export enum PaymentGatewayType {
  STRIPE = 'stripe',
  PLAID = 'plaid',
  SQUARE = 'square',
  PAYPAL = 'paypal',
  ADYEN = 'adyen',
  MOCK = 'mock'
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: PaymentGatewayType;
  isActive: boolean;
  configuration: Record<string, any>;
  supportedCurrencies: string[];
  supportedCountries: string[];
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
  customerId?: string;
  paymentMethodId?: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  gatewayTransactionId?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}