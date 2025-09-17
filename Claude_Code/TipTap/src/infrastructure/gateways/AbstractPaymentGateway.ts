import { IPaymentGatewayRepository } from '@/domain/repositories/IPaymentGatewayRepository';
import { PaymentGateway, PaymentRequest, PaymentResponse } from '@/domain/entities/PaymentGateway';

export abstract class AbstractPaymentGateway implements IPaymentGatewayRepository {
  protected gateway: PaymentGateway;

  constructor(gateway: PaymentGateway) {
    this.gateway = gateway;
  }

  abstract processPayment(gateway: PaymentGateway, request: PaymentRequest): Promise<PaymentResponse>;
  abstract refundPayment(gateway: PaymentGateway, transactionId: string, amount?: number): Promise<PaymentResponse>;
  abstract getPaymentStatus(gateway: PaymentGateway, transactionId: string): Promise<PaymentResponse>;
  abstract validateGateway(gateway: PaymentGateway): Promise<boolean>;

  protected validateRequest(request: PaymentRequest): void {
    if (!request.amount || request.amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    if (!request.currency) {
      throw new Error('Currency is required');
    }
    if (!this.gateway.supportedCurrencies.includes(request.currency)) {
      throw new Error(`Currency ${request.currency} not supported by gateway`);
    }
  }

  protected createSuccessResponse(transactionId: string, gatewayTransactionId?: string, metadata?: Record<string, any>): PaymentResponse {
    return {
      transactionId,
      status: 'success',
      gatewayTransactionId,
      metadata
    };
  }

  protected createFailureResponse(transactionId: string, errorCode: string, errorMessage: string): PaymentResponse {
    return {
      transactionId,
      status: 'failed',
      errorCode,
      errorMessage
    };
  }

  protected createPendingResponse(transactionId: string, gatewayTransactionId?: string): PaymentResponse {
    return {
      transactionId,
      status: 'pending',
      gatewayTransactionId
    };
  }
}