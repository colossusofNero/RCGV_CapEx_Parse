// Unified Payment Service - Consolidates both PaymentService implementations
import { PaymentGateway, PaymentRequest, PaymentResponse } from '@/domain/entities/PaymentGateway';
import { Transaction, TransactionStatus, PaymentMethod } from '@/domain/entities/Transaction';
import { ErrorHandler } from '@/shared/errors/ErrorHandler';
import { PaymentError, PaymentErrorCode } from '@/shared/errors/PaymentError';
import { RetryService } from '@/shared/services/RetryService';
import { SecurityManager } from '@/security/SecurityManager';

export interface UnifiedPaymentRequest {
  amount: number;
  currency: string;
  merchantId: string;
  customerId?: string;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transaction?: Transaction;
  error?: PaymentError;
}

export class UnifiedPaymentService {
  private static instance: UnifiedPaymentService;
  private retryService = new RetryService();

  public static getInstance(): UnifiedPaymentService {
    if (!UnifiedPaymentService.instance) {
      UnifiedPaymentService.instance = new UnifiedPaymentService();
    }
    return UnifiedPaymentService.instance;
  }

  async processPayment(request: UnifiedPaymentRequest): Promise<PaymentResult> {
    try {
      // Security validation first
      const securityCheck = await SecurityManager.authenticateForPayment(
        `temp_${Date.now()}`,
        request.amount,
        request.merchantId
      );

      if (!securityCheck.overallApproved) {
        throw new PaymentError(
          PaymentErrorCode.SECURITY_CHECK_FAILED,
          this.getSecurityErrorMessage(securityCheck)
        );
      }

      // Select appropriate gateway
      const gateway = await this.selectGateway(request.paymentMethod);

      // Process with retry logic
      return await this.retryService.executeWithRetry(
        () => this.executePayment(gateway, request, securityCheck),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          shouldRetry: (error) => !this.isNonRetryableError(error)
        }
      );

    } catch (error) {
      return ErrorHandler.handlePaymentError(error);
    }
  }

  private async executePayment(
    gateway: PaymentGateway,
    request: UnifiedPaymentRequest,
    securityCheck: any
  ): Promise<PaymentResult> {
    // Create pending transaction
    const transactionId = this.generateTransactionId(request.paymentMethod);

    const transaction: Transaction = {
      id: transactionId,
      amount: request.amount,
      currency: request.currency,
      status: TransactionStatus.PENDING,
      paymentMethod: request.paymentMethod,
      merchantId: request.merchantId,
      customerId: request.customerId,
      description: request.description,
      riskScore: securityCheck.riskScore?.score,
      securityFlags: securityCheck.riskScore?.reasons,
      timestamp: new Date().toISOString(),
      metadata: request.metadata
    };

    // Process payment through gateway
    const paymentRequest: PaymentRequest = {
      amount: request.amount,
      currency: request.currency,
      description: request.description,
      metadata: {
        transactionId,
        merchantId: request.merchantId,
        ...request.metadata
      },
      customerId: request.customerId
    };

    const response = await gateway.processPayment(paymentRequest);

    // Update transaction status
    const updatedTransaction = {
      ...transaction,
      status: response.status === 'success'
        ? TransactionStatus.COMPLETED
        : TransactionStatus.FAILED,
      processedAt: new Date().toISOString()
    };

    // Save transaction
    await this.saveTransaction(updatedTransaction);

    return {
      success: response.status === 'success',
      transaction: updatedTransaction,
      error: response.status !== 'success'
        ? new PaymentError(PaymentErrorCode.PAYMENT_FAILED, response.errorMessage)
        : undefined
    };
  }

  private async selectGateway(paymentMethod: PaymentMethod): Promise<PaymentGateway> {
    // Gateway selection logic consolidated
    const gatewayMap = {
      [PaymentMethod.STRIPE_CARD]: () => this.createStripeGateway(),
      [PaymentMethod.ACH_BANK]: () => this.createPlaidGateway(),
    };

    const createGateway = gatewayMap[paymentMethod];
    if (!createGateway) {
      throw new PaymentError(
        PaymentErrorCode.UNSUPPORTED_PAYMENT_METHOD,
        `Unsupported payment method: ${paymentMethod}`
      );
    }

    return createGateway();
  }

  private generateTransactionId(method: PaymentMethod): string {
    return `${method}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSecurityErrorMessage(securityCheck: any): string {
    if (!securityCheck.sessionValid) {
      return 'Session expired. Please log in again.';
    }
    if (!securityCheck.fraudRiskAcceptable && securityCheck.riskScore) {
      return `Payment blocked due to security risk: ${securityCheck.riskScore.reasons.join(', ')}`;
    }
    if (!securityCheck.biometricsPassed) {
      return 'Biometric authentication required for payment';
    }
    return 'Payment authentication failed';
  }

  private isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      PaymentErrorCode.INVALID_CREDENTIALS,
      PaymentErrorCode.INSUFFICIENT_FUNDS,
      PaymentErrorCode.CARD_DECLINED,
      PaymentErrorCode.USER_CANCELLED,
      PaymentErrorCode.SECURITY_CHECK_FAILED
    ];

    return nonRetryableCodes.includes(error.code);
  }

  // Additional methods...
  private createStripeGateway(): PaymentGateway { /* ... */ }
  private createPlaidGateway(): PaymentGateway { /* ... */ }
  private async saveTransaction(transaction: Transaction): Promise<void> { /* ... */ }
}