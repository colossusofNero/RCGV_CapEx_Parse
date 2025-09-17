import { IPaymentGatewayRepository } from '@/domain/repositories/IPaymentGatewayRepository';
import { ITransactionRepository } from '@/domain/repositories/ITransactionRepository';
import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentGatewayType } from '@/domain/entities/PaymentGateway';
import { Transaction, TransactionStatus, TransactionType, PaymentMethod } from '@/domain/entities/Transaction';
import { TipCalculationService, TipCalculationOptions } from './TipCalculationService';
import StripeService from '@/services/StripeService';
import PlaidService from '@/services/PlaidService';

export interface ProcessPaymentRequest {
  amount: number;
  currency: string;
  merchantId: string;
  customerId?: string;
  paymentMethod: PaymentMethod;
  description?: string;
  tipCalculation?: TipCalculationOptions;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
  errorCode?: string;
}

export class PaymentService {
  private stripeService = StripeService.getInstance();
  private plaidService = PlaidService.getInstance();

  constructor(
    private paymentGatewayRepo: IPaymentGatewayRepository,
    private transactionRepo: ITransactionRepository,
    private tipCalculationService: TipCalculationService
  ) {}

  // Select appropriate gateway based on payment method
  private async selectGateway(paymentMethod: PaymentMethod): Promise<PaymentGateway> {
    switch (paymentMethod) {
      case PaymentMethod.STRIPE_CARD:
        return {
          id: 'stripe_default',
          name: 'Stripe Payment Gateway',
          type: PaymentGatewayType.STRIPE,
          isActive: true,
          configuration: {}, // Configuration should be loaded from secure storage
          supportedCurrencies: ['USD', 'EUR', 'GBP'],
          supportedCountries: ['US', 'CA', 'GB', 'FR', 'DE']
        };

      case PaymentMethod.ACH_BANK:
        return {
          id: 'plaid_default',
          name: 'Plaid ACH Gateway',
          type: PaymentGatewayType.PLAID,
          isActive: true,
          configuration: {}, // Configuration should be loaded from secure storage
          supportedCurrencies: ['USD'],
          supportedCountries: ['US']
        };

      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
  }

  // Process payment with automatic gateway selection
  async processPaymentWithMethod(request: ProcessPaymentRequest): Promise<ProcessPaymentResult> {
    try {
      const gateway = await this.selectGateway(request.paymentMethod);
      return await this.processPayment(gateway, request);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment processing failed',
        errorCode: 'GATEWAY_SELECTION_ERROR'
      };
    }
  }

  async processPayment(
    gateway: PaymentGateway,
    request: ProcessPaymentRequest
  ): Promise<ProcessPaymentResult> {
    try {
      // Validate gateway
      const isGatewayValid = await this.paymentGatewayRepo.validateGateway(gateway);
      if (!isGatewayValid) {
        return {
          success: false,
          error: 'Payment gateway configuration is invalid',
          errorCode: 'INVALID_GATEWAY'
        };
      }

      // Calculate tip if requested
      let finalAmount = request.amount;
      let tipCalculation;

      if (request.tipCalculation) {
        tipCalculation = this.tipCalculationService.calculateTip(request.tipCalculation);
        finalAmount = tipCalculation.totalAmount;
      }

      // Create pending transaction
      const transaction = await this.transactionRepo.create({
        amount: finalAmount,
        currency: request.currency,
        status: TransactionStatus.PENDING,
        type: TransactionType.TIP,
        paymentMethod: request.paymentMethod,
        merchantId: request.merchantId,
        customerId: request.customerId,
        description: request.description,
        metadata: {
          ...request.metadata,
          tipCalculation,
          originalAmount: request.amount
        }
      });

      // Process payment through gateway with retry logic
      const paymentRequest: PaymentRequest = {
        amount: finalAmount,
        currency: request.currency,
        description: request.description,
        metadata: {
          transactionId: transaction.id,
          merchantId: request.merchantId,
          ...request.metadata
        },
        customerId: request.customerId
      };

      const paymentResponse = await this.retryWithBackoff(
        () => this.paymentGatewayRepo.processPayment(gateway, paymentRequest),
        3, // max retries
        1000 // base delay in ms
      );

      // Update transaction based on payment response
      let updatedTransaction: Transaction | null;

      if (paymentResponse.status === 'success') {
        updatedTransaction = await this.transactionRepo.update(transaction.id, {
          status: TransactionStatus.COMPLETED,
          processedAt: new Date(),
          metadata: {
            ...transaction.metadata,
            gatewayTransactionId: paymentResponse.gatewayTransactionId,
            gatewayResponse: paymentResponse
          }
        });
      } else if (paymentResponse.status === 'pending') {
        updatedTransaction = await this.transactionRepo.update(transaction.id, {
          status: TransactionStatus.PENDING,
          metadata: {
            ...transaction.metadata,
            gatewayTransactionId: paymentResponse.gatewayTransactionId,
            gatewayResponse: paymentResponse
          }
        });
      } else {
        updatedTransaction = await this.transactionRepo.update(transaction.id, {
          status: TransactionStatus.FAILED,
          failureReason: paymentResponse.errorMessage,
          metadata: {
            ...transaction.metadata,
            gatewayResponse: paymentResponse
          }
        });
      }

      return {
        success: paymentResponse.status === 'success',
        transaction: updatedTransaction || transaction,
        error: paymentResponse.errorMessage,
        errorCode: paymentResponse.errorCode
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment processing failed',
        errorCode: 'PROCESSING_ERROR'
      };
    }
  }

