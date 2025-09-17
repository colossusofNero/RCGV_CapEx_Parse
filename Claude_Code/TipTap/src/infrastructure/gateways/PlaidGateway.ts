import { AbstractPaymentGateway } from './AbstractPaymentGateway';
import { PaymentGateway, PaymentRequest, PaymentResponse } from '@/domain/entities/PaymentGateway';
import PlaidService from '@/services/PlaidService';

export class PlaidGateway extends AbstractPaymentGateway {
  private plaidService = PlaidService.getInstance();

  async processPayment(gateway: PaymentGateway, request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.validateRequest(request);

      if (!request.metadata?.accountId) {
        throw new Error('Account ID is required for ACH payments');
      }

      // Generate idempotency key to prevent duplicates
      const idempotencyKey = this.generateIdempotencyKey();

      // Initiate ACH payment
      const achResult = await this.plaidService.initiateACHPayment({
        accountId: request.metadata.accountId,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        metadata: request.metadata,
      }, idempotencyKey);

      if (achResult.success) {
        return this.createSuccessResponse(
          request.metadata?.transactionId || 'temp_id',
          achResult.paymentId || 'pending_payment_id',
          {
            plaid_payment_id: achResult.paymentId,
            status: achResult.status,
            account_id: request.metadata.accountId
          }
        );
      } else {
        return this.createFailureResponse(
          request.metadata?.transactionId || 'temp_id',
          achResult.errorCode || 'PLAID_ERROR',
          achResult.error || 'ACH payment failed'
        );
      }
    } catch (error: any) {
      return this.createFailureResponse(
        request.metadata?.transactionId || 'temp_id',
        'PLAID_ERROR',
        error.message || 'ACH payment processing failed'
      );
    }
  }

  async refundPayment(gateway: PaymentGateway, transactionId: string, amount?: number): Promise<PaymentResponse> {
    try {
      // ACH refunds are typically handled as reverse payments
      // This would need to be implemented on your backend
      const response = await fetch(`${this.getBackendUrl()}/plaid/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: transactionId,
          amount: amount,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const refundData = await response.json();

      return this.createSuccessResponse(
        transactionId,
        refundData.refund_payment_id,
        { plaid_refund_id: refundData.refund_payment_id }
      );
    } catch (error: any) {
      return this.createFailureResponse(
        transactionId,
        'PLAID_REFUND_ERROR',
        error.message || 'ACH refund processing failed'
      );
    }
  }

  async getPaymentStatus(gateway: PaymentGateway, transactionId: string): Promise<PaymentResponse> {
    try {
      const paymentStatus = await this.plaidService.getACHPaymentStatus(transactionId);

      if (paymentStatus.success) {
        return this.createSuccessResponse(
          transactionId,
          transactionId,
          {
            status: paymentStatus.status,
            payment_id: paymentStatus.paymentId
          }
        );
      } else {
        return this.createFailureResponse(
          transactionId,
          paymentStatus.errorCode || 'PLAID_STATUS_ERROR',
          paymentStatus.error || 'Failed to retrieve payment status'
        );
      }
    } catch (error: any) {
      return this.createFailureResponse(
        transactionId,
        'PLAID_RETRIEVE_ERROR',
        error.message || 'Failed to retrieve payment status'
      );
    }
  }

  async validateGateway(gateway: PaymentGateway): Promise<boolean> {
    // Validate that necessary Plaid configuration exists
    return !!(
      gateway.configuration.clientId &&
      gateway.configuration.environment
    );
  }

  private generateIdempotencyKey(): string {
    return `plaid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBackendUrl(): string {
    return __DEV__
      ? 'http://localhost:3000/api'
      : 'https://your-api.com/api';
  }
}