export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum TransactionType {
  TIP = 'tip',
  PAYMENT = 'payment',
  REFUND = 'refund'
}

export enum PaymentMethod {
  NFC = 'nfc',
  QR_CODE = 'qr_code',
  MANUAL = 'manual',
  STRIPE_CARD = 'stripe_card',
  ACH_BANK = 'ach_bank'
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  merchantId: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

export interface TipCalculation {
  baseAmount: number;
  tipPercentage: number;
  tipAmount: number;
  totalAmount: number;
  currency: string;
}