  async refundPayment(
    gateway: PaymentGateway,
    transactionId: string,
    amount?: number
  ): Promise<ProcessPaymentResult> {
    try {
      const transaction = await this.transactionRepo.findById(transactionId);
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
          errorCode: 'TRANSACTION_NOT_FOUND'
        };
      }

      if (transaction.status !== TransactionStatus.COMPLETED) {
        return {
          success: false,
          error: 'Only completed transactions can be refunded',
          errorCode: 'INVALID_TRANSACTION_STATUS'
        };
      }

      const refundResponse = await this.paymentGatewayRepo.refundPayment(
        gateway,
        transactionId,
        amount
      );

      if (refundResponse.status === 'success') {
        const refundTransaction = await this.transactionRepo.create({
          amount: -(amount || transaction.amount),
          currency: transaction.currency,
          status: TransactionStatus.COMPLETED,
          type: TransactionType.REFUND,
          paymentMethod: transaction.paymentMethod,
          merchantId: transaction.merchantId,
          customerId: transaction.customerId,
          description: `Refund for transaction ${transactionId}`,
          metadata: {
            originalTransactionId: transactionId,
            gatewayTransactionId: refundResponse.gatewayTransactionId,
            gatewayResponse: refundResponse
          },
          processedAt: new Date()
        });

        // Update original transaction status if full refund
        if (!amount || amount >= transaction.amount) {
          await this.transactionRepo.update(transactionId, {
            status: TransactionStatus.REFUNDED
          });
        }

        return {
          success: true,
          transaction: refundTransaction
        };
      } else {
        return {
          success: false,
          error: refundResponse.errorMessage,
          errorCode: refundResponse.errorCode
        };
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Refund processing failed',
        errorCode: 'REFUND_ERROR'
      };
    }
  }

  async getPaymentStatus(
    gateway: PaymentGateway,
    transactionId: string
  ): Promise<ProcessPaymentResult> {
    try {
      const transaction = await this.transactionRepo.findById(transactionId);
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
          errorCode: 'TRANSACTION_NOT_FOUND'
        };
      }

      const statusResponse = await this.paymentGatewayRepo.getPaymentStatus(gateway, transactionId);

      // Update local transaction status based on gateway response
      if (statusResponse.status !== 'failed') {
        let newStatus: TransactionStatus;
        switch (statusResponse.status) {
          case 'success':
            newStatus = TransactionStatus.COMPLETED;
            break;
          case 'pending':
            newStatus = TransactionStatus.PENDING;
            break;
          default:
            newStatus = transaction.status;
        }

        if (newStatus !== transaction.status) {
          const updatedTransaction = await this.transactionRepo.update(transactionId, {
            status: newStatus,
            processedAt: newStatus === TransactionStatus.COMPLETED ? new Date() : transaction.processedAt
          });

          return {
            success: true,
            transaction: updatedTransaction || transaction
          };
        }
      }

      return {
        success: true,
        transaction
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get payment status',
        errorCode: 'STATUS_ERROR'
      };
    }
  }

  async cancelPayment(transactionId: string): Promise<ProcessPaymentResult> {
    try {
      const transaction = await this.transactionRepo.findById(transactionId);
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
          errorCode: 'TRANSACTION_NOT_FOUND'
        };
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        return {
          success: false,
          error: 'Only pending transactions can be cancelled',
          errorCode: 'INVALID_TRANSACTION_STATUS'
        };
      }

      const updatedTransaction = await this.transactionRepo.update(transactionId, {
        status: TransactionStatus.CANCELLED
      });

      return {
        success: true,
        transaction: updatedTransaction || transaction
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to cancel payment',
        errorCode: 'CANCEL_ERROR'
      };
    }
  }

  // Retry logic with exponential backoff
  private async retryWithBackoff<T>(
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

  private isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'INVALID_GATEWAY',
      'INSUFFICIENT_FUNDS',
      'CARD_DECLINED',
      'EXPIRED_CARD',
      'INVALID_CVC',
      'USER_CANCELLED',
      'TRANSACTION_NOT_FOUND',
      'INVALID_TRANSACTION_STATUS',
    ];

    return nonRetryableCodes.includes(error.code || error.errorCode);
  }
}